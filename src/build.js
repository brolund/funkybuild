var async = require('async');
var _ = require('underscore');

var j  = require('./java');
var fb  = require('./funkybuild');

var utils = require('./utils');
var Cmd = utils.Cmd;
var runCmd = utils.runCmd;

var merge = utils.merge;

/////////////////////////////////

var project = fb.std('javaroot', 'mainproj', ['subproj']);
var subproj = fb.std('javaroot', 'subproj');

async.auto(merge(project, subproj),
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
