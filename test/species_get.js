var Lab = require('lab');
var lab = exports.lab = Lab.script();

var Code = require('code');
var expect = Code.expect;

var server = require('../server');

var env = require('../env');

// -------------------------------------------------
// -------------------------------------------------

lab.experiment('GET /species/{id}', function () {
	var options = {
		method: 'GET',
		url: '/species?size=1'
	};
	
	var id = 0;

	lab.test('get an id', function (done){
		server.inject(options, function (response) {
			id = response.result.hits.results[0]._id;
			options = {
				method: 'GET',
				url: '/species/' + id
			};
			done();
		});
	});

	lab.test('should respond 200', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(200);
			done();
		});
	});

	lab.test('should respond found=true', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('found');
			expect(response.result.found).to.equal(true);
			done();
		});
	});

	lab.test('should contain _source', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('_source');
			done();
		});
	});

	lab.test('should respond application/json utf-8', function (done){
		server.inject(options, function (response) {
			expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
			done();
		});
	});
});

// -------------------------------------------------
// -------------------------------------------------

lab.experiment('GET /species/{id}', function () {
	var options = {
		method: 'GET',
		url: '/species/an_id'
	};

	lab.test('should respond 404', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(404);
			done();
		});
	});

	lab.test('should respond application/json utf-8', function (done){
		server.inject(options, function (response) {
			expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
			done();
		});
	});
});