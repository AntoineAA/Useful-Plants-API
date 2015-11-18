var Parser = require('node-dbf');
var colors = require('colors');
var Entities = require('html-entities').AllHtmlEntities;

var entities = new Entities();

var common = require('./conf_common');
exports.conf = common;

/**
* Loads common names [with a language, with a common name]
*/
exports.load = function (callback) {
	var total = 0;
	var i = 0;

	var tab = {};

	var parser = new Parser(common.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(common.name) + ' loading...');
	});

	parser.on('header', function (h) {
		total = h.numberOfRecords;
	});

	parser.on('record', function (record) {
		i++;

		var species_id = parseInt(record.TAXNO);
		var language = record.LANGUAGE;
		var name = record.CNAME;

		// with a language, with a common name
		if (language != '' && name != '') {

			language = entities.decode(language);
			name = entities.decode(name);
			
			if (!(species_id in tab)) {
				tab[species_id] = {};
			}

			if (!(language in tab[species_id])) {
				tab[species_id][language] = [];
			}

			tab[species_id][language].push(name);
		}

		if (i == total) {
			clean(tab, callback);
		}
	});

	parser.parse();
}

var clean = function (tab, callback) {
	var new_tab = {};

	for (id in tab) {
		new_tab[id] = [];
		for (language in tab[id]) {
			var code = '';
			if (language in common.mapping) {
				code = common.mapping[language];
			}

			new_tab[id].push({
				language: language,
				code: code,
				names: tab[id][language]
			});
		}
	}

	callback(new_tab);
}