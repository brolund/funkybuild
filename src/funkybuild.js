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
				runCmd(Cmd('java', '.', ['-cp', _.union(res[project + '.bin'], res[project + '.libs']).join(':'), mainClass]),
				function(exitcode) {
					cb(null, exitcode);
				})}, 
				[project + '.bin', project + '.libs']);
		
	}

	fb.std = function(config) {
		console.log("---- Creating std project for " + config);
		var rootdir = config.root;
		var dir = config.project;
		var deps = config.projectdeps;
		var testlibs = config.testlibs;
		
		var nom = function(localdir) {
			return dir + "." + localdir
		}
		var repo = function(id) {
			return "repo|" + id;
		}
		for(i in testlibs) {
			T(repo(testlibs[i]), function(cb, res){cb(null, fb.downloader(testlibs[i]));}, []);
		}
		T(nom('src'), fn(path.join(rootdir, dir,"/src/main/java/")), []);
		var dependencies = deps&&deps.length>0
			?_.map(deps, function(dep) {return dep + '.bin'})
			:[]
		var depFunc = deps&&deps.length>0
			? function(cb, res){
				var a = _.union(_.map(deps, 
					function(dep) {
						return res[dep + '.bin'];
					}
				));
				console.log(a);
				cb(null, a);
			}
			: fn([])
		T(nom('libs'), depFunc, dependencies);
		T(nom('bin'), function(cb, res) {javac(res[nom('src')],[],res[nom('libs')],cb);}, [nom('src'), nom('libs')]);
		T(nom('test'), fn(path.join(rootdir, dir, "/src/test/java/")), []);
		T(nom('testlibs'), 
			function(cb, res){cb(null, _.map(testlibs, function(lib){return res[repo(lib)]} ));},
		 	_.map(testlibs, function(lib){return repo(lib)} ));
		
		T(nom('testbin'),  
				function(cb, res) {
					javac(res[nom('test')],[res[nom('bin')]],_.union(res[nom('libs')], res[nom('testlibs')]),cb);
					}, [nom('test'), nom('bin'), nom('testlibs'), nom('libs')]);
		T(nom('unittestresult'), 
				function(cb, res) {
					runTests(res[nom('testbin')], _.union(res[nom('testbin')], res[nom('bin')]),_.union(res[nom('testlibs')], res[nom('libs')]),cb);
				}, [nom('testbin'), nom('bin'), nom('testlibs'), nom('libs')]);
	
		return fb.graph;
	};
}());