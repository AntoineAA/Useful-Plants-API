var Lab = require('lab');
var lab = exports.lab = Lab.script();

var Code = require('code');
var expect = Code.expect;

var server = require('../server');

var env = require('../env');

// -------------------------------------------------
// -------------------------------------------------

lab.experiment('GET /species', function () {
	var options = {
		method: 'GET',
		url: '/species'
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

// -------------------------------------------------
// -------------------------------------------------

lab.experiment('GET /species?from', function () {
	var options = {
		method: 'GET',
		url: '/species?from=' + (env.api_default_from + 1)
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

lab.experiment('GET /species?from', function () {
	var options = {
		method: 'GET',
		url: '/species?from=' + (env.api_default_from - 1)
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

lab.experiment('GET /species?size', function () {
	var options = {
		method: 'GET',
		url: '/species?size=' + (env.api_default_size + 1)
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

	lab.test('should return [size] hits or less', function (done){
		server.inject(options, function (response) {
			expect(response.result.hits.results.length).to.be.below((env.api_default_size + 2));
			done();
		});
	});
});

lab.experiment('GET /species?size', function () {
	var options = {
		method: 'GET',
		url: '/species?size=' + (env.api_default_min_size - 1)
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

lab.experiment('GET /species?size', function () {
	var options = {
		method: 'GET',
		url: '/species?size=' + (env.api_default_max_size + 1)
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

lab.experiment('GET /species?include_facets', function () {
	var options = {
		method: 'GET',
		url: '/species?include_facets=true'
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

	lab.test('should contain aggregations', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.include('aggregations');
			done();
		});
	});
});

lab.experiment('GET /species?include_facets', function () {
	var options = {
		method: 'GET',
		url: '/species?include_facets=false'
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

	lab.test('should not contain aggregations', function (done){
		server.inject(options, function (response) {
			expect(response.result).to.not.include('aggregations');
			done();
		});
	});
});

lab.experiment('GET /species?include_facets', function () {
	var options = {
		method: 'GET',
		url: '/species?include_facets=of_course'
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

lab.experiment('GET /species?family', function () {
	var options = {
		method: 'GET',
		url: '/species?family=family'
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

lab.experiment('GET /species?family', function () {
	var options = {
		method: 'GET',
		url: '/species?family='
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

lab.experiment('GET /species?genus', function () {
	var options = {
		method: 'GET',
		url: '/species?genus=genus'
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

lab.experiment('GET /species?genus', function () {
	var options = {
		method: 'GET',
		url: '/species?genus='
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

lab.experiment('GET /species?usage_cat', function () {
	var options = {
		method: 'GET',
		url: '/species?usage_cat=usage_cat'
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

lab.experiment('GET /species?usage_cat', function () {
	var options = {
		method: 'GET',
		url: '/species?usage_cat='
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

lab.experiment('GET /species?usage_type', function () {
	var options = {
		method: 'GET',
		url: '/species?usage_type=usage_type'
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

lab.experiment('GET /species?usage_type', function () {
	var options = {
		method: 'GET',
		url: '/species?usage_type='
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

lab.experiment('GET /species?search', function () {
	var options = {
		method: 'GET',
		url: '/species?search=search'
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

lab.experiment('GET /species?search', function () {
	var options = {
		method: 'GET',
		url: '/species?search='
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

lab.experiment('GET /species?sort_by', function () {
	var options = {
		method: 'GET',
		url: '/species?sort_by=species'
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

lab.experiment('GET /species?sort_by', function () {
	var options = {
		method: 'GET',
		url: '/species?sort_by=family'
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

lab.experiment('GET /species?sort_by', function () {
	var options = {
		method: 'GET',
		url: '/species?sort_by=score'
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

lab.experiment('GET /species?sort_by', function () {
	var options = {
		method: 'GET',
		url: '/species?sort_by=sort_by'
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

lab.experiment('GET /species?sort_by', function () {
	var options = {
		method: 'GET',
		url: '/species?sort_by='
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

lab.experiment('GET /species?latitude=&longitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?latitude=0.1&longitude=0.1'
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

lab.experiment('GET /species?latitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?latitude=0.1'
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

lab.experiment('GET /species?latitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?latitude='
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

lab.experiment('GET /species?latitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?latitude=latitude'
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

lab.experiment('GET /species?longitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?longitude=0.1'
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

lab.experiment('GET /species?longitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?longitude='
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

lab.experiment('GET /species?longitude=', function () {
	var options = {
		method: 'GET',
		url: '/species?longitude=longitude'
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

lab.experiment('GET /species?include_geojson', function () {
	var options = {
		method: 'GET',
		url: '/species?include_geojson=toto'
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

lab.experiment('GET /species?include_geojson', function () {
	var options = {
		method: 'GET',
		url: '/species?include_geojson=true'
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

lab.experiment('GET /species?include_geojson&longitude', function () {
	var options = {
		method: 'GET',
		url: '/species?include_geojson=true&longitude=0.1'
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

lab.experiment('GET /species?include_geojson&latitude', function () {
	var options = {
		method: 'GET',
		url: '/species?include_geojson=true&latitude=0.1'
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

lab.experiment('GET /species?include_geojson&latitude&longitude', function () {
	var options = {
		method: 'GET',
		url: '/species?include_geojson=true&latitude=0.1&longitude=0.1'
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