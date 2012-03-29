var funky  = require('./funkybuild');
var mvn  = require('./maven');

fb.downloadWith(mvn.downloader);

/////////////////////////////////

var junit = 'junit:junit:4.8.2';

funky.std({root:'javaroot', project:'mainproj', projectdeps:['subproj'], testlibs:[junit]});
funky.std({root:'javaroot', project:'subproj', testlibs:[junit]});
funky.run('mainproj', 'mainprojpackage.Hello');

console.log(funky.graph);

funky.build();
