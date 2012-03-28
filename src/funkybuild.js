
var runTests = function(testdir, classdirs, libs, cb) {					
	var tests = _.map(_.filter(walk(testdir), isJavaClass), toClassName).join(' ');
	runCmd(Cmd('java', '.', ['-cp', mergeClasspaths(classdirs, libs),'org.junit.runner.JUnitCore',tests]),
		function(exitcode) {
				console.log('======== Tested done ' + testdir + '  Exitcode: ' + exitcode + ' ======== ');
				cb(null, exitcode);
			});
}

var std = function(rootdir, dir, deps) {
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