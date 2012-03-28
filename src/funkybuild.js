(function(){
	var fb = {};
	module.exports = fb;

	var path = require('path');
	var fn = require('./utils').fn;

	var _ = require('underscore');

	var walk = require('./fileutils').walk;

	var j = require('./java');
	var javac = j.javac;

	var utils = require('./utils');
	var Cmd = utils.Cmd;
	var runCmd = utils.runCmd;
	
	var mavenrepo = '/Users/danielbrolund/.m2/repository/'
	
	
	
 	var runTests = function(testdir, classdirs, libs, cb) {					
		var tests = _.map(_.filter(walk(testdir), j.isJavaClass), j.toClassName).join(' ');
		runCmd(Cmd('java', '.', ['-cp', j.mergeClasspaths(classdirs, libs),'org.junit.runner.JUnitCore',tests]),
			function(exitcode) {
					console.log('======== Tested done ' + testdir + '  Exitcode: ' + exitcode + ' ======== ');
					cb(null, exitcode);
				});
	}

	fb.std = function(rootdir, dir, deps) {
		var nom = function(localdir) {
			return dir + "." + localdir
		}
		var p = {};
		p[nom('src')]=fn(path.join(rootdir, dir,"/src/main/java/"));
		p[nom('libs')]=deps&&deps.length>0
			?_.union(_.map(deps, function(dep) {return dep + '.bin'}), [
			function(cb, res){
				var a = _.union(_.map(deps, 
					function(dep) {
						return res[dep + '.bin'];
					}
				));
			console.log(a);
			cb(null, a);
			}])	
			:fn([]);
		p[nom('bin')]=[nom('src'), nom('libs'), function(cb, res) {javac(res[nom('src')],[],res[nom('libs')],cb);}];
		p[nom('test')]=fn(path.join(rootdir, dir, "/src/test/java/"));
		p[nom('testlibs')]=fn([mavenrepo + 'junit/junit/4.8.2/junit-4.8.2.jar']);
		p[nom('testbin')]=[nom('test'), nom('bin'), nom('testlibs'), nom('libs'), 
				function(cb, res) {
					javac(res[nom('test')],[res[nom('bin')]],_.union(res[nom('libs')], res[nom('testlibs')]),cb);
					}];
		p[nom('unittestresult')]=[nom('testbin'), nom('bin'), nom('testlibs'), nom('libs'),
				function(cb, res) {
					runTests(res[nom('testbin')], _.union(res[nom('testbin')], res[nom('bin')]),_.union(res[nom('testlibs')], res[nom('libs')]),cb);
				}];
	
		console.log("---- Returning standard project object for " + dir);
		console.log(p);
		return p;
	}
}());