var util  = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');

var ser = async.series;
var par = async.parallel;
var auto = async.auto;

var builddir = 'javaroot/bin/';

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
    console.log("Doing javac");
	var bin = builddir + src.replace(new RegExp('\/', 'g'),'_');
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

var std = function(dir) {
	console.log("Creating function for standard project");
	return function(callback) {
		var p = {
			src: dir + "/src/main/java/",
			test: dir + "/src/test/java/",
			testbin: dir + "/bin/test-classes/",
			bin: dir + "/bin/classes/",
			testlib: ['/Users/danielbrolund/.m2/repository/junit/junit/4.8.2/junit-4.8.2.jar']
		}
		console.log("Returning standard project object for " + dir);
		console.log(p);
		callback(null, p);
	};
}


var runTests = function(classdirs, libs, test, cb) {				
	var cp = [];
	cp.push(classdirs);
	cp.push(libs);
	runCmd(Cmd('java', '.', ['-cp', mergeClasspaths(classdirs, libs),'org.junit.runner.JUnitCore',test]),
		function(exitcode) {
				console.log('========Testing done exitcode: " + exitcode + "======== ');
				cb(null, exitcode);
			});
}


/////////////////////////////////
var src = ['_proj', function(cb, res) {
		console.log(res._proj.src);
		cb(null, res._proj.src);
	}];
var testsrc = ['_proj', function(cb, res) {
		console.log(res._proj.test);
		cb(null, res._proj.test)
	}];
var testlib = ['_proj', function(cb, res) {
		console.log(res._proj.testlib);
		cb(null, res._proj.testlib)
	}];

var tutti = auto({
	_proj: std('javaroot'),
	_src: src,
	_testsrc: testsrc,
	_testlib: testlib,	
	_classes: ['_src', function(cb, res) {javac(res._src,[],[],cb);}],
	_testclasses: ['_testsrc', '_classes', '_testlib', function(cb, res) {javac(res._testsrc,[res._classes],res._testlib,cb)}],
	_testresult: ['_classes', '_testclasses', '_testlib', function(cb, res) {runTests([res._classes,res._testclasses],res._testlib,'TestHello',cb);}]
},function(err, res) {
	console.log("Error");
	console.log(err);
	console.log("Results");
	console.log(res);
	runCmd(Cmd('java', '.', ['-cp', mergeClasspaths([res._classes], []), 'Hello']),
		function(err, exitcode) {
			console.log(exitcode);
		});
});
