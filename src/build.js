var util  = require('util'),
    spawn = require('child_process').spawn;
var fs = require('fs');

var outErrProcess = function(proc, out, err) {
}

var javac = function(src, bin, callback) {
	console.log("Doing javac");
	fs.mkdirSync(bin);
	var javac = spawn('javac', ['-d', bin, src]);
	console.log(javac);
	
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
			src: dir + "/src/main/java/Hello.java",
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
	res.val = solution.classes(res)
	console.log("Done executing.");
}

//////////////////////////////////

var config = {
	'classes': classes(std('javaroot'))
}

build(config)
