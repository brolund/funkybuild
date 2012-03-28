(function(){
	var utils = {};
	module.exports = utils;

	var spawn = require('child_process').spawn;
	
	utils.replaceAll = function(str, findRegexp, replacement) {
		return str.replace(new RegExp(findRegexp, 'g'),replacement);
	}


	utils.endsWith = function(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}

	utils.merge = function(o1, o2, o3, etc, aso) {
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

	utils.fn = function(val) {
		return function(callback) {
			callback(null, val);
		};
	}

	utils.Cmd = function(cmd, dir, argArray) {
		var res = {};
		res.cmd = cmd;
		res.dir = dir;
		res.argArray = argArray;
		return res;
	}

	utils.runCmd = function(cmd, callback) {
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
}());
