(function(){
	var fu = {};
	module.exports = fu;

	var path = require('path');
	var fs = require('fs');
	var _ = require('underscore');
	var us = require('./utils');

	var isDir = function(fsobj) {
		return fs.statSync(fsobj).isDirectory();
	}

	fu.walk = function(directory) {	
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

	fu.walkAll = function(directory) {
		var innerWalk = function(root, dir, res) {
			var stuff = fs.readdirSync(path.join(root, dir));
			if(stuff) {
				for(o in stuff) {
					var localPath = path.join(dir, stuff[o]);
					var fullPath = path.join(root, localPath);
					if(isDir(fullPath)) {
						innerWalk(root, localPath, res);
						res.push(fullPath);
					} else {
						res.push(fullPath);
					}
				}			
			}
			return res;
		}	
		var result = innerWalk(directory,"", []);
		result.push(directory)
		return result;
	};
	
	fu.wipeDirectory = function(dir) {
		if(!path.existsSync(dir)) return;
		console.log("Wiping " + path.resolve(dir));
		var filesAndDirs = fu.walkAll(path.resolve(dir));
		console.log(filesAndDirs);
		_.each(filesAndDirs, function(part){
			if(path.existsSync(part)) {
				if(fs.statSync(part).isDirectory()) {
					fs.rmdirSync(part)
				} else if(fs.statSync(part).isFile()) {
					fs.unlinkSync(part)
				};
			};
			
		});
			
	}

	fu.mkdir = function(dire) {
		var dir = path.normalize(dire);
		console.log('making dir ' + dir);
		var dirs = dir.split('/');
		var currDir = us.startsWith(dire, '/')?'/':'./';
		
		for(var i=0;i<dirs.length;i++) {
			currDir = path.join(currDir, dirs[i]);
			if(!path.existsSync(currDir) && dirs[i].length>0) {
				console.log('Making ' + currDir);
				fs.mkdirSync(currDir);
			};
		}	
	}
}());