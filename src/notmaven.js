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
	
	
	var defaultOnUndef = function(val, def) {
		return val?val:def;
	}
	
	mvn.cleanLocalRepository = function() {
		fileutils.wipeDirectory(mvn.localrepo);
	}
	
	var getProperties = function(pom) {
	    return _.reduce(pom.find('/project/properties/*'), function(memo, dep){
	            memo.push([dep.name().toString(), dep.get('./text()')]);
	            return memo;
        }, []);
	}
	
	var removeStupidNamespaces = function(xml) {
	    return xml.replace(/\<project[^\>]*\>/, '<project>');
	}

	var cleanPomAndResolveProperties = function(pom) {
	    	var cleanPom = removeStupidNamespaces(pom);
		var xmlDocWithProps = xml.parseXmlString(cleanPom);
		var properties = getProperties(xmlDocWithProps);
		var pomWithoutProperties = 
		    _.reduce(properties, function(memo, prop) {
		        var regexSafePropName = utils2.replaceAll(prop[0], '\\.', '\\.');
		        memo = utils2.replaceAll(memo, '\\$\\{' +  regexSafePropName + '\\}', prop[1]);     
		        return memo;
		    }, cleanPom);
		console.log(pomWithoutProperties);
		return pomWithoutProperties;
	}
		
	
	mvn.resolvePom = function(pom) {
		var cleanPom = cleanPomAndResolveProperties(pom);
		var xmlDoc = xml.parseXmlString(cleanPom);
		    
		return _.map(xmlDoc.find('.//dependencies/dependency'), function(dep){
			return {
				artifact:dep.get('./artifactId/text()').toString(),
			 	group:dep.get('./groupId/text()').toString(), 
				version:dep.get('./version/text()').toString(),
				type:defaultOnUndef(dep.get('./type/text()'), 'jar').toString(),
				scope:defaultOnUndef(dep.get('./scope/text()'), 'compile').toString()
			}});
	}
	
	mvn.resolveTransitiveDependencies = function(dep, cb) {
		console.log('Resolving:', dep);
		
		var returnedDep = {
		    group: dep.group, 
		    artifact: dep.artifact, 
		    version: dep.version, 
		    type: defaultOnUndef(dep.type,'jar'), 
		    scope: defaultOnUndef(dep.scope,'compile'), 
		    dependencies:[]};
		
		var pomDef = {
		    group:dep.group, 
		    artifact:dep.artifact, 
		    version:dep.version, 
		    type:'pom', 
		    dependencies:[]};
	
		mvn.downloader(
			pomDef, 
			function(err, res) {
			    console.log("Sub-resolving:", res);
				var pomContents = fs.readFileSync(res, 'utf-8');
				var subDependencies = mvn.resolvePom(pomContents);
			    console.log("Sub-resolved deps:", subDependencies);
				if(subDependencies.length==0) {
					cb(null, returnedDep);
					return;
				}
				async.map(
					subDependencies, 
					function(subDep, subCb) {
						mvn.resolveTransitiveDependencies(subDep, function(err3, res3) {
							subCb(err3, res3);
						});
					},
					function(err2, res2) {
						if(err2) {cb(err2);}
						returnedDep.dependencies = res2;
						cb(null, returnedDep);
					}
				);
		});
	}
	
	var getAndWrite = function(host, port, urlPath, localFileToWrite, cb) {
		var options = {
		  host: host,
		  port: port,
		  path: urlPath
		};
		console.log("Getting:", options);
		
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
	
	mvn.downloader = function(dep, cb) {
		var depFileName = dep.artifact + '-' + dep.version + '.' + dep.type;
		console.log('Downloading:', dep);
		
		console.log(dep.group);
		var depSubDir = path.join(utils2.replaceAll(dep.group, '[\.]', '/'), dep.artifact, dep.version);

		var localDir = path.join(mvn.localrepo, depSubDir);
		fileutils.mkdir(localDir);

		var depSubDirAndFileName = path.join(depSubDir, depFileName);

		var localFile = path.join(localDir, depFileName);
		

		getAndWrite(mvn.mavenrepo.host, mvn.mavenrepo.port, path.join(mvn.mavenrepo.path, depSubDirAndFileName), localFile, cb);
	};
}());