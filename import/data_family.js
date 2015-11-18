var Parser = require('node-dbf');
var colors = require('colors');
var _ = require('underscore');

var func = require('./functions');

var family = require('./conf_family');
exports.conf = family;

/**
* Loads families [only valid, with author]
*/
exports.load = function (callback) {
	var total = 0;
	var i = 0;

	var tab = {};
	var valids = {};

	var parser = new Parser(family.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(family.name) + ' loading...');
	});

	parser.on('header', function (h) {
		total = h.numberOfRecords;
	});

	parser.on('record', function (record) {
		i++;

		var item = {
			id: parseInt(record.FAMNO),
			name: record.FAMILY,
			author: record.FAMAUTHOR,
			comment: record.CMT,
			created: func.get_date(record.CREATED),
			modified: func.get_date(record.MODIFIED),
			is_ok: true,
			valid: null
		};

		// checks if record is a family or another rank
		if (record.SUBFAMILY != ''
			|| record.TRIBE != ''
			|| record.SUBTRIBE != '') {
			item.is_ok = false;
		}

		// checks if record has an author
		var has_author = false;
		if (record.FAMAUTHOR != '') {
			has_author = true;
		}

		// valid family, with author
		if (parseInt(record.VALIDFAMNO) == item.id && has_author) {

			if (item.is_ok) {
				// adds "family name = family id" to the "valids" list
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
		// if it's not a family, gets the id of the corresponding valid family
		if (!tab[id].is_ok) {
			if ((tab[id].name + tab[id].author) in valids) {
				tab[id].valid = valids[tab[id].name + tab[id].author];
			} else {
				// if there is no corresponding family, deletes the entry
				delete tab[id];
			}
		}
	}

	callback(tab);
}