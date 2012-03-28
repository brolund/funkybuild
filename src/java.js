
var toClassName = function(classFile) {
	return replaceAll(classFile, '\/', '.').replace('\.class', '');
}

var isJavaClass = function(fileName) {
	return endsWith(fileName, '.class');
}


var mergeClasspaths = function(classes, libs) {
	var cp = classes.length > 0 ? classes.join(':') : '';
	cp += cp.length>0 && libs.length>0? ':':'';
	cp += libs.length>0 ? libs.join(':'):'';
	return cp;
}

var javac = function(src, classes, libs, callback) {
    console.log("---- Doing javac for " + src);
	var bin = path.join(builddir, replaceAll(src, '\/', '_'));
    mkdir(bin);
    var args = ['-d', bin];
	var cp = mergeClasspaths(classes, libs);
	
    if (cp.length > 0) {
	    args.push('-cp');
		args.push(cp);
    }
		
    var files = walk(src);
    for (var i = 0; i < files.length; i++) {
        args.push(src + files[i]);
    }
    runCmd(Cmd('javac', '.', args), function(exitcode) {
        console.log('---- Compilation done: ' + exitcode + " returning " + bin);
        callback(null, bin);
    });
}