var buster = require('buster');
var http = require('http');
var fs = require('fs');
var path = require('path');
var util = require('util');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var expect = buster.assertions.expect;

var nmvn = require('../src/notmaven');
var fb = require('../src/funkybuild');

// ugly patch to wait for download to be performed.
// http can be fake eventually
buster.testRunner.timeout = 2000;

var pomTemplate = 
"<project>\
  <modelVersion>4.0.0</modelVersion>\
  <groupId>group.id</groupId>\
  <artifactId>artifact-id</artifactId>\
  <version>1.2</version>\
  <dependencies>\
  %s\
  </dependencies>\
</project>";

var dependencyTemplate = 
"<dependency>\
    <groupId>%s</groupId>\
    <artifactId>%s</artifactId>\
    <version>%s</version>\
</dependency>";

var verifyDependency = function(dep, group, artifact, version, type) {
	expect(dep.org).toEqual(group);
	expect(dep.item).toEqual(artifact);
	expect(dep.ver).toEqual(version);
	expect(dep.type).toEqual(type);
}

buster.testCase("Dependency download", {
    "get leaf dependency": function (done) {
		var leafDependency = {org:'org/hamcrest', item:'hamcrest-all', ver:'1.1', type:'jar'};
		nmvn.localrepo = path.resolve('./build/localrepo');
		nmvn.cleanLocalRepository();
		
		nmvn.downloader(leafDependency, function(err, result) {
			expect(result).toMatch(/hamcrest-all-1\.1\.jar$/);
			assert(fs.statSync(result).isFile());
			expect(fs.statSync(result).size).toEqual(541839);			
			refute(err);
			done();
		});
    },
    
	"can resolve a pom without dependencies": function () {
		var result = nmvn.resolvePom(util.format(pomTemplate, ''));
		expect(result.length).toEqual(0);
	},

	"can resolve a pom with a single dependency": function () {
		var pom = util.format(pomTemplate, util.format(dependencyTemplate, 'group.id', 'artifact.id', '0.1.2'));
		console.log(pom);
		var result = nmvn.resolvePom(pom);
		expect(result.length).toEqual(1);
		verifyDependency(result[0], 'group.id', 'artifact.id', '0.1.2', 'jar'); 
	}

	"can resolve a pom with a tvow dependencies": function () {
		var deps = 
			util.format(dependencyTemplate, 'group.id.1', 'artifact.id.1', '0.1') + 
			util.format(dependencyTemplate, 'group.id.1', 'artifact.id.1', '0.2');
		var pom = util.format(pomTemplate, deps);
		var result = nmvn.resolvePom(pom);
		expect(result.length).toEqual(2);
		verifyDependency(result[0], 'group.id.1', 'artifact.id.1', '0.1', 'jar'); 
		verifyDependency(result[1], 'group.id.2', 'artifact.id.2', '0.2', 'jar'); 
	}


});