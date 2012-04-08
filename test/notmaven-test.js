var buster = require('buster');
var http = require('http');
var fs = require('fs');
var path = require('path');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var expect = buster.assertions.expect;

var nmvn = require('../src/notmaven');

// ugly patch to wait for download to be performed.
// http can be fake eventually
buster.testRunner.timeout = 2000;

buster.testCase("Dependency download", {
    "get leaf dependency": function (done) {
		var leafDependency = {org:'org/hamcrest', item:'hamcrest-all', ver:'1.1', type:'jar'};
		nmvn.localrepo = path.resolve('./build/localrepo');
		nmvn.cleanLocalRepository();
		
		nmvn.downloader(leafDependency, function(err, result) {
			expect(result.file).toMatch(/hamcrest-all-1\.1\.jar$/);
			assert(fs.statSync(result.file).isFile());
			expect(fs.statSync(result.file).size).toEqual(541839);			
			refute(err);
			done();
		})
    }
});