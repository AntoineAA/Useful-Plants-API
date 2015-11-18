'use strict';

const Hapi = require('hapi');

var Inert = require('inert');
var Vision = require('vision');

var Good = require('good');

var env = require('./env');
var pack = require('./package');
var api = require('./api/api');

// Server configuration
const server = new Hapi.Server();
server.connection({ port: env.port });

// API documentation
var swagger_options = {
	apiVersion: pack.version,
	basePath: server.info.uri,
	documentationPath: '/',
	info: {
		title: pack.name,
		description: pack.description
	}
};

server.register([
	Inert,
	Vision,
	{
		register: require('hapi-swagger'),
		options: swagger_options
	}
], function (err) {
	if (err) {
		server.log(['error'], 'Plugin "hapi-swagger" load error: ' + err);
	} else {
		server.log(['start'], 'Swagger interface loaded');
	}
});

// Routes
for (var i = 0; i < api.config.length; i++) {
	var ressource = require('./api/' + api.config[i]);
	server.route(ressource.route);
}

// Lab (test utility) doesn't need a running server
if (!module.parent) {
	server.register({
		register: Good,
		options: {
			reporters: [{
				reporter: require('good-console'),
				events:{
					log: '*',
					response: '*'
				}
			}]
		}
	}, function (err) {
		if (err) {
			throw err;
		}

		server.start((err) => {
			if (err) {
				throw err;
			}
			server.log('info', 'Server running at: ' + server.info.uri);
		});
	});
}

// Expose server for Lab
module.exports = server;