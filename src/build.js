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
	console.log('---- Running cmd:');
	console.log(cmd);

	var spawnedCmd = spawn(cmd.cmd, cmd.argArray, {cwd: cmd.dir});
	
	spawnedCmd.stdout.on('data', function (data) {
	    console.log(data.toString('utf-8'));
	});

	spawnedCmd.stderr.on('data', function (data) {
		console.error(data.toString('utf-8'));
	});	
	
    spawnedCmd.on('exit', function (exitcode) {
	    console.log('---- Execution done: ' + exitcode);
		callback(exitcode);
	});
}

var mkdir = function(dir) {
	dir = path.normalize(dir);
	console.log("---- mkdir " + dir);
	var dirs = dir.split('/');
	var currDir = ".";
	for(var i=0;i<dirs.length;i++) {
		currDir = currDir + '/' + dirs[i];
		if(!path.existsSync(currDir) && dirs[i].length>0) {
			fs.mkdirSync(currDir);
		};
	}	
}

var fn = function(val) {
	return function(callback) {
		callback(null, val);
	};
}

var isDir = function(fsobj) {
	return fs.statSync(fsobj).isDirectory();
}

var walk = function(directory) {	
  	var innerWalk = function(root, dir, res) {
		var stuff = fs.readdirSync(path.join(root, dir));
		if(stuff) {
			for(o in stuff) {
				var localPath = path.join(dir, stuff[o]);
				var fullPath = path.join(root, localPath);
				if(isDir(fullPath)) {
					innerWalk(root, localPath, res);
				} else {
					res.push(localPath);
				}
			}			
		}
		return res;
	}	
	return innerWalk(directory,"", []);
};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var toClassName = function(classFile) {
	return replaceAll(classFile, '\/', '.').replace('\.class', '');
}

var isJavaClass = function(fileName) {
	return endsWith(fileName, '.class');
}


var mergeClasspaths = function(classes, libs) {
	var cp = classes.length > 0 ? classes.join(':') : '';
	cp += cp.length>0 && libs.length>0? ':':'';
	cp += libs.length>0 ? libs.join(':'):'';
	return cp;
}

var replaceAll = function(str, findRegexp, replacement) {
	return str.replace(new RegExp(findRegexp, 'g'),replacement);
}

var javac = function(src, classes, libs, callback) {
    console.log("---- Doing javac for " + src);
	var bin = path.join(builddir, replaceAll(src, '\/', '_'));
    mkdir(bin);
    var args = ['-d', bin];
	var cp = mergeClasspaths(classes, libs);
	
    if (cp.length > 0) {
	    args.push('-cp');
		args.push(cp);
    }
		
    var files = walk(src);
    for (var i = 0; i < files.length; i++) {
        args.push(src + files[i]);
    }
    runCmd(Cmd('javac', '.', args), function(exitcode) {
        console.log('---- Compilation done: ' + exitcode + " returning " + bin);
        callback(null, bin);
    });
}


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

var merge = function(o1, o2, o3, etc, aso) {
	var merged = {};
	for(o in arguments) {
		var arg = arguments[o];
		for(p in arg) {
			merged[p] = arg[p];
		}
	}
	console.log("---- Merged projects:");
	console.log(merged);
	return merged;
}

/////////////////////////////////

var project = std('javaroot', 'mainproj', ['subproj']);
var subproj = std('javaroot', 'subproj');

auto(merge(project, subproj),
	function(err, res) {
		if(err) {
			console.log("########## Error");
			console.trace("Here I am!")
			console.log(err);
			console.log(res);
		} else {
			console.log("---- Results");
			console.log(res);
			runCmd(Cmd('java', '.', ['-cp', _.union(res['mainproj.bin'], res['subproj.bin']).join(':'), 'mainprojpackage.Hello']),
				function(err, exitcode) {
					console.log(exitcode);
				});
			
		}
		process.chdir('./..');
	});
