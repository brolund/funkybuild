var http = require('http');
var url = require('url');
var _ = require('../lib/underscore.js');

var getQueryParameters = function(req) {
    return url.parse(req.url, true).query;
};

var util  = require('util'),
    spawn = require('child_process').spawn;


var outErrProcess = function(proc, out, err) {
	proc.stdout.on('data', function (data) {
	    out.write(data);
	});

	proc.stderr.on('data', function (data) {
		err.write(data);
	});	
}
 
var ls = function(response) {
	//var file = params.fileLocation;
	var ls    = spawn('ls', ['-lh', './']);

    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });

	outErrProcess(ls, response, response);

    ls.on('exit', function (code) {
	    response.end('Process finished with code: ' + code + '\n');
	});
	
	console.log('Done!');
};


http.createServer(function(request, response) {
    //var params = getQueryParameters(request);
	// ls(response);	
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
	var javac    = spawn('javac', ['-d', 'classes', 'src/Hello.java']);
	outErrProcess(javac, response, response);
    javac.on('exit', function (code) {
	    response.end('Compilation done: ' + code);
	});
	
}).listen(8124);

console.log('Server running at http://127.0.0.1:8124/');