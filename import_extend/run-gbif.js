var colors = require('colors');
var request = require('request');
var async = require('async');
var _ = require('underscore');

var env = require('../env');

var nano = require('nano')(env.couch_connexion_string);
var db = nano.use(env.couch_db);

var gbif_api = 'http://api.gbif.org/v1/species';
var gbif_api_search_default = '?rank=SPECIES&nameType=SCINAME&language=en&datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&name=';
var gbif_api_request_media = '/media?limit=50';

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
							var is_bad_gbif = false;

							if (!('gbif_error' in doc.doc)) {
								is_bad_gbif = true;
							} else {
								is_bad_gbif = doc.doc.gbif_error;
							}

							if (is_bad_gbif) {
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

	doc.doc['gbif_error'] = true;
	if (doc.doc.gbif_key) {
		delete doc.doc.gbif_key;
	}
	if (doc.doc.media) {
		var tmp = [];
		for (var i = 0; i < doc.doc.media.length; i++) {
			if (doc.doc.media[i].floris_source && doc.doc.media[i].floris_source != 'gbif') {
				tmp.push(doc.doc.media[i]);
			}
		}
		doc.doc.media = tmp;
	}

	request_data(name, doc, callback);
}

var request_data = function (name, doc, callback) {
	request(gbif_api + gbif_api_search_default + encodeURI(name), function (error, response, body) {
		if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json') {
			var json = JSON.parse(body);

			if (json.results.length > 0) {
				var gbif_species = json.results[0];

				if (gbif_species.key) {
					doc.doc['gbif_error'] = false;
					doc.doc['gbif_key'] = gbif_species.key;
					var id = doc.doc.gbif_key;

					request_data_media(id, doc, callback);
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

var request_data_media = function (id, doc, callback) {
	request(gbif_api + '/' + id + gbif_api_request_media, function (err, resp, bod) {
		if (!err && resp.statusCode == 200 && resp.headers['content-type'] == 'application/json') {
			var json = JSON.parse(bod);

			if (!doc.doc.media) {
				doc.doc['media'] = [];
			}

			if (json.results && json.results.length > 0) {

				var gbif_media = json.results;

				gbif_media.forEach(function (media) {
					if (media.format && _.contains(formats, media.format) && media.identifier) {
						var content = {
							identifier: media.identifier,
							title: '',
							description: '',
							creator: '',
							license: ''
						}

						if (media.title) { content.title = media.title; }
						if (media.description) { content.description = media.description; }
						if (media.creator) { content.creator = media.creator; }
						if (media.license) { content.license = media.license; }

						doc.doc.media.push({
							floris_source: 'gbif',
							source: content,
							floris_media_url: content.identifier,
							floris_media_type: media.format,
							floris_media_title: content.title,
							floris_media_description: content.description,
							floris_media_author: content.creator,
							floris_media_licence: content.license
						});
					}
				});
			}

			callback(doc);
		} else {
			doc.doc['gbif_error'] = true;
			callback(doc);
		}
	});
}

if (which_data == 'error' || which_data == 'all') {
	get_docs_to_update();
} else {
	console.log(colors.red('Parameter required: all or error'));
}