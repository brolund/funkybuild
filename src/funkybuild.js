(function(){
	var fb = {};
	module.exports = fb;

	var async = require('async');
	var _ = require('underscore');

	var path = require('path');
	var fn = require('./utils').fn;

	var _ = require('underscore');

	var walk = require('./fileutils').walk;

	var j = require('./java');
	var javac = j.javac;

	var utils = require('./utils');
	var Cmd = utils.Cmd;
	var runCmd = utils.runCmd;
	
	
	fb.graph = {};
	
	fb.downloader = function() {
		throw 'No downloader configured. Configure with e.g. fb.downloadWith(mvn.downloader)';
	};
	
	fb.T = function(o, f, i) {
		fb.graph[o] = _.union(i, f);
	}
	fb.downloadWith = function(downloader) {
		fb.downloader = downloader;
	}
	var T = fb.T;
	
 	var runTests = function(testdir, classdirs, libs, cb) {					
		var tests = _.map(_.filter(walk(testdir), j.isJavaClass), j.toClassName).join(' ');
		runCmd(Cmd('java', '.', ['-cp', j.mergeClasspaths(classdirs, libs),'org.junit.runner.JUnitCore',tests]),
			function(exitcode) {
					cb(null, exitcode);
				});
	}

	fb.build = function() {
		async.auto(fb.graph,
		function(err, res) {
			if(err) {
				console.error("########## Error");
				console.error(err);
				console.trace("This is where the error was:")
			} else {
				console.log("---- Results");
				console.log(res);
			}
		});
	}	
	
	fb.run = function(project, mainClass) {
		T('Result of ' + mainClass, 
			function(cb, res) {
				runCmd(Cmd('java', '.', ['-cp', _.union(res[project + '.bin'], res[project + '.projectdeps']).join(':'), mainClass]),
				function(exitcode) {
					cb(null, exitcode);
				})}, 
				[project + '.bin', project + '.projectdeps']);
		
	}

	fb.std = function(config) {
		console.log('---- Creating std project for');
	 	console.log(config);
	 	console.log('--------');
		var rootdir = config.root;
		var dir = config.project;
		var deps = config.projectdeps;
		var testlibs = config.testlibs;
		var libs = config.libs;

		var nom = function(localdir) {
			return dir + "." + localdir
		}
		var repo = function(id) {
			return 'repo::' + id.org + ':' + id.item + ':' + id.ver + ':' + id.type;
		}
		
		_.each(_.union(libs, testlibs), function(lib) {
			T(repo(lib), function(l) {
				return function(cb, res){
					fb.downloader(cb, l);
				}}(lib), []);
		});
		
		T(nom('src'), fn(path.join(rootdir, dir,"/src/main/java/")), []);
		T(nom('test'), fn(path.join(rootdir, dir, "/src/test/java/")), []);

		deps = deps?deps:[];
		var projectDependencies = _.map(deps, function(dep) {return dep + '.bin';});
		var depFunc = deps.length>0
			? function(cb, res){ cb(null, _.union(_.map(deps, function(dep) {return res[dep + '.bin'];}))); }
			: fn([]);
			
		T(nom('projectdeps'), 
			depFunc, projectDependencies);

		T(nom('bin'), 
			function(cb, res) {
				javac(res[nom('src')],[res[nom('libs')],res[nom('projectdeps')]],cb);
			}, [nom('src'), nom('libs'), nom('projectdeps')]);
		
		T(nom('testlibs'), 
			function(cb, res){
				cb(null, _.map(testlibs, function(lib){return res[repo(lib)]} ));
			}, _.map(testlibs, function(lib){return repo(lib)} ));
		
		T(nom('libs'), 
			function(cb, res){
				cb(null, _.map(libs, function(lib){return res[repo(lib)]} ));
			}, _.map(libs, function(lib){return repo(lib)} ));
		
		T(nom('testbin'),  
			function(cb, res) {
				javac(res[nom('test')],[res[nom('bin')], res[nom('projectdeps')], res[nom('libs')], res[nom('testlibs')]],cb);
			}, [nom('test'), nom('bin'), nom('libs'), nom('testlibs'), nom('projectdeps')]);
					
		T(nom('unittestresult'), 
				function(cb, res) {
					runTests(res[nom('testbin')], _.union(res[nom('testbin')], res[nom('bin')]),_.union(res[nom('testlibs')], res[nom('projectdeps')]),cb);
				}, [nom('testbin'), nom('bin'), nom('testlibs'), nom('projectdeps')]);
	
		return fb.graph;
	};
}());