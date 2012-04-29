var buster = require('buster');
var http = require('http');
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var expect = buster.assertions.expect;

var nmvn = require('../src/notmaven');
var fb = require('../src/funkybuild');

// ugly patch to wait for download to be performed.
// http can be fake eventually
buster.testRunner.timeout = 2000;

var pomTemplate = 
"<project \
xmlns=\"http://maven.apache.org/POM/4.0.0\"\
xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\
xsi:schemaLocation=\"http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd\"\
>\
	<modelVersion>4.0.0</modelVersion>\
	%s\
	<groupId>group.id</groupId>\
	<artifactId>artifact-id</artifactId>\
	<version>1.2</version>\
	<properties>\
  %s\
  </properties>\
  <dependencies>\
  %s\
  </dependencies>\
</project>";

var dependencyTemplate = 
"<dependency>\n\
    <groupId>%s</groupId>\n\
    <artifactId>%s</artifactId>\n\
    <version>%s</version>\n\
    <type>%s</type>\n\
    <scope>%s</scope>\n\
</dependency>";

var minimalDependencyTemplate = 
"<dependency>\n\
    <groupId>%s</groupId>\n\
    <artifactId>%s</artifactId>\n\
    <version>%s</version>\n\
</dependency>";

var verifyDependency = function(dep, group, artifact, version, type, scope) {
	expect(dep.group).toEqual(group);
	expect(dep.artifact).toEqual(artifact);
	expect(dep.version).toEqual(version);
	expect(dep.type).toEqual(type);
	expect(dep.scope).toEqual(scope);
}

var noParent = '';
var noProperties = '';
var noDependencies = '';

buster.testCase("Dependency download", {
    "get leaf dependency": function (done) {
		var leafDependency = {group:'org/hamcrest', artifact:'hamcrest-all', version:'1.1', type:'jar'};
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
    
	"can resolve a pom without dependencies": function (done) {
		nmvn.resolvePom(util.format(pomTemplate, noParent, noProperties, noDependencies), function(err, result) {
		        expect(result.length).toEqual(0);
		        done();
		});
	},

	"can resolve a pom with a single dependency": function (done) {
		var pom = util.format(
		        pomTemplate, 
		        noParent, 
		        noDependencies, 
		        util.format(dependencyTemplate, 'group.id', 'artifact.id', '0.1.2', 'jar', 'scope'));

        nmvn.resolvePom(pom, function(err, result) {
            expect(result.length).toEqual(1);
            verifyDependency(result[0], 'group.id', 'artifact.id', '0.1.2', 'jar', 'scope'); 
            done();
        });
	},

	"can resolve a pom with a two scoped dependencies": function (done) {
		var deps = 
			util.format(dependencyTemplate, 'group.id.1', 'artifact.id.1', '0.1', 'jar', 'some scope') + 
			util.format(dependencyTemplate, 'group.id.2', 'artifact.id.2', '0.2', 'jar', 'some other scope');
		var pom = util.format(pomTemplate, noParent, noProperties, deps);

		nmvn.resolvePom(pom, function(err, result) {
            expect(result.length).toEqual(2);
            verifyDependency(result[0], 'group.id.1', 'artifact.id.1', '0.1', 'jar', 'some scope'); 
            verifyDependency(result[1], 'group.id.2', 'artifact.id.2', '0.2', 'jar', 'some other scope'); 
            done();
		});
	},
                           
	"defaults type to jar and scope to compile": function (done) {
		var deps = 
			util.format(minimalDependencyTemplate, 'group.id.1', 'artifact.id.1', '0.1');
		var pom = util.format(pomTemplate, noParent, '', deps);

		nmvn.resolvePom(pom, function(err, result){
            expect(result.length).toEqual(1);
            verifyDependency(result[0], 'group.id.1', 'artifact.id.1', '0.1', 'jar', 'compile'); 
            done();
		});
	},

	"resolves transient pom dependencies": function (done) {
		nmvn.resolveTransitiveDependencies({group:'com.agical.rmock', artifact:'rmock', version:'2.0.2'},
			function(err, result) {
				console.log("Result:", result);
				expect(result).toEqual({
					group:'com.agical.rmock', artifact:'rmock', version:'2.0.2', type:'jar',scope:'compile',
					dependencies: [
						{group:'junit', artifact:'junit', version:'3.8.1', type:'jar',scope:'compile', dependencies:[]},
						{group:'cglib', artifact:'cglib-nodep', version:'2.1_2', type:'jar',scope:'compile', dependencies:[]},				
					]});
				done();
			});
	},	

	"resolves pom ancestry": function (done) {
		var index = -1;
		var poms = [util.format(pomTemplate, 
				"<parent>\
					<artifactId>parentArtifact</artifactId>\
					<groupId>parentGroup</groupId>\
					<version>parentVersion</version>\
				</parent>", noProperties, noDependencies), 
				pomTemplate];
		var urls = [path.join(nmvn.mavenrepourl, 'group', 'artifact', 'version', 'artifact-version.pom'), 
		            path.join(nmvn.mavenrepourl, 'parentGroup', 'parentArtifact', 'parentVersion', 'parentArtifact-parentVersion.pom')];
		
		var downloader = function(url, contentsCallback) {
			index++;
			console.log("In downloader:", url, index);
			expect(url).toMatch(urls[index]);
			contentsCallback(null, poms[index]);
		};
		
		nmvn.resolvePomAncestory({group:'group', artifact:'artifact', version:'version'}, 
				downloader,
				[],
				function(err, res){
			expect(res[0].get('/project/parent/artifactId')).toBeDefined();
			refute.defined(res[1].get('/project/parent/artifactId'));
			done();
		});
	},
	
	"resolves properties": function (done) {
		var deps = 
		    util.format(dependencyTemplate, '${group.val}', '${artifact}', '${version}', '${type}', '${scope}') +
		    util.format(dependencyTemplate, '${group.val}', '${artifact}', '${version}', '${type}', '${scope}');

		var properties = 
                '<group.val>some-group</group.val>\
                <artifact>some-artifact</artifact>\
                <version>some-version</version>\
                <type>some-type</type>\
                <scope>some-scope</scope>';

        var pom = util.format(pomTemplate, noParent, properties, deps);

		nmvn.resolvePom(pom, function(err, result) {
            expect(result.length).toEqual(2);
            verifyDependency(result[0], 'some-group', 'some-artifact', 'some-version', 'some-type', 'some-scope'); 
            verifyDependency(result[1], 'some-group', 'some-artifact', 'some-version', 'some-type', 'some-scope'); 
            done();
		});
	},
	
	

});