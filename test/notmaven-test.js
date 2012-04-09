var buster = require('buster');
var http = require('http');
var fs = require('fs');
var path = require('path');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var expect = buster.assertions.expect;

var nmvn = require('../src/notmaven');
var fb = require('../src/funkybuild');

// ugly patch to wait for download to be performed.
// http can be fake eventually
buster.testRunner.timeout = 2000;

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
		})
    },
    
	"can resolve a pom without dependencies": function (done) {
		var pom = '<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">\
		<modelVersion>4.0.0</modelVersion>\
		<parent>\
		<groupId>org.hamcrest</groupId>\
		<artifactId>hamcrest-parent</artifactId>\
		<version>1.1</version>\
		</parent>\
		<artifactId>hamcrest-all</artifactId>\
		<packaging>jar</packaging>\
		<name>Hamcrest All</name>\
		</project>';
		var calls = [];
		fb.T = function(out, fn, inputs) {
			calls.push({o:out, f:fn, i:inputs});
		};
		nmvn.resolvePom(pom, function(err,res) {
			expect(calls.length).toEqual(0);
			done();
		});
	}

});