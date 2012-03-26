var util  = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');

var ser = async.series;
var par = async.parallel;
var auto = async.auto;

var builddir = 'build/';
var mavenrepo = '/Users/danielbrolund/.m2/repository/'

var Cmd = function(cmd, dir, argArray) {
	var res = {};
	res.cmd = cmd;
	res.dir = dir;
	res.argArray = argArray;
	return res;
}

var runCmd = function(cmd, callback) {
	console.log('Running cmd:');
	console.log(cmd);

	var spawnedCmd = spawn(cmd.cmd, cmd.argArray, {cwd: cmd.dir});
	
	spawnedCmd.stdout.on('data', function (data) {
	    console.log(data.toString('utf-8'));
	});

	spawnedCmd.stderr.on('data', function (data) {
		console.error(data.toString('utf-8'));
	});	
	
    spawnedCmd.on('exit', function (exitcode) {
	    console.log('Execution done: ' + exitcode);
		callback(exitcode);
	});
}
var mkdir = function(dir) {
	dir = path.normalize(dir);
	console.log("mkdir " + dir);
	var dirs = dir.split('/');
	var currDir = ".";
	for(var i=0;i<dirs.length;i++) {
		currDir = currDir + '/' + dirs[i];
		if(!path.existsSync(currDir) && dirs[i].length>0) {
			fs.mkdirSync(currDir);
		};
	}	
}

var mergeClasspaths = function(classes, libs) {
	var cp = classes.length > 0 ? classes.join(':') : '';
	cp += cp.length>0 && libs.length>0? ':':'';
	cp += libs.length>0 ? libs.join(':'):'';
	console.log('cp:' + cp);
	return cp;
}

var javac = function(src, classes, libs, callback) {
    console.log("Doing javac for " + src);
	var bin = path.join(builddir, src.replace(new RegExp('\/', 'g'),'_'));
    mkdir(bin);
    var args = ['-d', bin];
	var cp = mergeClasspaths(classes, libs);
	
    if (cp.length > 0) {
	    args.push('-cp');
		args.push(cp);
    }
	
    var files = fs.readdirSync(src);
    for (var i = 0; i < files.length; i++) {
        args.push(src + files[i]);
    }
    console.log(args)
    runCmd(Cmd('javac', '.', args), function(exitcode) {
        console.log('Compilation done: ' + exitcode);
        callback(null, bin);
    });
}

var fn = function(val) {
	return function(callback) {
		callback(null, val);
	};
}

var runTests = function(classdirs, libs, test, cb) {				
	runCmd(Cmd('java', '.', ['-cp', mergeClasspaths(classdirs, libs),'org.junit.runner.JUnitCore',test]),
		function(exitcode) {
				console.log('======== Testing done. Exitcode: ' + exitcode + ' ======== ');
				cb(null, exitcode);
			});
}

var std = function(rootdir, dir, deps) {
	console.log("Creating function for standard project");
	
	var nom = function(localdir) {
		return dir + "." + localdir
	}
	var p = {};	
	p[nom('src')]=fn(path.join(rootdir, dir,"/src/main/java/"));
	p[nom('libs')]=fn([]);
	p[nom('bin')]=[nom('src'), function(cb, res) {javac(res[nom('src')],[],[],cb);}];
	p[nom('test')]=fn(path.join(rootdir, dir, "/src/test/java/"));
	p[nom('testlibs')]=fn([mavenrepo + 'junit/junit/4.8.2/junit-4.8.2.jar']);
	p[nom('testbin')]=[nom('test'), nom('bin'), nom('testlibs'), 
			function(cb, res) {
				javac(res[nom('test')],[res[nom('bin')]],[res[nom('testlibs')]],cb);
			}];
	p[nom('unittestresult')]=[nom('bin'), nom('testbin'), nom('testlibs'), 
			function(cb, res) {
				runTests([res[nom('bin')],res[nom('testbin')]],res[nom('testlibs')],'TestHello',cb);
			}];
	
	console.log("Returning standard project object for " + dir);
	console.log(p);
	return p;
}

/////////////////////////////////

var project = std('javaroot', 'mainproj');

auto(project,
	function(err, res) {
		if(err) {
			console.log("Error");
			console.log(err);
		} else {
			console.log("Results");
			console.log(res);
			runCmd(Cmd('java', '.', ['-cp', res['mainproj.bin'], 'Hello']),
				function(err, exitcode) {
					console.log(exitcode);
				});
			
		}
		process.chdir('./..');
	});

