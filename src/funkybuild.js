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
	
	var mavenrepo = '/Users/danielbrolund/.m2/repository/';
	
	fb.graph = {};
	
	fb.T = function(o, f, i) {
		fb.graph[o] = _.union(i, f);
	}
	var T = fb.T;
	
 	var runTests = function(testdir, classdirs, libs, cb) {					
		var tests = _.map(_.filter(walk(testdir), j.isJavaClass), j.toClassName).join(' ');
		runCmd(Cmd('java', '.', ['-cp', j.mergeClasspaths(classdirs, libs),'org.junit.runner.JUnitCore',tests]),
			function(exitcode) {
					console.log('======== Tested done ' + testdir + '  Exitcode: ' + exitcode + ' ======== ');
					cb(null, exitcode);
				});
	}

	fb.build = function() {
		async.auto(fb.graph,
		function(err, res) {
			if(err) {
				console.log("########## Error");
				console.trace("Here I am!")
				console.log(err);
				console.log(res);
			} else {
				console.log("---- Results");
				console.log(res);
				/*runCmd(Cmd('java', '.', ['-cp', _.union(res['mainproj.bin'], res['subproj.bin']).join(':'), 'mainprojpackage.Hello']),
				function(err, exitcode) {
					console.log(exitcode);
				});*/
			}
		});
	}	
	
	fb.run = function(project, mainClass) {
		
	}

	fb.std = function(rootdir, dir, deps) {
		var nom = function(localdir) {
			return dir + "." + localdir
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
		T(nom('testlibs'), fn([mavenrepo + 'junit/junit/4.8.2/junit-4.8.2.jar']), []);
		
		T(nom('testbin'),  
				function(cb, res) {
					javac(res[nom('test')],[res[nom('bin')]],_.union(res[nom('libs')], res[nom('testlibs')]),cb);
					}, [nom('test'), nom('bin'), nom('testlibs'), nom('libs')]);
		T(nom('unittestresult'), 
				function(cb, res) {
					runTests(res[nom('testbin')], _.union(res[nom('testbin')], res[nom('bin')]),_.union(res[nom('testlibs')], res[nom('libs')]),cb);
				}, [nom('testbin'), nom('bin'), nom('testlibs'), nom('libs')]);
	
		console.log("---- Returning standard project object for " + dir);
		console.log(fb.graph);
		return fb.graph;
	};
}());