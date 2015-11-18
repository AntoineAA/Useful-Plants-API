var colors = require('colors');
var async = require('async');
var _ = require('underscore');
var request = require('request');
var sleep = require('sleep');

var env = require('../env');
var mapping = require('./elastic/mapping');

var nano = require('nano')(env.couch_connexion_string);

/**
* Inserts species into the database
*/
exports.insert = function (species, callback) {
	delete_elastica_river(function () {
		delete_elastica_index(function () {
			// destroys the existing databas
			nano.db.destroy(env.couch_db, function (err, body) {
				console.log('-------------------------------------------------');
				console.log('destroy database'.blue);

				if (err) {
					console.log('------- destroy'.red);
					console.log(colors.red(err));
				}

				sleep.sleep(10);

				// creates a new empty database
				nano.db.create(env.couch_db, function (err, body) {
					console.log('-------------------------------------------------');
					console.log('create database'.blue);

					if (err) {
						console.log('------- create'.red);
						console.log(colors.red(err));
					}

					sleep.sleep(5);

					var db = nano.use(env.couch_db);

					// truncates the species list to prevent errors
					var docs = _.values(species);
					var max = 10000;
					var lists = _.groupBy(docs, function (element, index){
						return Math.floor(index/max);
					});
					lists = _.toArray(lists);

					console.log('-------------------------------------------------');
					console.log('insert ' + colors.blue(docs.length) + ' documents');

					// inserts each docs from each sub-lists
					async.each(lists, function (tab, cb) {
						db.bulk({docs: tab}, function (err, body) {
							if (err) {
								console.log('------- bulk'.red);
								console.log(colors.red(err));
							}

							cb();
						});
					},
					function (err) {
						create_elastica_mappings(function () {
							create_elastica_river(function () {
								callback();
							});
						});
					});
				});
			});
		});
	});
}

function delete_elastica_river (callback) {
	request({
		uri: env.elastic_uri + '/' + env.elastic_river_index + '/' + env.elastic_river_name + '/',
		method: 'DELETE'
	},
	function (error, response, body) {
		if (error) {
			console.log(colors.red(error));
		}
		callback();
	});
}

function delete_elastica_index (callback) {
	request({
		uri: env.elastic_uri + '/' + env.elastic_data_index + '/',
		method: 'DELETE'
	},
	function (error, response, body) {
		if (error) {
			console.log(colors.red(error));
		}
		callback();
	});
}

function create_elastica_river (callback) {
	request({
		uri: env.elastic_uri + '/' + env.elastic_river_index + '/' + env.elastic_river_name + '/_meta',
		method: 'PUT',
		json: {
			type: 'couchdb',
			couchdb: {
				host: env.couch_host,
				port: env.couch_port,
				db: env.couch_db,
				filter: null
			},
			index: {
				index: env.elastic_data_index,
				type: env.elastic_data_type,
				bulk_size: '100',
				bulk_timeout: '10ms'
			}
		}
	},
	function (error, response, body) {
		if (error) {
			console.log(colors.red(error));
		}
		callback();
	});
}

function create_elastica_mappings (callback) {
	var map = mapping.mapping;
	map.mappings[env.elastic_data_type] = map.mappings.type;
	delete map.mappings.type;

	request({
		uri: env.elastic_uri + '/' + env.elastic_data_index + '/',
		method: 'PUT',
		json: map
	},
	function (error, response, body) {
		if (error) {
			console.log(colors.red(error));
		}
		callback();
	});
}