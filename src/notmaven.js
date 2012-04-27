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
		return pomWithoutProperties;
	}
	
    mvn.resolveVersionFromMetadataFile = function(groupId, artifactId, cb) {
        getAndWrite(
            mvn.mavenrepo.host, 
            mvn.mavenrepo.port,
            path.join(mvn.mavenrepo.path,utils2.replaceAll(groupId, '\\.', '/'),artifactId,'maven-metadata.xml'),
            path.join(mvn.localrepo,utils2.replaceAll(groupId, '\\.', '/'),artifactId,'maven-metadata.xml'),
            function(err, metadataFileName){
                if(err){cb(err);}
                else {
                    var dom = xml.parseXmlString(fs.readFileSync(metadataFileName, 'utf-8'));
                    cb(null, dom.get('/metadata/versioning/release/text()'));
                }
        });
    }
	
	mvn.resolvePom = function(pom, cb) {
		var cleanPom = cleanPomAndResolveProperties(pom);
		var xmlDoc = xml.parseXmlString(cleanPom);
		var dependencies = xmlDoc.find('.//dependencies/dependency');
		
		async.map(dependencies, function(dep, depCb) {
		    var groupId = dep.get('./groupId/text()').toString();
		    var artifactId = dep.get('./artifactId/text()').toString();
		    if(groupId.indexOf('${')>-1) {
		        depCb('Bad groupId '+ groupId + ' in pom:\n' + pom); 
		        return;
		    }
		    if(artifactId.indexOf('${')>-1) {
		        depCb('Bad artifactId '+ artifactId + ' in pom:\n' + pom); 
		        return;
		    }
		    var versionNr = dep.get('./version/text()');
		    if(versionNr) {
		        depCb(null, {
                    artifact:artifactId,
                    group:groupId, 
                    version:versionNr.toString(),
                    type:defaultOnUndef(dep.get('./type/text()'), 'jar').toString(),
                    scope:defaultOnUndef(dep.get('./scope/text()'), 'compile').toString()
                });
            } else {
		        mvn.resolveVersionFromMetadataFile(groupId, artifactId, function(err, resolvedVersionNr) {
                    depCb(null, {
                        artifact:artifactId,
                        group:groupId, 
                        version:resolvedVersionNr,
                        type:defaultOnUndef(dep.get('./type/text()'), 'jar').toString(),
                        scope:defaultOnUndef(dep.get('./scope/text()'), 'compile').toString()
                    });
                });
            }
        }, function(err, mappingResult) {
            cb(err,mappingResult);
        });
	}
	
	mvn.resolveTransitiveDependencies = function(dep, resolutionCallback) {
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
			function(downloadError, downloadedFile) {
			    if(downloadError) {resolutionCallback(downloadError); return;}
			    console.log("Sub-resolving:", downloadedFile);
				var pomContents = fs.readFileSync(downloadedFile, 'utf-8');
				mvn.resolvePom(pomContents, function(subDependencyError, subDependencies){
                    if(subDependencyError) {resolutionCallback(subDependencyError); return;}
                    if(subDependencies.length==0) {
                        resolutionCallback(null, returnedDep);
                    } else {
                        console.log("Sub-resolved deps:", subDependencies);
                        async.map(
                            subDependencies, 
                            function(subDep, subDepCallback) {
                                mvn.resolveTransitiveDependencies(subDep, function(resolutionError, resolvedDependency) {
                                    subDepCallback(resolutionError, resolvedDependency);
                                });
                            },
                            function(asyncResolutionError, arrayOfResolvedDependencies) {
                                if(asyncResolutionError) { resolutionCallback(asyncResolutionError); return;}
                                returnedDep.dependencies = arrayOfResolvedDependencies;
                                resolutionCallback(null, returnedDep);
                            }
                        );
                    }				
				});
            });
	}
	
	var getAndWrite = function(host, port, urlPath, localFileToWrite, cb) {
		var options = {
		  host: host,
		  port: port,
		  path: urlPath
		};
		//console.log("Getting:", options);
		
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