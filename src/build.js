var fb  = require('./funkybuild');
var mvn  = require('./maven');

fb.downloadWith(mvn.downloader);

/////////////////////////////////
var junit = 'junit:junit:4.8.2';

fb.std({root:'javaroot', project:'mainproj', projectdeps:['subproj'], testlibs:[junit]});
fb.std({root:'javaroot', project:'subproj', testlibs:[junit]});

fb.run('mainproj', 'mainprojpackage.Hello');

console.log(fb.graph);

fb.build();
