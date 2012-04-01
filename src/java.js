(function(){
	var j = {};
	module.exports = j;

	var path = require('path');
	var util = require('util');
	var _ = require('underscore');
	var funkyutils = require('./utils');
	var replaceAll = funkyutils.replaceAll;
	var endsWith = funkyutils.endsWith;
	var Cmd = funkyutils.Cmd;
	var runCmd = funkyutils.runCmd;
	
	var fileutils = require('./fileutils');
	var mkdir = fileutils.mkdir;
	var walk = fileutils.walk;
	

	var builddir = 'build/';

	j.toClassName = function(classFile) {
		return replaceAll(classFile, '\/', '.').replace('\.class', '');
	}

	j.isJavaClass = function(fileName) {
		return endsWith(fileName, '.class');
	}


	j.mergeClasspaths = function(classes, libs) {
		var cp = classes.length > 0 ? classes.join(':') : '';
		cp += cp.length>0 && libs.length>0? ':':'';
		cp += libs.length>0 ? libs.join(':'):'';
		return cp;
	}

	j.javac = function(src, classpath, callback) {
		var bin = path.join(builddir, replaceAll(src, '\/', '_'));
		mkdir(bin);
		var args = ['-d', bin];

		var cp = _.flatten(classpath).join(':');
		if(cp!='') {
			args.push('-cp');
			args.push(cp);
		}

		var files = walk(src);
		for (var i = 0; i < files.length; i++) {
			args.push(src + files[i]);
		}
		var compilation = Cmd('javac', '.', args);
		runCmd(compilation, function(exitcode) {
			if(exitcode!=0) {
				callback('Couldnt compile ' + util.inspect(compilation), null);
			} else {
				callback(null, bin);
			}
			
		});
	}
}());