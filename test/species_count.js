var Lab = require('lab');
var lab = exports.lab = Lab.script();

var Code = require('code');
var expect = Code.expect;

var server = require('../server');

var env = require('../env');

// -------------------------------------------------
// -------------------------------------------------

lab.experiment('GET /species/count', function () {
	var options = {
		method: 'GET',
		url: '/species/count'
	};

	lab.test('should respond 200', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(200);
			done();
		});
	});

	lab.test('should respond application/json utf-8', function (done){
		server.inject(options, function (response) {
			expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
			done();
		});
	});

	lab.test('should contain count', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('count');
			done();
		});
	});
});