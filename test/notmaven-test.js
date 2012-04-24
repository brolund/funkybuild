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
buster.testRunner.timeout = 10000;

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

var maxPom =
"<?xml version=\"1.0\"?><project>\n\
  <parent>\n\
    <artifactId>parent</artifactId>\n\
    <groupId>com.agical.rmock</groupId>\n\
    <version>2.0.0</version>\n\
  </parent>\n\
  <modelVersion>4.0.0</modelVersion>\n\
  <groupId>com.agical.rmock</groupId>\n\
  <artifactId>rmock</artifactId>\n\
  <name>RMock</name>\n\
  <version>2.0.2</version>\n\
  <description>RMock 2.0 is a Java mock object framework to use with jUnit. \n\
    RMock has support for a setup-modify-run-verify workflow when writing jUnit tests. \n\
    It integrates better with IDE refactoring support and allows designing classes and interfaces in a true test-first fashion.</description>\n\
  <url>http://rmock.sourceforge.net</url>\n\
  <build>\n\
    <plugins>\n\
      <plugin>\n\
        <artifactId>maven-surefire-plugin</artifactId>\n\
        <version>2.1</version>\n\
        <configuration>\n\
          <includes>\n\
            <include>**/*AllTests*.java</include>\n\
          </includes>\n\
          <childDelegation>true</childDelegation>\n\
        </configuration>\n\
      </plugin>\n\
      <plugin>\n\
        <artifactId>maven-compiler-plugin</artifactId>\n\
        <configuration>\n\
          <source>1.3</source>\n\
          <target>1.3</target>\n\
        </configuration>\n\
      </plugin>\n\
      <plugin>\n\
        <artifactId>maven-project-info-reports-plugin</artifactId>\n\
      </plugin>\n\
      <plugin>\n\
        <artifactId>maven-clover-plugin</artifactId>\n\
        <executions>\n\
          <execution>\n\
            <phase>site</phase>\n\
            <goals>\n\
              <goal>instrument</goal>\n\
              <goal>clover</goal>\n\
            </goals>\n\
          </execution>\n\
        </executions>\n\
        <configuration>\n\
          <targetPercentage>93%</targetPercentage>\n\
          <generateHistorical>true</generateHistorical>\n\
          <historyDir>clover_history</historyDir>\n\
          <licenseLocation>${basedir}/../tools/licenses/clover.license</licenseLocation>\n\
          <generateXml>true</generateXml>\n\
          <generateHtml>true</generateHtml>\n\
          <generatePdf>true</generatePdf>\n\
        </configuration>\n\
      </plugin>\n\
      <plugin>\n\
        <artifactId>maven-assembly-plugin</artifactId>\n\
        <version>2.0-beta-1</version>\n\
        <configuration>\n\
          <descriptor>src/assembly/rmock-minimal.xml</descriptor>\n\
          <finalName>rmock_minimal</finalName>\n\
          <outputDirectory>target/assembly</outputDirectory>\n\
          <workDirectory>target/assembly/work</workDirectory>\n\
        </configuration>\n\
      </plugin>\n\
    </plugins>\n\
  </build>\n\
  <dependencies>\n\
    <dependency>\n\
      <groupId>junit</groupId>\n\
      <artifactId>junit</artifactId>\n\
      <version>3.8.1</version>\n\
      <scope>compile</scope>\n\
    </dependency>\n\
    <dependency>\n\
      <groupId>cglib</groupId>\n\
      <artifactId>cglib-nodep</artifactId>\n\
      <version>2.1_2</version>\n\
      <scope>compile</scope>\n\
    </dependency>\n\
  </dependencies>\n\
  <reporting>\n\
    <plugins>\n\
      <plugin>\n\
        <artifactId>maven-clover-plugin</artifactId>\n\
        <configuration></configuration>\n\
      </plugin>\n\
    </plugins>\n\
  </reporting>\n\
  <distributionManagement>\n\
    <status>deployed</status>\n\
  </distributionManagement>\n\
</project>"

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
    
	"can resolve a pom without dependencies": function () {
		var result = nmvn.resolvePom(util.format(pomTemplate, ''));
		expect(result.length).toEqual(0);
	},

	"can resolve a pom with a single dependency": function () {
		var pom = 
			util.format(pomTemplate, util.format(dependencyTemplate, 'group.id', 'artifact.id', '0.1.2', 'jar', 'scope'));
		var result = nmvn.resolvePom(pom);
		expect(result.length).toEqual(1);
		verifyDependency(result[0], 'group.id', 'artifact.id', '0.1.2', 'jar', 'scope'); 
	},

	"can resolve a pom with a two scoped dependencies": function () {
		var deps = 
			util.format(dependencyTemplate, 'group.id.1', 'artifact.id.1', '0.1', 'jar', 'some scope') + 
			util.format(dependencyTemplate, 'group.id.2', 'artifact.id.2', '0.2', 'jar', 'some other scope');
		var pom = util.format(pomTemplate, deps);
		var result = nmvn.resolvePom(pom);
		expect(result.length).toEqual(2);
		verifyDependency(result[0], 'group.id.1', 'artifact.id.1', '0.1', 'jar', 'some scope'); 
		verifyDependency(result[1], 'group.id.2', 'artifact.id.2', '0.2', 'jar', 'some other scope'); 
	},

	"can resolve a large pom with a two scoped dependencies": function () {
		var result = nmvn.resolvePom(maxPom);
		expect(result.length).toEqual(2);
		verifyDependency(result[0], 'junit', 'junit', '3.8.1', 'jar', 'compile'); 
		verifyDependency(result[1], 'cglib', 'cglib-nodep', '2.1_2', 'jar', 'compile'); 
	},

	"defaults type to jar and scope to compile": function () {
		var deps = 
			util.format(minimalDependencyTemplate, 'group.id.1', 'artifact.id.1', '0.1');
		var pom = util.format(pomTemplate, deps);
		var result = nmvn.resolvePom(pom);
		expect(result.length).toEqual(1);
		verifyDependency(result[0], 'group.id.1', 'artifact.id.1', '0.1', 'jar', 'compile'); 
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
	}
	

});