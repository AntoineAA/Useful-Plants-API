var Parser = require('node-dbf');
var colors = require('colors');
var async = require('async');

// Data functions
var family = require('./data_family');
var genus = require('./data_genus');
var species = require('./data_species');
var common = require('./data_common');
var usage = require('./data_usage');
var dist = require('./data_dist');

// Database access
var db = require('./save');

// Data
var tab_families = {};
var tab_genera = {};
var tab_species = {};
var tab_commons = {};
var tab_usages = {};
var tab_dists = {};

var tab_new_cats = {};
var tab_new_uses = {};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
var data_checked = true;
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
/**
* Checks if required fields exist
*/
var check_db = function (properties, callback) {
	var parser = new Parser(properties.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(properties.name) + ' checking has started');
	});

	parser.on('header', function (h) {
		console.log(colors.yellow(h.numberOfRecords) + ' records');
		checked = true;

		for(prop in properties.fields) {
			found = false;

			h.fields.forEach(function (elem) {
				if (elem.name == properties.fields[prop]) {
					found = true;
				}
			});

			if (!found) {
				checked = false;
				console.log(colors.red(properties.fields[prop]) + ' required');
			}
		}

		data_checked = checked && data_checked;
		console.log('All required fileds: ' + ((checked) ? colors.green(checked) : colors.red(checked)));
	});

	parser.on('end', function (p) {
		callback();
	});

	parser.parse();
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
/**
* Checks if required fields exist in origin files
*/
var check_data = function () {
	async.series([
		function (callback) {
			check_db(family.conf, function () {
				callback(null, '');
			});
		},
		function (callback) {
			check_db(genus.conf, function () {
				callback(null, '');
			});
		},
		function (callback) {
			check_db(species.conf, function () {
				callback(null, '');
			});
		},
		function (callback) {
			check_db(common.conf, function () {
				callback(null, '');
			});
		},
		function (callback) {
			check_db(usage.conf, function () {
				callback(null, '');
			});
		},
		function (callback) {
			check_db(dist.conf, function () {
				callback(null, '');
			});
		}
	],
	function (err, results) {
		if (!data_checked) {
			// if error, stops the process
			console.log('-------------------------------------------------');
			console.log('ERROR!'.red);
			console.log('-------------------------------------------------');
			return;
		} else {
			// continues the process
			pre();
		}
	});
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
/**
* Loads data
*/
var pre = function () {
	async.series([
		function (callback) {
			family.load(function (results) {
			 	tab_families = results;
				callback(null, '');
			});
		},
		function (callback) {
			genus.load(tab_families, function (results) {
				tab_genera = results;
				callback(null, '');
			});
		},
		function (callback) {
			species.load(tab_genera, function (results) {
				tab_species = results;
				callback(null, '');
			});
		},
		function (callback) {
			common.load(function (results) {
				tab_commons = results;
				callback(null, '');
			});
		},
		function (callback) {
			usage.load_new_labels(function (results_cat, results_uses) {
				tab_new_cats = results_cat;
				tab_new_uses = results_uses;
				callback(null, '');
			});
		},
		function (callback) {
			usage.load(tab_new_cats, tab_new_uses, function (results) {
				tab_usages = results;
				callback(null, '');
			});
		},
		function (callback) {
			dist.load(function (results) {
				tab_dists = results;
				callback(null, '');
			});
		}
	],
	function (err, results) {
		// continues the process
		run();
	});
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
/**
* Associates common names, usages and dists with species
*/
var run = function () {
	async.series([
		function (callback) {
			species.assoc(tab_species, tab_commons, tab_usages, tab_dists, function (results) {
				tab_species = results;
				callback(null, '');
			});
		}
	],
	function (err, results) {
		// continues the process
		post();
	});
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
/**
* Associates genera and families with species
* Saves species
*/
var post = function () {
	species.tax(tab_species, tab_genera, tab_families, function (results) {
		tab_species = results;
		db.insert(tab_species, function () {
			end();
		});
	});
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
var end = function () {
	console.log('-------------------------------------------------');
	console.log('DONE!'.green);
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
check_data();