var util  = require('util'),
    spawn = require('child_process').spawn;
var fs = require('fs');
var _ = require('underscore');
var async = require('async');

var outErrProcess = function(proc, out, err) {
}

var javac = function(src, bin, callback) {
	console.log("Doing javac");
	fs.mkdirSync(bin);
	var args = ['-d', bin ];
	var files = fs.readdirSync(src);
	for(var i=0;i<files.length;i++) {args.push(src + files[i]);}
	var javac = spawn('javac', args);
	console.log(args);
	
	javac.stdout.on('data', function (data) {
	    console.log(data);
	});

	javac.stderr.on('data', function (data) {
		console.error(data);
	});	
	
    javac.on('exit', function (code) {
	    console.log('Compilation done: ' + code);
	});
	
	callback.res = bin;
}

var std = function(dir) {
	console.log("Creating std fn");
	return function(callback) {
		return {
			src: dir + "/src/main/java/",
			bin: dir + "/bin"
		}
	};
}

var classes = function(proj) {
	console.log("Creating classes");
	
	return function(callback) {
		var p = proj(callback);
		console.log(p);
		javac(p.src, p.bin, callback)
	};
}

var build = function(solution) {
	var res = {};
	console.log("Executing...");
	for(var key in solution) {
		res.val = solution[key](res);
	}
	console.log("Done executing.");
}

//////////////////////////////////
var config = {
	'classes': classes(std('javaroot')),
	'classes2': classes(std('javaroot'))
}

build(config)
