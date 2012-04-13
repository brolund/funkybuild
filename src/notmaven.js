(function(){
	var mvn = {};
	module.exports = mvn;

	var path = require('path');
	var fs = require('fs');
	var http = require('http');
	var _ = require('underscore');
	var fileutils = require('./fileutils');
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
				artifactId:dep.get('./artifactId/text()'),
			 	groupId:dep.get('./groupId/text()'), 
				version:dep.get('./version/text()'),
				type:defaultOnUndef(dep.get('./type/text()'), 'jar'),
				scope:defaultOnUndef(dep.get('./scope/text()'), 'compile')
			}});
	}
	
	mvn.downloader = function(dep, cb) {
		var depFileName = dep.artifactId + '-' + dep.version + '.' + dep.type;
		console.log('Downloading ' + depFileName);

		var depSubDir = path.join(dep.groupId, dep.artifactId, dep.version);

		var localDir = path.join(mvn.localrepo, depSubDir);
		fileutils.mkdir(localDir);

		var depSubDirAndFileName = path.join(depSubDir, depFileName);

		var localFile = path.join(localDir, depFileName);
		

		getAndWrite(mvn.mavenrepo.host, mvn.mavenrepo.port, path.join(mvn.mavenrepo.path, depSubDirAndFileName), localFile, cb);
	};
}());