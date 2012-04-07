var buster = require('buster');
var http = require('http');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;

var nmvn = require('../src/notmaven');

buster.testRunner.timeout = 2000;

buster.testCase("Dependency download", {
    "get leaf dependency": function (done) {
		var leafDependency = {org:'org/hamcrest', item:'hamcrest-all', ver:'1.1', type:'jar'};
		nmvn.downloader(leafDependency, function(err, result) {
			assert(result);
			refute(err);
			done();
		})
		assert(true);
		refute(false);
    }
});