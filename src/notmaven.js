(function(){
	var mvn = {};
	module.exports = mvn;

	var path = require('path');
	var fs = require('fs');
	var http = require('http');
	var fileutils = require('./fileutils');
	
	mvn.localrepo = process.env.HOME + '/.m2/funkyrepo/';
	//mvn.mavenrepo = {host:'mirrors.ibiblio.org', port:80, path:'/maven2/'};
	mvn.mavenrepo = {host:'uk.maven.org', port:80, path:'/maven2/'};
	
	mvn.downloader = function(cb, dep) {
		console.log('Downloading');
		var depSubDir = path.join(dep.org, dep.item, dep.ver);
		var depFileName = dep.item + '-' + dep.ver+'.' + dep.type;
		var depSubDirAndFileName = path.join(depSubDir, depFileName);

		var localDir = path.join(mvn.localrepo, depSubDir);
		fileutils.mkdir(localDir);
		var localFile = path.join(localDir, depFileName);
		
		var options = {
		  host: mvn.mavenrepo.host,
		  port: mvn.mavenrepo.port,
		  path: path.join(mvn.mavenrepo.path, depSubDirAndFileName)
		};

		console.log(options);
		
		
		http.get(options, function(res) {
		  	console.log('Got response: ' + res.statusCode + ' for ' + depFileName);
			var fileopts = {flags: 'w',
			  				encoding: null,
		  					mode: 0666 };
			var writeStream = fs.createWriteStream(localFile, fileopts);
			res.on('data', function (chunk) {
				writeStream.write(chunk, encoding='binary');
		  	});
			res.on('end', function () {
				writeStream.end();
				cb(null, localFile);
		  	});
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
			cb(e, null);
		});
	};
}());