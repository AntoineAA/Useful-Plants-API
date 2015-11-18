var Parser = require('node-dbf');
var colors = require('colors');
var _ = require('underscore');

var func = require('./functions');

var genus = require('./conf_genus');
var co = require('./conf_common');
exports.conf = genus;

/**
* Loads genera [only valid, in valid family, not an hybrid, with author]
* Load common names for genera
*/
exports.load = function (families, callback) {
	var total = 0;
	var i = 0;

	var tab = {};
	var valids = {};

	var language = genus.common_name_default_language;

	var parser = new Parser(genus.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(genus.name) + ' loading...');
	});

	parser.on('header', function (h) {
		total = h.numberOfRecords;
	});

	parser.on('record', function (record) {
		i++;

		var item = {
			id: parseInt(record.GNO),
			name: record.GENUS,
			author: record.GAUTHOR,
			comment: record.CMT,
			created: func.get_date(record.CREATED),
			modified: func.get_date(record.MODIFIED),
			family_id: parseInt(record.FAMNO),
			commons: [],
			is_ok: true,
			valid: null
		};

		// checks if genus is hybrid or not
		var is_hybrid = false;
		if (record.GHYBRID != '') {
			is_hybrid = true;
		}

		// checks if record is a genus or another rank
		if (record.SUBGENUS != ''
			|| record.SECTION != ''
			|| record.SERIES != ''
			|| record.SUBSERIES != '') {
			item.is_ok = false;
		}

		// checks if record has an author
		var has_author = false;
		if (record.GAUTHOR != '') {
			has_author = true;
		}

		// valid genus, in a valid family, not an hybrid, with author
		if (parseInt(record.VALIDGNO) == item.id && (item.family_id in families) && !is_hybrid && has_author) {

			// loads common names
			if (record.CNAME != '') {
				var code = '';
				if (language in co.mapping) {
					code = co.mapping[language];
				}
				item.commons.push({
					language: language,
					code: code,
					names: record.CNAME.split(', ')
				});
			}

			if (!families[item.family_id].is_ok) {
				// replaces the family_id with the valid family_id
				item.family_id = families[item.family_id].valid;
			}
			
			if (item.is_ok) {
				// adds "genera name = genera id" to the "valids" list
				valids[item.name + item.author] = item.id;
			}

			tab[item.id] = item;
		}

		if (i == total) {
			clean(tab, valids, callback);
		}
	});

	parser.parse();
}

var clean = function (tab, valids, callback) {
	for (id in tab) {
		// if it's not a genus, gets the id of the corresponding valid genus
		if (!tab[id].is_ok) {
			if ((tab[id].name + tab[id].author) in valids) {
				tab[id].valid = valids[tab[id].name + tab[id].author];
			} else {
				// if there is no corresponding genus, deletes the entry
				delete tab[id];
			}
		}
	}
	
	callback(tab);
}