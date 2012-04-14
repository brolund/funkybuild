(function(){
	var mvn = {};
	module.exports = mvn;

	var path = require('path');
	var async = require('async');
	var fs = require('fs');
	var http = require('http');
	var _ = require('underscore');
	var fileutils = require('./fileutils');
	var utils2 = require('./utils');
	var xml = require('libxmljs');
	
	mvn.localrepo = process.env.HOME + '/.m2/funkyrepo/';
	//mvn.mavenrepo = {host:'mirrors.ibiblio.org', port:80, path:'/maven2/'};
	mvn.mavenrepo = {host:'uk.maven.org', port:80, path:'/maven2/'};
	
	var getAndWrite = function(host, port, urlPath, localFileToWrite, cb) {
		var options = {
		  host: host,
		  port: port,
		  path: urlPath
		};
		console.log(options);
		
		http.get(options, function(res) {
		  	console.log('Got response: ' + res.statusCode + ' for ' + options.path);
			var fileopts = {flags: 'w',
			  				encoding: null,
		  					mode: 0666 };
			var writeStream = fs.createWriteStream(localFileToWrite, fileopts);
			res.on('data', function (chunk) {
				writeStream.write(chunk, encoding='binary');
		  	});
			res.on('end', function () {
				writeStream.on('close', function() {cb(null, localFileToWrite);});
				writeStream.end();				
		  	});
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
			cb(e, null);
		});
	}
	
	var defaultOnUndef = function(val, def) {
		return val?val:def;
	}
	
	mvn.cleanLocalRepository = function() {
		fileutils.wipeDirectory(mvn.localrepo);
	}
	
	mvn.resolvePom = function(pom) {
		var xmlDoc = xml.parseXmlString(pom);
		return _.map(xmlDoc.find("//dependency"), function(dep){
			return {
				artifact:dep.get('./artifactId/text()'),
			 	group:dep.get('./groupId/text()'), 
				version:dep.get('./version/text()'),
				type:defaultOnUndef(dep.get('./type/text()'), 'jar'),
				scope:defaultOnUndef(dep.get('./scope/text()'), 'compile')
			}});
	}
	
	mvn.resolveTransitiveDependencies = function(dep, cb) {
		var pom = {group:dep.group, artifact:dep.artifact, version:dep.version, scope:dep.scope, type:'pom'};
		
		mvn.downloader(
			pom, 
			function(err, res) {
				var subDependencies = mvn.resolvePom(fs.readFileSync(res));
				async.map(
					subDependencies, 
					function(subDep, subCb) {
						mvn.resolveTransitiveDependencies(subDep, function(err3, res3) {
							subCb(err3, res3);
						})
					},
					function(err2, res2) {
						if(err2) {cb(err2);}
						pom.dependencies = res2;
						cb(pom);
					}
				);
		});
	}
	
	mvn.downloader = function(dep, cb) {
		var depFileName = dep.artifact + '-' + dep.version + '.' + dep.type;
		console.log('Downloading ' + depFileName);
		
		console.log(dep.group);
		var depSubDir = path.join(utils2.replaceAll(dep.group, '[\.]', '/'), dep.artifact, dep.version);

		var localDir = path.join(mvn.localrepo, depSubDir);
		fileutils.mkdir(localDir);

		var depSubDirAndFileName = path.join(depSubDir, depFileName);

		var localFile = path.join(localDir, depFileName);
		

		getAndWrite(mvn.mavenrepo.host, mvn.mavenrepo.port, path.join(mvn.mavenrepo.path, depSubDirAndFileName), localFile, cb);
	};
}());