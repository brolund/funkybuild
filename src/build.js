var util  = require('util');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');

var j  = require('java');

var ser = async.series;
var par = async.parallel;
var auto = async.auto;

var builddir = 'build/';
var mavenrepo = '/Users/danielbrolund/.m2/repository/'


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
