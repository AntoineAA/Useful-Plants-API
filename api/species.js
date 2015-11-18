var Joi = require('joi');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var GeoPoint = require('geopoint');
var request = require('request').defaults({ jar: true });
var _ = require('underscore');
var async = require('async');

var env = require('../env');

var json_query = require('./api_species_default_query.json');
var json_facets = require('./api_species_default_facets.json');

// Elasticsearch client
var client = new elasticsearch.Client({
	host: env.elastic_host + ':' + env.elastic_port,
	log: 'error'
});

// API configuration
var default_from = env.api_default_from;
var default_size = env.api_default_size;
var default_min_size = env.api_default_min_size;
var default_max_size = env.api_default_max_size;
var default_include_facets = env.api_default_include_facets;
var default_min_score = env.api_default_min_score;
var default_slop = env.api_default_slop;

//LOC
var max_size = env.api_geo_max_size;
var tab_obs = {};
var tab_obs_pnet = {};
var tab_sp = {};

module.exports.route = {
	method: 'GET',
	path: '/species',
	handler: function (request, reply) {
		tab_obs = {};
		tab_obs_pnet = {};
		tab_sp = {};

		var custom_error = {
			statusCode: 400,
			error: 'Bad request',
			message: ' is not allowed to be empty',
			validation: {
				source: 'query',
				keys: []
			}
		};

		var query = JSON.parse(JSON.stringify(json_query)).query;
		var facets = JSON.parse(JSON.stringify(json_facets)).facets;

		// Query's parameters
		var from = request.query['from'] || default_from;
		var size = request.query['size'] || default_size;

		var include_facets = request.query['include_facets'] || default_include_facets;

		var family = request.query['family'] || null;
		var genus = request.query['genus'] || null;

		var usage_cat = request.query['usage_cat'] || null;
		var usage_type = request.query['usage_type'] || null;

		var traits = request.query['traits'] || null;
		var pnet = request.query['pnet'] || null;

		var current_flower = request.query['current_flower'] || false;
		var current_fruit = request.query['current_fruit'] || false;
		var current_leaf = request.query['current_leaf'] || false;

		var search = request.query['search'] || null;

		var latitude = request.query['latitude'] || null;
		var longitude = request.query['longitude'] || null;

		var include_geojson = request.query['include_geojson'] || false;

		var sort_by = request.query['sort_by'] || null;

		var params = {
			index: env.elastic_data_index,
			type: env.elastic_data_type,
			ignore: [404],
			from: from,
			size: size,
			body: {
				query: query,
				sort: [
					'name.untouched'
				]
			}
		};

		if (sort_by != null) {
			if (sort_by == 'family') {
				params.body.sort = [];
				params.body.sort.push('family.name.untouched');
				params.body.sort.push('name.untouched');
			} else if (sort_by == 'score') {
				params.body.sort = [];
			}
		}

		if (include_facets) {
			params.body['aggs'] = facets;
		}

		if (usage_cat != null) {
			params.body.query.bool.must[0].nested.query.bool.must.push({
				match: { 'usages.usage.untouched': usage_cat }
			});

			if (include_facets) {
				var tmp = JSON.parse(JSON.stringify(params.body.aggs.sub_usages.aggs));
				params.body.aggs.sub_usages.aggs['filtered'] = {
					filter: {
						term: { 'usages.usage.untouched': usage_cat }
					},
					aggs: tmp
				};
			}
		}

		if (usage_type != null) {
			params.body.query.bool.must[0].nested.query.bool.must.push({
				match: { 'usages.names.untouched': usage_type }
			});

			if (include_facets) {
				var tmp = JSON.parse(JSON.stringify(params.body.aggs.usages.aggs));
				params.body.aggs.usages.aggs['filtered'] = {
					filter: {
						term: { 'usages.names.untouched': usage_type }
					},
					aggs: tmp
				};
			}
		}

		if (family != null) {
			params.body.query.bool.must.push({
				match: { 'family.name.untouched': family }
			});
		}

		if (genus != null) {
			params.body.query.bool.must.push({
				match: { 'genus.name.untouched': genus }
			});
		}

		if (pnet != null) {
			params.body.query.bool.must.push({
				nested: {
					path: 'pnet.projects',
					query: {
						bool: {
							must: [ { match: { 'pnet.projects.name.untouched': pnet } } ]
						}
					}
				}
			});
		}

		var now = new Date();

		if (current_flower || current_fruit || current_leaf) {
			var now_dd = now.getDate();
			var now_mm = (now.getMonth() + 1 < 10) ? '0' + (now.getMonth() + 1) : (now.getMonth() + 1) + '';

			var prev_mm = now.getMonth();
			if (prev_mm < 1) {
				prev_mm = 12;
			}
			prev_mm = (prev_mm < 10) ? '0' + prev_mm : prev_mm + '';

			var next_mm = now.getMonth() + 2;
			if (next_mm > 12) {
				next_mm = 1;
			}
			next_mm = (next_mm < 10) ? '0' + next_mm : next_mm + '';

			var other_mm = (now_dd > 15) ? next_mm : prev_mm ;
		}

		if (current_flower) {
			params.body.query.bool.must.push({
				nested: {
					path: 'pnet.images',
					query: {
						bool: {
							must: [
								{ match: { 'pnet.images.type.untouched': 'fleur' } }
							],
							should: [
								{ wildcard: { 'pnet.images.date.untouched': '*-' + now_mm + '-*' } },
								{ wildcard: { 'pnet.images.date.untouched': '*-' + other_mm + '-*' } }
							],
							minimum_should_match: 1
						}
					}
				}
			});
		}

		if (current_fruit) {
			params.body.query.bool.must.push({
				nested: {
					path: 'pnet.images',
					query: {
						bool: {
							must: [
								{ match: { 'pnet.images.type.untouched': 'fruit' } }
							],
							should: [
								{ wildcard: { 'pnet.images.date.untouched': '*-' + now_mm + '-*' } },
								{ wildcard: { 'pnet.images.date.untouched': '*-' + other_mm + '-*' } }
							],
							minimum_should_match: 1
						}
					}
				}
			});
		}

		if (current_leaf) {
			params.body.query.bool.must.push({
				nested: {
					path: 'pnet.images',
					query: {
						bool: {
							must: [
								{ match: { 'pnet.images.type.untouched': 'feuille' } }
							],
							should: [
								{ wildcard: { 'pnet.images.date.untouched': '*-' + now_mm + '-*' } },
								{ wildcard: { 'pnet.images.date.untouched': '*-' + other_mm + '-*' } }
							],
							minimum_should_match: 1
						}
					}
				}
			});
		}

		if (traits != null && (traits instanceof Array)) {
			traits.forEach(function (trait) {
				if (trait && trait != '' && trait.indexOf('|') > -1) {
					var tab = trait.split('|');
					if (tab.length == 2 && tab[0] != '' && tab[1] != '') {
						params.body.query.bool.must.push({
							nested: {
								path: 'traits',
								query: { bool: { must: [
									{ match: { 'traits.name.untouched': tab[0] } },
									{ match: { 'traits.values.untouched': tab[1] } }
								] } }
							}
						});
					}
				}
			});
		}

		if (search != null) {
			params.body['min_score'] = default_min_score;
			params.body.query.bool.must.push({
				match_phrase_prefix: {
					_all: { query: search, slop: default_slop }
				}
			});
		}

		if (latitude != null && longitude == null) {
			custom_error.message = 'longitude' + custom_error.message;
			custom_error.validation.keys.push('longitude');
			reply(custom_error).code(400);
			return;
		}

		if (longitude != null && latitude == null) {
			custom_error.message = 'latitude' + custom_error.message;
			custom_error.validation.keys.push('latitude');
			reply(custom_error).code(400);
			return;
		}

		if (include_geojson) {
			if (longitude == null) {
				custom_error.message = 'longitude' + custom_error.message;
				custom_error.validation.keys.push('longitude');
				reply(custom_error).code(400);
				return;
			}
			if (latitude == null) {
				custom_error.message = 'latitude' + custom_error.message;
				custom_error.validation.keys.push('latitude');
				reply(custom_error).code(400);
				return;
			}
		}

		if (latitude != null && longitude != null) {
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

			if (include_geojson) {
				var or_query = [];
				async.parallel([
					function (cb) {
						get_occurrences_geo(url_gbif, 0, [], function(tab_ids) {
							tab_ids = _.unique(tab_ids);
							or_query.push({ in: { 'gbif_key': tab_ids } });
							cb();
						});
					},
					function (cb) {
						get_occurrences_geo_pnet(url_pnet, 0, [], function(tab_ids) {
							tab_ids = _.unique(tab_ids);
							or_query.push({ in: { 'pnet_id': tab_ids } });
							cb();
						});
					}
				], function (err, results) {
					params.from = 0;
					params.size = max_size;

					params.body.query.bool.must.push({
						constant_score: { filter: {
							or: or_query
						} }
					});

					client.search(params).then(function (resp) {
						clean_response_geo(resp, function (ret) {
							for (key in tab_obs) {
								if (!(tab_obs[key].gbif_id in tab_sp)) {
									delete tab_obs[key];
								}
								else {
									tab_obs[key].type = 'Feature';
									tab_obs[key].geometry = {
										type: 'Point',
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
									tab_obs_pnet[key].type = 'Feature';
									tab_obs_pnet[key].geometry = {
										type: 'Point',
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
							reply(ret);
						});
					}, function (err) {
						console.log(err.message);
					});
				});
			}
		} else {
			client.search(params).then(function (resp) {
				clean_response(resp, function (ret) {
					reply(ret);
				});
			}, function (err) {
				console.log(err.message);
			});
		}
	},
	config: {
		tags: ['api'],
		description: 'Get species list',
		notes: 'Returns the species list',
		validate: {
			query: {
				from: Joi.number().integer()
					.optional()
					.default(default_from)
					.min(default_from)
					.description(
						'The start index '
						+ '(default: ' + default_from + ', min: ' + default_from + ')'
					),

				size: Joi.number().integer()
					.optional()
					.default(default_size)
					.min(default_min_size)
					.max(default_max_size)
					.description(
						'The maximum number of results to return '
						+ '(default: ' + default_size + ', min: ' + default_min_size + ', max: ' + default_max_size + ')'
					),

				include_facets: Joi.boolean()
					.optional()
					.default(default_include_facets)
					.description(
						'Include the facets in the response\'s body '
						+ '(default: ' + default_include_facets + ')'
					),

				pnet: Joi.string()
					.optional()
					.min(1)
					.description('Pl@ntNet DataStore project filter'),

				family: Joi.string()
					.optional()
					.min(1)
					.description('Family name filter'),

				genus: Joi.string()
					.optional()
					.min(1)
					.description('Genus name filter'),

				usage_cat: Joi.string()
					.optional()
					.min(1)
					.description('Usage category (first level) filter'),

				usage_type: Joi.string()
					.optional()
					.min(1)
					.description('Usage type (second level) filter'),

				traits: Joi.array()
					.items(Joi.string().min(3).regex(/\|/, 'pipe "|" required'))
					.optional()
					.min(1)
					.unique()
					.description('["Trait\'s label|Trait\'s value","...",...]'),

				search: Joi.string()
					.optional()
					.min(1)
					.description('Search filter - key words'),

				latitude: Joi.number()
					.optional()
					.min(-90)
					.max(90)
					.description('Latitude'),

				longitude: Joi.number()
					.optional()
					.min(-180)
					.max(180)
					.description('Longitude'),

				include_geojson: Joi.boolean()
					.optional()
					.default(false)
					.description(
						'Get data as GeoJSON (required: latitude, longitude)'
					),

				current_flower: Joi.boolean()
					.optional()
					.default(false)
					.description(
						'Get the species that currently have flowers'
					),

				current_fruit: Joi.boolean()
					.optional()
					.default(false)
					.description(
						'Get the species that currently have fruits'
					),

				current_leaf: Joi.boolean()
					.optional()
					.default(false)
					.description(
						'Get the species that currently have leaves'
					),

				sort_by: Joi.string()
					.optional()
					.default('species')
					.valid('species', 'family', 'score')
					.description('Sorting results')
			}
		}
	}
};

var clean_response = function (response, callback) {
	if (response && response.hits && response.hits.hits && response.hits.hits.length > 0) {
		response.hits.hits.forEach(function (item) {
			if ('_index' in item) {
				delete item._index;
			}
			if ('_type' in item) {
				delete item._type;
			}
			if ('_score' in item) {
				delete item._score;
			}
			if ('sort' in item) {
				delete item.sort;
			}

			if (item && ('_source' in item)) {
				if ('comment' in item._source) {
					delete item._source.comment;
				}
				if ('created' in item._source) {
					delete item._source.created;
				}
				if ('modified' in item._source) {
					delete item._source.modified;
				}
				if ('dists' in item._source) {
					delete item._source.dists;
				}
				if ('genus' in item._source) {
					delete item._source.genus;
				}
				if ('traits' in item._source) {
					delete item._source.traits;
				}
				if ('genus_id' in item._source) {
					delete item._source.genus_id;
				}
				if ('_rev' in item._source) {
					delete item._source._rev;
				}
				if ('eol_id' in item._source) {
					delete item._source.eol_id;
				}
				if ('eol_error' in item._source) {
					delete item._source.eol_error;
				}
				if ('gbif_error' in item._source) {
					delete item._source.gbif_error;
				}

				if ('family' in item._source) {
					if ('id' in item._source.family) {
						delete item._source.family.id;
					}
					if ('created' in item._source.family) {
						delete item._source.family.created;
					}
					if ('modified' in item._source.family) {
						delete item._source.family.modified;
					}
					if ('comment' in item._source.family) {
						delete item._source.family.comment;
					}
				}
				
				if (item._source.media && item._source.media.length > 0) {
					var tmp = item._source.media[0];
					if (tmp.source) {
						delete tmp.source;
					}
					item._source.media = [tmp];
				}

				if ('pnet' in item._source) {
					if ('images' in item._source.pnet) {
						delete item._source.pnet.images;
					}
					if ('projects' in item._source.pnet) {
						delete item._source.pnet.projects;
					}
				}
			}
		});
	}
	format_response(response, callback);
}

var format_response = function (response, callback) {
	if (response) {
		if ('timed_out' in response) {
			delete response.timed_out;
		}
		if ('_shards' in response) {
			delete response._shards;
		}
		if (response.hits && ('max_score' in response.hits)) {
			delete response.hits.max_score;
		}

		if (response.hits && ('hits' in response.hits)) {
			response.hits['results'] = response.hits.hits;
			delete response.hits.hits;
		}

		if ('aggregations' in response) {
			if ('families' in response.aggregations) {
				if ('doc_count_error_upper_bound' in response.aggregations.families) {
					delete response.aggregations.families.doc_count_error_upper_bound;
				}
				if ('sum_other_doc_count' in response.aggregations.families) {
					delete response.aggregations.families.sum_other_doc_count;
				}
			}

			if ('genera' in response.aggregations) {
				if ('doc_count_error_upper_bound' in response.aggregations.genera) {
					delete response.aggregations.genera.doc_count_error_upper_bound;
				}
				if ('sum_other_doc_count' in response.aggregations.genera) {
					delete response.aggregations.genera.sum_other_doc_count;
				}
			}

			if ('usages' in response.aggregations) {
				if (('filtered' in response.aggregations.usages) && ('usages' in response.aggregations.usages.filtered)) {
					response.aggregations.usages = response.aggregations.usages.filtered.usages;
				} else {
					if ('usages' in response.aggregations.usages) {
						response.aggregations.usages = response.aggregations.usages.usages;
					}
				}
				if ('doc_count_error_upper_bound' in response.aggregations.usages) {
					delete response.aggregations.usages.doc_count_error_upper_bound;
				}
				if ('sum_other_doc_count' in response.aggregations.usages) {
					delete response.aggregations.usages.sum_other_doc_count;
				}
			}

			if ('sub_usages' in response.aggregations) {
				if (('filtered' in response.aggregations.sub_usages) && ('names' in response.aggregations.sub_usages.filtered)) {
					response.aggregations.sub_usages = response.aggregations.sub_usages.filtered.names;
				} else {
					if ('names' in response.aggregations.sub_usages) {
						response.aggregations.sub_usages = response.aggregations.sub_usages.names;
					}
				}
				if ('doc_count_error_upper_bound' in response.aggregations.sub_usages) {
					delete response.aggregations.sub_usages.doc_count_error_upper_bound;
				}
				if ('sum_other_doc_count' in response.aggregations.sub_usages) {
					delete response.aggregations.sub_usages.sum_other_doc_count;
				}
			}

			if ('pnet' in response.aggregations) {
				if ('pnet' in response.aggregations.pnet) {
					response.aggregations.pnet = response.aggregations.pnet.pnet;
				}
				if ('doc_count_error_upper_bound' in response.aggregations.pnet) {
					delete response.aggregations.pnet.doc_count_error_upper_bound;
				}
				if ('sum_other_doc_count' in response.aggregations.pnet) {
					delete response.aggregations.pnet.sum_other_doc_count;
				}
			}
		}
	}

	callback(response);
}

var get_occurrences = function(url, offset, tab_ids, callback) {
	request(url + env.gbif_api_offset + offset, function (error, response, body) {
		if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json') {
			var json = JSON.parse(body);
			if (json.results.length > 0) {
				json.results.forEach(function (result) {
					if (result.speciesKey) {
						tab_ids.push(result.speciesKey);
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
							if (result.doc && result.doc.taxa) {
								tab_ids.push(result.doc.taxa);
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

var clean_response_geo = function (response, callback) {
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

var get_occurrences_geo = function(url, offset, tab_ids, callback) {
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
					get_occurrences_geo(url, (offset + json.limit), tab_ids, callback);
				}
			} else {
				callback(tab_ids);
			}
		} else {
			if (response.statusCode == 503) {
				get_occurrences_geo(url, (offset), tab_ids, callback);
			} else {
				callback(tab_ids);
			}
		}
	});
}

var get_occurrences_geo_pnet = function(url, offset, tab_ids, callback) {
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
							get_occurrences_geo_pnet(url, (offset + json.limit), tab_ids, callback);
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