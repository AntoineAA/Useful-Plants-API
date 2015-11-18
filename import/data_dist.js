var Parser = require('node-dbf');
var colors = require('colors');
var Entities = require('html-entities').AllHtmlEntities;

var entities = new Entities();

var dist = require('./conf_dist');
exports.conf = dist;

/**
* Loads dists [with a country]
*/
exports.load = function (callback) {
	var total = 0;
	var i = 0;

	var tab = {};

	var parser = new Parser(dist.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(dist.name) + ' loading...');
	});

	parser.on('header', function (h) {
		total = h.numberOfRecords;
	});

	parser.on('record', function (record) {
		i++;

		// with a country
		if (record.COUNTRY != '') {
			var species_id = parseInt(record.TAXNO);

			if (!(species_id in tab)) {
				tab[species_id] = [];
			}

			var item = {
				country: entities.decode(record.COUNTRY),
				state: entities.decode(record.STATE),
				status: entities.decode(record.STATUS),
				comment: record.CMT
			};

			tab[species_id].push(item);
		}

		if (i == total) {
			callback(tab);
		}
	});

	parser.parse();
}