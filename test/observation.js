var Lab = require('lab');
var lab = exports.lab = Lab.script();

var Code = require('code');
var expect = Code.expect;

var server = require('../server');

var env = require('../env');

// -------------------------------------------------
// -------------------------------------------------

lab.experiment('GET /observation', function () {
	var options = {
		method: 'GET',
		url: '/observation'
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=&longitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1'
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
});

lab.experiment('GET /observation?latitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1'
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=latitude'
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?longitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?longitude=0.1'
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?longitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?longitude='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?longitude=', function () {
	var options = {
		method: 'GET',
		url: '/observation?longitude=longitude'
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=&longitude=&gbif_key=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&gbif_key=7'
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
});

lab.experiment('GET /observation?latitude=&longitude=&gbif_key=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&gbif_key='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=&longitude=&gbif_key=&check_only=true', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&gbif_key=7&check_only=true'
	};

	lab.test('should respond exists=?', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('exists');
			done();
		});
	});

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
});

lab.experiment('GET /observation?latitude=&longitude=&gbif_key=&check_only=false', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&gbif_key=7&check_only=false'
	};

	lab.test('should respond exists=?', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.not.include('exists');
			done();
		});
	});

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
});

lab.experiment('GET /observation?latitude=&longitude=&gbif_key=&check_only=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&gbif_key=7&check_only='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto'
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
});

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&check_only=true', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&check_only=true'
	};

	lab.test('should respond exists=?', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('exists');
			done();
		});
	});

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
});

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&check_only=false', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&check_only=false'
	};

	lab.test('should respond exists=?', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.not.include('exists');
			done();
		});
	});

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
});

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&check_only=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&check_only='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&gbif_key=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&gbif_key=7'
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
});

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&gbif_key&check_only=true', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&gbif_key=7&check_only=true'
	};

	lab.test('should respond exists=?', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('exists');
			done();
		});
	});

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
});

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&gbif_key=&check_only=false', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&gbif_key=7&check_only=false'
	};

	lab.test('should respond exists=?', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.not.include('exists');
			done();
		});
	});

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
});

lab.experiment('GET /observation?latitude=&longitude=&pnet_id=&gbif_key=&check_only=', function () {
	var options = {
		method: 'GET',
		url: '/observation?latitude=0.1&longitude=0.1&pnet_id=toto&gbif_key=7&check_only='
	};

	lab.test('should respond 400', function (done){
		server.inject(options, function (response) {
			expect(response.statusCode).to.equal(400);
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