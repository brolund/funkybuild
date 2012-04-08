var buster = require('buster');
var assert = buster.assertions.assert;
var refute = buster.assertions.refute;
var expect = buster.assertions.expect;

var fs = require('fs');
var path = require('path');

var fu = require('../src/fileutils');

buster.testCase("File utilities can", {
    "wipe a directory tree with files": function () {
		var root = './build';
		var dir = root + '/somethingfortesting';
		var subdir1 = dir + '/subdir1';
		var subdir2 = dir + '/subdir2';
		var file1 = dir + '/file.txt';
		var file2 = subdir2 + '/file.txt';
		
		if(path.existsSync(file1)) {fs.unlinkSync(file1);}
		if(path.existsSync(file2)) {fs.unlinkSync(file2);}
		if(path.existsSync(subdir1)) {fs.rmdirSync(subdir1);}
		if(path.existsSync(subdir2)) {fs.rmdirSync(subdir2);}
		if(path.existsSync(dir)) {fs.rmdirSync(dir);}

		if(!path.existsSync(root)) {fs.mkdirSync(root);}
		
		fs.mkdirSync(dir);
		fs.mkdirSync(subdir1);
		fs.mkdirSync(subdir2);
		fs.writeFileSync(file1, "Hello");
		fs.writeFileSync(file2, "Hello again");
		
		fu.wipeDirectory(dir);
		refute(path.existsSync(dir));
    }
});