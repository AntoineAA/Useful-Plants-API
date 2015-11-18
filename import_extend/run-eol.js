var colors = require('colors');
var request = require('request');
var async = require('async');
var _ = require('underscore');

var env = require('../env');

var nano = require('nano')(env.couch_connexion_string);
var db = nano.use(env.couch_db);

var eol_api = 'http://eol.org/api/';
var eol_api_search_default = 'search/1.0.json?page=1&exact=true&q=';
var eol_api_request_media = 'pages/1.0/';
var eol_api_request_media_end = '.json?images=75&videos=0&sounds=0&maps=0&text=0&iucn=false&subjects=overview'
	+ '&licenses=all&details=true&common_names=true&synonyms=false&references=false&vetted=2';

var eol_traits_api = 'http://eol.org/api/traits/';

var formats = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

var docs = [];

var which_data = '';

process.argv.forEach(function (val, index, array) {
	if (index == 2 && val == 'all') {
		which_data = 'all';
	}
	if (index == 2 && val == 'error') {
		which_data = 'error';
	}
});

var get_docs_to_update = function () {
	var limit = 500;
	var offset = 0;
	var total = 0;

	var disp = false;

	async.doWhilst(function (callback) {
		console.log('offset: ' + offset);
		db.list({ include_docs: true, limit:limit, skip:offset }, function (err, body) {
			if (!err) {
				total = body.total_rows;
				offset += limit;

				if (!disp) {
					console.log(colors.green(total + ' documents to check'));
					disp = true;
				}

				body.rows.forEach(function (doc) {
					if (doc.doc && doc.doc.name && doc.doc.name != '' && doc.doc.usages && doc.doc.usages.length > 0) {
						if (which_data == 'all') {
							docs.push(doc);
						} else if (which_data == 'error') {
							var is_bad_eol = false;

							if (!('eol_error' in doc.doc)) {
								is_bad_eol = true;
							} else {
								is_bad_eol = doc.doc.eol_error;
							}

							if (is_bad_eol) {
								docs.push(doc);
							}
						}
					}
				});
				callback();
			} else {
				total = 0;
				offset = 1;
				console.log(colors.red(err));
			}
		});
	}, function () {
		return offset <= total;
	}, function (err) {
		update_docs();
	});
}

var count_i = 0;
var count_total = 0;

var update_docs = function () {
	count_total = docs.length;

	console.log(colors.green(count_total + ' documents to update'));

	async.eachLimit(docs, 10, function (doc, callback) {
		get_data(doc, function (updated_doc) {
			db.insert(updated_doc.doc, function (e, r) {
				callback();
			});
		});
	}, function (err) {
		console.log('DONE!');
	});
}

var get_data = function (doc, callback) {
	count_i++;

	var name = doc.doc.name;
	console.log(count_i + '/' + count_total + ' ' + name);

	doc.doc['eol_error'] = true;
	if (doc.doc.eol_id) {
		delete doc.doc.eol_id;
	}
	if (doc.doc.media) {
		var tmp = [];
		for (var i = 0; i < doc.doc.media.length; i++) {
			if (doc.doc.media[i].floris_source && doc.doc.media[i].floris_source != 'eol') {
				tmp.push(doc.doc.media[i]);
			}
		}
		doc.doc.media = tmp;
	}

	request_data(name, doc, callback);
}

var request_data = function (name, doc, callback) {
	request(eol_api + eol_api_search_default + encodeURI(name), function (error, response, body) {
		if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json; charset=utf-8') {
			var json = JSON.parse(body);

			if (json.results.length > 0) {
				var eol_species = json.results[0];

				if (eol_species.id) {
					doc.doc['eol_error'] = false;
					doc.doc['eol_id'] = eol_species.id;
					var id = doc.doc.eol_id;

					async.parallel([
						function (cb) {
							request_data_media(id, doc, function (updated_doc) {
								doc = updated_doc;
								cb();
							});
						},
						function (cb) {
							request_data_traits(id, doc, function (updated_doc) {
								doc = updated_doc;
								cb();
							});
						}
					], function (errp) {
						callback(doc);
					});
				} else {
					callback(doc);
				}
			} else {
				callback(doc);
			}
		} else {
			callback(doc);
		}
	});
}

