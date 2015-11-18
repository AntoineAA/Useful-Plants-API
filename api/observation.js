var Joi = require('joi');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var GeoPoint = require('geopoint');
var request = require('request').defaults({ jar: true });
var _ = require('underscore');
var async = require('async');

var env = require('../env');

var json_query = require('./api_species_default_query.json');

// Elasticsearch client
var client = new elasticsearch.Client({
	host: env.elastic_host + ':' + env.elastic_port,
	log: 'error'
});

// API configuration
var max_size = env.api_geo_max_size;

//LOC
var tab_obs = {};
var tab_obs_pnet = {};
var tab_sp = {};

module.exports.route = {
	method: 'GET',
	path: '/observation',
	handler: function (request, reply) {

		tab_obs = {};
		tab_obs_pnet = {};
		tab_sp = {};

		var query = JSON.parse(JSON.stringify(json_query)).query;

		// Query's parameters
		var latitude = request.query['latitude'] || null;
		var longitude = request.query['longitude'] || null;

		var gbif_key = request.query['gbif_key'] || null;
		var pnet_id = request.query['pnet_id'] || null;

		var check_only = request.query['check_only'] || false;

		var params = {
			index: env.elastic_data_index,
			type: env.elastic_data_type,
			ignore: [404],
			from: 0,
			size: max_size,
			body: {
				query: query,
				sort: [
					'name.untouched'
				]
			}
		};

		var point = new GeoPoint(latitude, longitude);
		var bounding = point.boundingCoordinates(env.gbif_geometry_distance_km, null, true);

		var top_left = { latitude: bounding[1]._degLat, longitude: bounding[0]._degLon };
		var top_right = { latitude: bounding[1]._degLat, longitude: bounding[1]._degLon };
		var bottom_right = { latitude: bounding[0]._degLat, longitude: bounding[1]._degLon };
		var bottom_left = { latitude: bounding[0]._degLat, longitude: bounding[0]._degLon };

		var wkt_geometry = 'POLYGON(('
			+ top_left.longitude + ' ' + top_left.latitude + ', '
			+ top_right.longitude + ' ' + top_right.latitude + ', '
			+ bottom_right.longitude + ' ' + bottom_right.latitude + ', '
			+ bottom_left.longitude + ' ' + bottom_left.latitude + ', '
			+ top_left.longitude + ' ' + top_left.latitude
			+ '))';

		var lat_min = (top_left.latitude < bottom_left.latitude) ? top_left.latitude : bottom_left.latitude;
		var lat_max = (top_left.latitude > bottom_left.latitude) ? top_left.latitude : bottom_left.latitude;

		var lon_min = (top_left.longitude < top_right.longitude) ? top_left.longitude : top_right.longitude;
		var lon_max = (top_left.longitude > top_right.longitude) ? top_left.longitude : top_right.longitude;

		var range_geometry = ''
			+ 'lat<double>:[' + lat_min + ' TO ' + lat_max + ']'
			+ ' AND '
			+ 'lon<double>:[' + lon_min + ' TO ' + lon_max + ']';
		
		var url_gbif = env.gbif_api_occurence_geometry + wkt_geometry;

		var url_pnet = env.ds_api_occurence_geometry + range_geometry;

		if (gbif_key != null) {
			url_gbif = url_gbif.replace('taxonKey=6', 'taxonKey=' + gbif_key);
		}

		if (pnet_id != null) {
			url_pnet = url_pnet.replace('q=', 'q=taxa:"' + encodeURI(pnet_id) + '" AND ');
		}

		if (check_only && (gbif_key != null || pnet_id != null)) {
			var found = false;
			var functions = [];
			if (gbif_key != null) {
				functions.push(
					function (cb) {
						check_occurrences(url_gbif, 0, function(exists) {
							if (!found) {
								found = exists;
							}
							cb();
						});
					}
				);
			}
			if (pnet_id != null) {
				functions.push(
					function (cb) {
						check_occurrences_pnet(url_pnet, 0, function(exists) {
							if (!found) {
								found = exists;
							}
							cb();
						});
					}
				);
			}
			async.parallel(functions, function (err, results) {
				reply({ exists: found });
			});
		} else {
			var or_query = [];
			async.parallel([
				function (cb) {
					get_occurrences(url_gbif, 0, [], function(tab_ids) {
						tab_ids = _.unique(tab_ids);
						or_query.push({ in: { 'gbif_key': tab_ids } });
						cb();
					});
				},
				function (cb) {
					get_occurrences_pnet(url_pnet, 0, [], function(tab_ids) {
						tab_ids = _.unique(tab_ids);
						or_query.push({ in: { 'pnet_id': tab_ids } });
						cb();
					});
				}
			], function (err, results) {
				params.body.query.bool.must.push({
					constant_score: { filter: {
						or: or_query
					} }
				});

				client.search(params).then(function (resp) {
					clean_response(resp, function (ret) {
						for (key in tab_obs) {
							if (!(tab_obs[key].gbif_id in tab_sp)) {
								delete tab_obs[key];
							}
							else {
								tab_obs[key].type = "Feature";
								tab_obs[key].geometry = {
									type: "Point",
									coordinates: [tab_obs[key].lng, tab_obs[key].lat]
								};
								tab_obs[key].properties = {
									id: tab_sp[tab_obs[key].gbif_id].id,
									name: tab_sp[tab_obs[key].gbif_id].name,
									source: env.gbif_api_label
								}

								delete tab_obs[key].lat;
								delete tab_obs[key].lng;
								delete tab_obs[key].gbif_id;
							}
						}

						for (key in tab_obs_pnet) {
							if (!(tab_obs_pnet[key].pnet_id in tab_sp)) {
								delete tab_obs_pnet[key];
							}
							else {
								tab_obs_pnet[key].type = "Feature";
								tab_obs_pnet[key].geometry = {
									type: "Point",
									coordinates: [tab_obs_pnet[key].lng, tab_obs_pnet[key].lat]
								};
								tab_obs_pnet[key].properties = {
									id: tab_sp[tab_obs_pnet[key].pnet_id].id,
									name: tab_sp[tab_obs_pnet[key].pnet_id].name,
									source: env.ds_api_label
								}

								delete tab_obs_pnet[key].lat;
								delete tab_obs_pnet[key].lng;
								delete tab_obs_pnet[key].pnet_id;
							}
						}

						var response = reply(_.union(_.values(tab_obs), _.values(tab_obs_pnet))).hold();
						response.header('Access-Control-Allow-Origin', '*');
						response.send();
					});
				}, function (err) {
					console.log(err.message);
				});
			});
		}
	},
	config: {
		tags: ['api'],
		description: 'Get observations list',
		notes: 'Returns the observations list',
		validate: {
			query: {
				latitude: Joi.number()
					.required()
					.min(-90)
					.max(90)
					.description('Latitude'),

				longitude: Joi.number()
					.required()
					.min(-180)
					.max(180)
					.description('Longitude'),

				gbif_key: Joi.number()
					.optional()
					.description('GBIF key'),

				pnet_id: Joi.string()
					.optional()
					.description('Pl@ntNet id'),

				check_only: Joi.boolean()
					.optional()
					.default(false)
					.description(
						'Check if there are some geo data'
					)
			}
		}
	}
};

