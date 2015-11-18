var Joi = require('joi');
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var _ = require('underscore');

var env = require('../env');

var json_query = require('./api_species_default_query.json');

// Elasticsearch client
var client = new elasticsearch.Client({
	host: env.elastic_host + ':' + env.elastic_port,
	log: 'error'
});

// API configuration
var default_from = env.api_default_from;
var default_size = env.api_default_size;
var default_min_score = env.api_default_min_score;
var default_slop = env.api_default_slop;

module.exports.route = {
	method: 'GET',
	path: '/species/autocomplete/{value}',
	handler: function (request, reply) {
		// Query's parameters
		var value = request.params.value;
		
		var query = JSON.parse(JSON.stringify(json_query)).query;

		var params = {
			index: env.elastic_data_index,
			type: env.elastic_data_type,
			ignore: [404],
			from: default_from,
			size: default_size,
			body: {
				query: query,
				highlight: {
					pre_tags: ["<b>"],
					post_tags: ["</b>"],
					fields: {
						"name": {},
						"author": {},
						"family.name": {},
						"family.author": {},
						"genus.name": {},
						"genus.author": {},
						"genus.commons.language": {},
						"genus.commons.names": {},
						"usages.usage": {},
						"usages.names": {},
						"commons.language": {},
						"commons.names": {}
					}
				},
				sort: []
			}
		};

		params.body['min_score'] = default_min_score;

		params.body.query.bool.must.push({
			match_phrase_prefix: {
				_all: { query: value, slop: default_slop }
			}
		});

		client.search(params).then(function (resp) {
			var values = [];
			if (resp.hits && resp.hits.hits) {
				resp.hits.hits.forEach(function (hit) {
					if (hit && hit.highlight) {
						for (var key in hit.highlight) {
							hit.highlight[key].forEach(function (val) {
								if (val) {
									values.push(val);
								}
							});
						}
					}
				});
			}
			values = _.unique(values);
			reply(values);
		}, function (err) {
			console.log(err.message);
		});
	},
	config: {
		tags: ['api'],
		description: 'Get the values ​​of the fields that match the input value',
		notes: 'Returns the values list',
		validate: {
			params: {
				value: Joi.string()
					.required()
					.min(1)
					.description('Search filter - key words'),
			}
		}
	}
};