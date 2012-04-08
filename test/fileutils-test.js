var buster = require('buster');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var expect = buster.assertions.expect;

var fs = require('fs');
var path = require('path');

var fu = require('../src/fileutils');

buster.testCase("File utilities can", {
    "wipe a directory": function () {
		var dir = './somethingfortesting';
		var subdir1 = dir + '/subdir1';
		var subdir2 = dir + '/subdir2';
		
		if(path.existsSync(subdir1)) {fs.rmdirSync(subdir1);}
		if(path.existsSync(subdir2)) {fs.rmdirSync(subdir2);}
		if(path.existsSync(dir)) {fs.rmdirSync(dir);}
		
		fs.mkdirSync(dir);
		fs.mkdirSync(subdir1);
		fs.mkdirSync(subdir2);
		
		fu.wipeDirectory(dir);
		refute(path.existsSync(dir));
    }
});