var request_data_media = function (id, doc, cb) {
	request(eol_api + eol_api_request_media + id + eol_api_request_media_end, function (err, resp, bod) {
		if (!err && resp.statusCode == 200 && resp.headers['content-type'] == 'application/json; charset=utf-8') {
			var json = JSON.parse(bod);

			if (!doc.doc.media) {
				doc.doc['media'] = [];
			}

			if (json.dataObjects && json.dataObjects.length > 0) {
				var eol_media = json.dataObjects;

				eol_media.forEach(function (media) {
					if (media.mimeType && _.contains(formats, media.mimeType) && media.mediaURL) {
						var content = {
							media_url: media.mediaURL,
							license: '',
							source: '',
							rights: '',
							rights_holder: '',
							title: '',
							description: '',
							language: '',
							location: '',
							latitude: null,
							longitude: null
						}

						if (media.license) { content.license = media.license; }
						if (media.source) { content.source = media.source; }
						if (media.rights) { content.rights = media.rights; }
						if (media.rightsHolder) { content.rights_holder = media.rightsHolder; }
						if (media.title) { content.title = media.title; }
						if (media.description) { content.description = media.description; }
						if (media.language) { content.language = media.language; }
						if (media.location) { content.location = media.location; }
						if (media.latitude) { content.latitude = media.latitude; }
						if (media.longitude) { content.longitude = media.longitude; }

						doc.doc.media.push({
							floris_source: 'eol',
							source: content,
							floris_media_url: content.media_url,
							floris_media_type: media.mimeType,
							floris_media_title: content.title,
							floris_media_description: content.description,
							floris_media_author: content.rights_holder,
							floris_media_licence: content.license
						});
					}
				});
			}
			
			cb(doc);
		} else {
			doc.doc['eol_error'] = true;
			cb(doc);
		}
	});
}

var request_data_traits = function (id, doc, cb) {
	request(eol_traits_api + id, function (err, resp, bod) {
		if (!err && resp.statusCode == 200 && resp.headers['content-type'] == 'application/json; charset=utf-8') {
			var json = JSON.parse(bod);

			doc.doc.traits = [];

			var measurements = {};

			if (json['@graph'] && json['@graph'].length > 0) {
				var items = json['@graph'];
				items.forEach(function (item) {

					if (item['@type'] && item['@type'] == 'dwc:MeasurementOrFact') {

						var measure_type = '';
						var measure_value = '';

						if (item['dwc:measurementType'] && item['dwc:measurementType']['rdfs:label']
							&& item['dwc:measurementType']['rdfs:label']['en']) {
							
							measure_type = item['dwc:measurementType']['rdfs:label']['en'];
						}

						if (item['dwc:measurementValue'] && item['dwc:measurementValue']['rdfs:label']
							&& item['dwc:measurementValue']['rdfs:label']['en']) {
							
							measure_value = item['dwc:measurementValue']['rdfs:label']['en'];

						} else if (typeof item['dwc:measurementValue'] == 'string' || item['dwc:measurementValue'] instanceof String) {
							
							measure_value = item['dwc:measurementValue'];

							if (measure_value != '') {

								if (item['dwc:measurementUnit'] && item['dwc:measurementUnit']['rdfs:label']
									&& item['dwc:measurementUnit']['rdfs:label']['en']) {
									measure_value += ' ' + item['dwc:measurementUnit']['rdfs:label']['en'];
								}

								if (item['dwc:lifeStage'] && item['dwc:lifeStage']['rdfs:label']
									&& item['dwc:lifeStage']['rdfs:label']['en']) {
									measure_value += ' - ' + item['dwc:lifeStage']['rdfs:label']['en'];
								}

								if (item['eolterms:statisticalMethod'] && item['eolterms:statisticalMethod']['rdfs:label']
									&& item['eolterms:statisticalMethod']['rdfs:label']['en']) {
									measure_value += ' (' + item['eolterms:statisticalMethod']['rdfs:label']['en'] + ')';
								}
							}
						}

						if (measure_type != '' && measure_value != '') {
							if (!(measure_type in measurements)) {
								measurements[measure_type] = [];
							}
							if (!_.contains(measurements[measure_type], measure_value)) {
								measurements[measure_type].push(measure_value);
							}
						}
					}
				});

				for (meas in measurements) {
					doc.doc.traits.push({
						name: meas,
						values: measurements[meas]
					});
				}
			}

			cb(doc);
		} else {
			doc.doc['eol_error'] = true;
			cb(doc);
		}
	});
}

if (which_data == 'error' || which_data == 'all') {
	get_docs_to_update();
} else {
	console.log(colors.red('Parameter required: all or error'));
}