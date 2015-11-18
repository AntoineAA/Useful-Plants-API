var colors = require('colors');
var request = require('request');
var async = require('async');
var _ = require('underscore');

var env = require('../env');

var pn_api = 'http://identify.plantnet-project.org/api/';
var pn_api_projects = 'getProjects';
var pn_api_species_start = 'project/';
var pn_api_species_end = '/getSpecies';
var pn_api_data_start = 'project/';
var pn_api_data_end = '/getplantunitfortaxon/';
var language = '/en';

var tab_projects = {};
var tab_species = {};

var get_projects = function () {
	console.log(colors.green('Projects'));
	request(pn_api + pn_api_projects + language, function (error, response, body) {
		if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json') {
			var json = JSON.parse(body);

			if (json.projects && json.projects.length > 0) {
				json.projects.forEach(function (project) {
					if (project.type && project.type == 'project' && project.id && project.name) {
						tab_projects[project.id] = {
							id: project.id,
							name: project.name,
							description : project.description || ''
						};

						console.log(project.name);
					}
				});

				console.log(colors.yellow('DONE!'));
				get_species();
			}
		} else {
			console.log(colors.red('ERROR - get projects list'));
		}
	});
}

var get_species = function () {
	console.log(colors.green('Species'));
	async.eachSeries(Object.keys(tab_projects), function (id_project, callback) {
		request(pn_api + pn_api_species_start + id_project + pn_api_species_end + language, function (error, response, body) {
			if (!error && response.statusCode == 200 && response.headers['content-type'] == 'application/json; charset=utf-8') {
				var json = JSON.parse(body);

				if (json.species && json.species.length > 0) {
					json.species.forEach(function (species) {
						if (species.type && species.type == 'species' && species.name && species.name != '') {
							if (!(species.name in tab_species)) {
								tab_species[species.name] = {
									name: species.name,
									image: species.image || '',
									projects: [],
									images: {}
								}
							}

							tab_species[species.name].projects.push(tab_projects[id_project]);
						}
					});
					callback();
				} else {
					console.log(colors.red('ERROR - species list is empty (' + id_project + ')'));
					callback();
				}
			} else {
				console.log(colors.red('ERROR - get species list (' + id_project + ')'));
				callback();
			}
		});
	}, function (err) {
		console.log(Object.keys(tab_species).length + ' species');
		console.log(colors.yellow('DONE!'));
		get_data();
	});
}

var get_data = function () {
	var i = 0;
	console.log(colors.green('Data'));

	async.eachSeries(Object.keys(tab_species), function (id_species, callback) {
		async.eachSeries(tab_species[id_species].projects, function (proj, callb) {
			request(pn_api + pn_api_data_start + proj.id + pn_api_data_end + encodeURI(id_species), function (error, response, body) {
				console.log(proj.id + ' - ' + id_species);
				var json = JSON.parse(body);

				if (json.length > 0) {
					json.forEach(function (collection) {
						if (collection.dataset && collection.dataset != '' && collection.images && collection.images.length > 0) {
							if (!(collection.dataset in tab_species[id_species].images)) {
								tab_species[id_species].images[collection.dataset] = {};
							}

							collection.images.forEach(function (img) {
								if ((img.image && img.image != '') || (img.full_image && img.full_image != '')) {
									var i_img = img.full_image || img.image;

									if (!(i_img in tab_species[id_species].images[collection.dataset])) {
										tab_species[id_species].images[collection.dataset][i_img] = {
											auteur: img.auteur_image || '',
											image: i_img,
											localite: img.Localite,
											date: img.date_observation || ''
										}
									}
								}
							});
						}
					});
				}

				callb();
			});
		}, function (err) {
			callback();
		});
	}, function (err) {
		console.log(colors.yellow('DONE!'));
		match_data();
	});
}

var match_data = function () {
	var nano = require('nano')(env.couch_connexion_string);
	var db = nano.use(env.couch_db);

	var limit = 500;
	var offset = 0;
	var total = 0;

	var disp = false;

	var updated = 0;

	async.doWhilst(function (callback) {
		db.list({ include_docs: true, limit:limit, skip:offset }, function (err, body) {
			if (!err) {
				total = body.total_rows;
				offset += limit;

				if (!disp) {
					console.log(colors.green(total + ' documents to check'));
					disp = true;
				}

				body.rows.forEach(function (doc) {
					if (doc.doc && doc.doc.name && doc.doc.name != '' && doc.doc.usages && doc.doc.usages.length > 0) {
						var tot_name = doc.doc.name + ' ' + (doc.doc.author || '');

						if (doc.doc.pnet && !(tot_name in tab_species)) {
							delete doc.doc.pnet;
							if (doc.doc.pnet_id) {
								delete doc.doc.pnet_id;
							}
							updated++;
							db.insert(doc.doc, function (e, r) {
								;
							});
						} else if (tot_name in tab_species) {
							var sp = tab_species[tot_name];
							doc.doc['pnet_id'] = tot_name;
							doc.doc['pnet'] = {
								image: sp.image,
								projects: sp.projects,
								images: []
							}
							for (type in sp.images) {
								for (url in sp.images[type]) {
									doc.doc['pnet'].images.push({
										type: type,
										url: url,
										author: sp.images[type][url].auteur,
										locality: sp.images[type][url].localite,
										date: sp.images[type][url].date
									});
								}
							}
							updated++;
							db.insert(doc.doc, function (e, r) {
								;
							});
						}
					}
				});
				callback();
			} else {
				total = 0;
				offset = 1;
				console.log(colors.red(err));
			}
		});
	}, function () {
		return offset <= total;
	}, function (err) {
		console.log(colors.red(updated));
	});
}

get_projects();