var Parser = require('node-dbf');
var colors = require('colors');
var _ = require('underscore');

var func = require('./functions');

var species = require('./conf_species');
exports.conf = species;

/**
* Loads species [only valid, in valid genus, not an hybrid, species rank, with author]
*/
exports.load = function (genera, callback) {
	var total = 0;
	var i = 0;

	var tab = {};

	var parser = new Parser(species.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(species.name) + ' loading...');
	});

	parser.on('header', function (h) {
		total = h.numberOfRecords;
	});

	parser.on('record', function (record) {
		i++;

		var item = {
			id: parseInt(record.TAXNO),
			name: record.TAXON,
			author: record.TAXAUTHOR,
			comment: record.TAXCMT,
			created: func.get_date(record.CREATED),
			modified: func.get_date(record.MODIFIED),
			genus_id: parseInt(record.GNO),
			dists: [],
			usages: [],
			commons: []
		};

		// checks if species is hybrid or not
		var is_hybrid = false;
		if (record.SHYBRID != ''
			|| record.SSPHYBRID != ''
			|| record.VARHYBRID != ''
			|| record.SVHYBRID != ''
			|| record.FHYBRID != '') {
			is_hybrid = true;
		}

		// checks if record is a species or another rank
		var is_sp = true;
		if (record.SUBSP != ''
			|| record.SSPAUTHOR != ''
			|| record.VAR != ''
			|| record.VARAUTHOR != ''
			|| record.SUBVAR != ''
			|| record.SVAUTHOR != ''
			|| record.FORMA != ''
			|| record.FAUTHOR != '') {
			is_sp = false;
		}

		// checks if record has an author
		var has_author = false;
		if (record.TAXAUTHOR != '') {
			has_author = true;
		}

		// valid species, in a valid genus, not an hybrid, species rank, with author
		if (parseInt(record.VALIDTAXNO) == item.id && (item.genus_id in genera) && !is_hybrid && is_sp && has_author) {

			if (!genera[item.genus_id].is_ok) {
				// replaces the genus_id with the valid genus_id
				item.genus_id = genera[item.genus_id].valid;
			}

			tab[item.id] = item;
		}

		if (i == total) {
			callback(tab);
		}
	});

	parser.parse();
}

/**
* Associates common names, usages and dists with species
*/
exports.assoc = function (speciess, commons, usages, dists, callback) {
	console.log('-------------------------------------------------');
	console.log(colors.yellow(species.name) + ' assoc...');

	for (id in speciess) {
		
		if (id in commons) {
			speciess[id]['commons'] = commons[id];
		}

		if (id in usages) {
			speciess[id]['usages'] = usages[id];
		}

		/*if (id in dists) {
			speciess[id]['dists'] = dists[id];
		}*/
	}

	callback(speciess);
}

/**
* Associates genera and families with species
* Deletes unwanted fields
*/
exports.tax = function (speciess, genera, families, callback) {
	console.log('-------------------------------------------------');
	console.log(colors.yellow(species.name) + ' taxonomy...');

	for (id in speciess) {
		var genus_id = speciess[id].genus_id;
		var family_id = genera[genus_id].family_id;

		delete genera[genus_id].is_ok;
		delete genera[genus_id].valid;

		delete families[family_id].is_ok;
		delete families[family_id].valid;

		speciess[id]['genus'] = genera[genus_id];
		speciess[id]['family'] = families[family_id];
	}

	callback(speciess);
}