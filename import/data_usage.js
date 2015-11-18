var Parser = require('node-dbf');
var colors = require('colors');
var Entities = require('html-entities').AllHtmlEntities;
var async = require('async');
var csv = require('fast-csv');

var entities = new Entities();

var usage = require('./conf_usage');
exports.conf = usage;

exports.load_new_labels = function (callback) {
	var tab_cats = {};
	var tab_uses = {};

	async.parallel([
		function (cb) {
			console.log('-------------------------------------------------');
			console.log(colors.yellow('cats new labels') + ' loading...');
			csv.fromPath(usage.file_new_cat, {
				headers: true,
				delimiter: ';',
				trim: true
			}).on('data', function(data){
				tab_cats[data[usage.cat_col_origin]] = data[usage.cat_col_new_en];
			}).on('end', function(){
				cb(null, '');
			});
		},
		function (cb) {
			console.log('-------------------------------------------------');
			console.log(colors.yellow('uses new labels') + ' loading...');
			csv.fromPath(usage.file_new_usages, {
				headers: true,
				delimiter: ';',
				trim: true
			}).on('data', function(data){
				tab_uses[data[usage.use_col_origin]] = data[usage.use_col_new_en];
			}).on('end', function(){
				cb(null, '');
			});
		}
	], function (err, results) {
		callback(tab_cats, tab_uses);
	});
}

/**
* Loads usages [with a top level usage]
*/
exports.load = function (new_cats, new_uses, callback) {
	var total = 0;
	var i = 0;

	var tab = {};

	var parser = new Parser(usage.db);

	parser.on('start', function (p) {
		console.log('-------------------------------------------------');
		console.log(colors.yellow(usage.name) + ' loading...');
	});

	parser.on('header', function (h) {
		total = h.numberOfRecords;
	});

	parser.on('record', function (record) {
		i++;

		var species_id = parseInt(record.TAXNO);
		var usage = entities.decode(record.TAXUSE);
		var usage_type = entities.decode(record.USETYPE);

		if (usage in new_cats) {
			usage = new_cats[usage];
		}

		if (usage_type in new_uses) {
			usage_type = new_uses[usage_type];
		}
		usage_type = usage_type.replace('<I>', '');
		usage_type = usage_type.replace('</I>', '');

		// with a top level usage
		if (usage != '') {
			
			if (!(species_id in tab)) {
				tab[species_id] = {};
			}

			if (!(usage in tab[species_id])) {
				tab[species_id][usage] = [];
			}

			if (usage_type != '') {
				tab[species_id][usage].push(usage_type);
			}
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
		for (usage in tab[id]) {
			new_tab[id].push({
				usage: usage,
				names: tab[id][usage]
			});
		}
	}

	callback(new_tab);
}