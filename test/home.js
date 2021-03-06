var Lab = require('lab');
var lab = exports.lab = Lab.script();

var Code = require('code');
var expect = Code.expect;

var server = require('../server');

var env = require('../env');

lab.experiment('GET /', function () {
	var options = {
		method: 'GET',
		url: '/'
	};

	lab.test('should respond 200', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(200);
			done();
		});
	});

	lab.test('should respond text/html', function (done){
		server.inject(options, function (response) {
			expect(response.headers['content-type']).to.equal('text/html');
			done();
		});
	});
});