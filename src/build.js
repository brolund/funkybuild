var util  = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');

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

var javac = function(src, bin, lib, callback) {
    console.log("Doing javac");
    mkdir(bin);
    var args = ['-d', bin];
    if (lib.length > 0) {
        args.push('-cp');
        args.push(lib.join(':'));
    }
    var files = fs.readdirSync(src);
    for (var i = 0; i < files.length; i++) {
        args.push(src + files[i]);
    }
    console.log(args)
    runCmd(Cmd('javac', '.', args), function(exitcode) {
        console.log('Compilation done: ' + exitcode);
        callback(bin);
    });
}

var std = function(dir) {
	console.log("Creating std fn");
	return function(callback) {
		return {
			src: dir + "/src/main/java/",
			test: dir + "/src/test/java/",
			testbin: dir + "/bin/test-classes/",
			bin: dir + "/bin/classes/",
			testlib: ['/Users/danielbrolund/.m2/repository/junit/junit/4.8.2/junit-4.8.2.jar']
		}
	};
}

var classes = function(proj) {
	console.log("Creating classes");
	
	return function(callback) {
		var p = proj(callback);
		console.log(p);
		javac(p.src, p.bin, callback);
	};
}

var test = function(proj) {
	console.log("Testing");
	
	return function(callback) {
		var p = proj(callback);
		console.log(p);
		javac(p.src, p.bin, [], function(code) {
			var lib = p.testlib.slice();
			lib.push(code);
			javac(p.test, p.testbin, lib, function(bin) {				
				lib.push(p.testbin);
				runCmd(Cmd('java', '.', ['-cp', lib.join(':'),'org.junit.runner.JUnitCore','TestHello']),
					function(res) {console.log('========Testing done========');});
			});
			
		});
	};
}


var build = function(solution) {
	var res = {};
	for(var key in solution) {
		res.val = solution[key](res);
	}
}

/////////////////////////////////

var config = {
	'test': test(std('javaroot'))
}

build(config)

//runCmd(Cmd('ls', './javaroot', ['-R']), function(o) {console.log(o);});