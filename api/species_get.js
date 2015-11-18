var Joi = require('joi');
var elasticsearch = require('elasticsearch');

var env = require('../env');

// Elasticsearch client
var client = new elasticsearch.Client({
	host: env.elastic_host + ':' + env.elastic_port,
	log: 'error'
});

module.exports.route = {
	method: 'GET',
	path: '/species/{id}',
	handler: function (request, reply) {
		// Query's parameters
		var id = request.params.id;

		var params = {
			index: env.elastic_data_index,
			type: env.elastic_data_type,
			ignore: [404],
			id: id
		};

		client.get(params).then(function (resp) {
			if (!resp.found) {
				reply(resp).code(404);
			} else {
				clean_response(resp, function (ret) {
					reply(ret);
				});
			}
		}, function (err) {
			console.log(err.message);
		});
	},
	config: {
		tags: ['api'],
		description: 'Get details for a single species',
		notes: 'Returns the species',
		validate: {
			params: {
				id: Joi.string()
					.required()
					.min(1)
					.description('The species\' identifier (_id)')
			}
		}
	}
};

var clean_response = function (response, callback) {
	if (response) {
		if ('_index' in response) {
			delete response._index;
		}
		if ('_type' in response) {
			delete response._type;
		}
		if ('_version' in response) {
			delete response._version;
		}

		if ('_source' in response) {
			if ('_rev' in response._source) {
				delete response._source._rev;
			}
			if ('eol_error' in response._source) {
				delete response._source.eol_error;
			}
			if ('gbif_error' in response._source) {
				delete response._source.gbif_error;
			}
			if ('dists' in response._source) {
				delete response._source.dists;
			}
			if ('created' in response._source) {
				delete response._source.created;
			}
			if ('modified' in response._source) {
				delete response._source.modified;
			}
			if ('comment' in response._source) {
				delete response._source.comment;
			}
			if ('genus_id' in response._source) {
				delete response._source.genus_id;
			}

			if ('genus' in response._source) {
				if ('created' in response._source.genus) {
					delete response._source.genus.created;
				}
				if ('modified' in response._source.genus) {
					delete response._source.genus.modified;
				}
				if ('comment' in response._source.genus) {
					delete response._source.genus.comment;
				}
				if ('family_id' in response._source.genus) {
					delete response._source.genus.family_id;
				}
			}

			if ('family' in response._source) {
				if ('created' in response._source.family) {
					delete response._source.family.created;
				}
				if ('modified' in response._source.family) {
					delete response._source.family.modified;
				}
				if ('comment' in response._source.family) {
					delete response._source.family.comment;
				}
			}
		}
	}

	callback(response);
}