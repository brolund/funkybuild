(function(){
	var mvn = {};
	module.exports = mvn;

	var path = require('path');
	var fs = require('fs');
	var http = require('http');
	var fileutils = require('./fileutils');
	
	mvn.localrepo = '/Users/danielbrolund/.m2/funkyrepo/';
	mvn.mavenrepo = {host:'localhost', port:8000, path:'/'};

	mvn.downloader = function(dep) {
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

		console.log('Downloading');
		console.log(options);
		
		http.get(options, function(res) {
		  	console.log("Got response: " + res.statusCode);
			var fileopts = {flags: 'w',
			  				encoding: null,
			  				mode: 0666 };
			
			var writeStream = fs.createWriteStream(localFile, fileopts);
			res.on('data', function (chunk) {
				writeStream.write(chunk);
		  	});
			res.on('end', function () {
				writeStream.end();
		  	});
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});

		return localFile;
	};
}());