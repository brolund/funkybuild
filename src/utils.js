var replaceAll = function(str, findRegexp, replacement) {
	return str.replace(new RegExp(findRegexp, 'g'),replacement);
}


function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
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

var fn = function(val) {
	return function(callback) {
		callback(null, val);
	};
}

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