var clean_response = function (response, callback) {
	if (response && response.hits && response.hits.hits && response.hits.hits.length > 0) {
		response.hits.hits.forEach(function (item) {
			if (item && item._source) {
				if (item._source.gbif_key) {
					tab_sp[item._source.gbif_key] = {
						name: item._source.name,
						id: item._id
					};
				}
				if (item._source.pnet_id) {
					tab_sp[item._source.pnet_id] = {
						name: item._source.name,
						id: item._id
					};
				}
			}
		});
	}
	callback(response);
}

var get_occurrences = function(url, offset, tab_ids, callback) {
	request(url + env.gbif_api_offset + offset, function (error, response, body) {
		if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json') {
			var json = JSON.parse(body);
			if (json.results.length > 0) {
				json.results.forEach(function (result) {
					if (result.key && result.speciesKey && result.decimalLongitude && result.decimalLatitude) {
						tab_ids.push(result.speciesKey);
						tab_obs[result.key] = {
							gbif_id: result.speciesKey,
							lat: result.decimalLatitude,
							lng: result.decimalLongitude
						};
					}
				});
				if (json.endOfRecords) {
					callback(tab_ids);
				} else {
					get_occurrences(url, (offset + json.limit), tab_ids, callback);
				}
			} else {
				callback(tab_ids);
			}
		} else {
			if (response.statusCode == 503) {
				get_occurrences(url, (offset), tab_ids, callback);
			} else {
				callback(tab_ids);
			}
		}
	});
}

var get_occurrences_pnet = function(url, offset, tab_ids, callback) {
	var log_url = env.ds_api_login;
	var identifiers = { name: env.ds_api_user, password: env.ds_api_password };
	var options = { method: 'post', body: identifiers, json: true, url: log_url };

	request(options, function (error, response, body) {
		if (!error && body.ok) {
			request(url + env.ds_api_offset + offset, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var json = JSON.parse(body);
					if (json.rows.length > 0) {
						json.rows.forEach(function (result) {
							if (result.doc && result.doc._id && result.doc.taxa && result.doc.geoloc && result.doc.geoloc.lon && result.doc.geoloc.lat) {
								tab_ids.push(result.doc.taxa);
								tab_obs_pnet[result.doc._id] = {
									pnet_id: result.doc.taxa,
									lat: result.doc.geoloc.lat,
									lng: result.doc.geoloc.lon
								};
							}
						});
						if (json.total_rows <= offset) {
							callback(tab_ids);
						} else {
							get_occurrences_pnet(url, (offset + json.limit), tab_ids, callback);
						}
					} else {
						callback(tab_ids);
					}
				} else {
					callback(tab_ids);
				}
			});
		} else {
			callback(tab_ids);
		}
	});
}

var check_occurrences = function(url, offset, callback) {
	url = url.replace('&limit=300', '&limit=1');

	request(url + env.gbif_api_offset + offset, function (error, response, body) {
		if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json') {
			var json = JSON.parse(body);
			if (json.results.length > 0) {
				callback(true);
			} else {
				callback(false);
			}
		} else {
			if (response.statusCode == 503) {
				check_occurrences(url, offset, callback);
			} else {
				callback(false);
			}
		}
	});
}

var check_occurrences_pnet = function(url, offset, callback) {
	url = url.replace('&limit=300', '&limit=1');
	
	var log_url = env.ds_api_login;
	var identifiers = { name: env.ds_api_user, password: env.ds_api_password };
	var options = { method: 'post', body: identifiers, json: true, url: log_url };

	request(options, function (error, response, body) {
		if (!error && body.ok) {
			request(url + env.ds_api_offset + offset, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var json = JSON.parse(body);
					if (json.rows.length > 0) {
						callback(true);
					} else {
						callback(false);
					}
				} else {
					callback(false);
				}
			});
		} else {
			callback(false);
		}
	});
}