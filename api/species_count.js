var Joi = require('joi');
var elasticsearch = require('elasticsearch');
var fs = require('fs');

var env = require('../env');

var json_query = require('./api_species_default_query.json');

// Elasticsearch client
var client = new elasticsearch.Client({
	host: env.elastic_host + ':' + env.elastic_port,
	log: 'error'
});

module.exports.route = {
	method: 'GET',
	path: '/species/count',
	handler: function (request, reply) {
		var query = JSON.parse(JSON.stringify(json_query)).query;
		
		var params = {
			index: env.elastic_data_index,
			type: env.elastic_data_type,
			ignore: [404],
			body: {
				query: query
			}
		};

		client.count(params).then(function (resp) {
			reply(resp);
		}, function (err) {
			console.log(err.message);
		});
	},
	config: {
		tags: ['api'],
		description: 'Get species count',
		notes: 'Returns the number of species',
		validate: {}
	}
};