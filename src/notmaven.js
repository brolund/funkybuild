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
	mvn.mavenrepourl = 'http://uk.maven.org:80/maven2/';
	
	
	var defaultOnUndef = function(val, def) {
		return val?val:def;
	};
	
	mvn.cleanLocalRepository = function() {
		fileutils.wipeDirectory(mvn.localrepo);
	};
	
	var getProperties = function(pom) {
	    return _.reduce(pom.find('/project/properties/*'), function(memo, dep){
	            memo.push([dep.name().toString(), dep.get('./text()')]);
	            return memo;
        }, []);
	};
	
	var removeStupidNamespaces = function(xml) {
	    return xml.replace(/\<project[^\>]*\>/, '<project>');
	};

	var cleanPomAndResolveProperties = function(pom) {
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
	
    mvn.resolveVersionFromParent = function(groupId, artifactId, parentGroupId, parentArtifactId, parentVersion, cb) {
        var parentPomPath = path.join(
                utils2.replaceAll(parentGroupId, '\\.', '/'),
                parentArtifactId,
                parentVersion,
                parentArtifactId + '-' + parentVersion + '.pom');
        fileutils.mkdir(
        		path.join(
        				mvn.localrepo, 
        				utils2.replaceAll(parentGroupId, '\\.', '/'),
        				parentArtifactId,
        				parentVersion));
        getAndWrite(
            mvn.mavenrepo.host, 
            mvn.mavenrepo.port,
            path.join(mvn.mavenrepo.path, parentPomPath),
            path.join(mvn.localrepo, parentPomPath),
            function(err, parentPomFileName){
                if(err){cb(err);}
                else {
                    var cleanPom = cleanPomAndResolveProperties(fs.readFileSync(parentPomFileName, 'utf-8'));
                    console.log(cleanPom);
                    var dom = xml.parseXmlString(cleanPom);
                    var version = dom.get(
                        "/project/dependencies/dependency[./artifactId/text()='" + artifactId + "']/version/text()")
                    cb(null, version.toString());
                }
            }
        );
    }
	
    mvn.resolvePomAncestory = function(pomDef /*{group:'group', artifact:'artifact', version:'version'}*/, 
			fileContentsDownloader,
			pomsSoFar,
			fileContentsCallback) {
    	var url = path.join(mvn.mavenrepourl, pomDef.group, pomDef.artifact, pomDef.version, pomDef.artifact + '-' + pomDef.version + '.pom' );
    	fileContentsDownloader(url, function(err, res) {
    		var cleanedPom = removeStupidNamespaces(res);
    		var xmlPom = xml.parseXmlString(cleanedPom);
    		pomsSoFar.push(xmlPom);
    		if(xmlPom.get('/project/parent')) {
    			var parentGroup = xmlPom.get('/project/parent/groupId/text()').toString();
    			var parentArtifact = xmlPom.get('/project/parent/artifactId/text()').toString();
    			var parentVersion = xmlPom.get('/project/parent/version/text()').toString();
    			mvn.resolvePomAncestory(
    					{group:parentGroup, artifact:parentArtifact, version:parentVersion}, 
    					fileContentsDownloader,
    					pomsSoFar,
    					fileContentsCallback);
    		} else {
        		fileContentsCallback(null, pomsSoFar);
    		}
    	});
    };
    
	mvn.resolvePom = function(pom, cb) {
    	var parseablePom = removeStupidNamespaces(pom);
		var xmlDoc = xml.parseXmlString(parseablePom);

		if(xmlDoc.get('/project/parent')) {
			var parentGroupId = xmlDoc.get('/project/parent/groupId/text()').toString();
	        var parentArtifactId = xmlDoc.get('/project/parent/artifactId/text()').toString();
	        var parentVersion = xmlDoc.get('/project/parent/version/text()').toString();
	        console.log(parentGroupId, parentArtifactId, parentVersion);
		}

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