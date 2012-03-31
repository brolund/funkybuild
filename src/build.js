var funky  = require('./funkybuild');
var notmvn  = require('./notmaven');

funky.downloadWith(notmvn.downloader);

/////////////////////////////////

var junit = {org:'junit', item:'junit', ver:'4.8.2', type:'jar'};

funky.std({root:'javaroot', project:'mainproj', projectdeps:['subproj'], testlibs:[junit]});
funky.std({root:'javaroot', project:'subproj', testlibs:[junit]});
funky.run('mainproj', 'mainprojpackage.Hello');

console.log(funky.graph);

funky.build();
