var funky  = require('./funkybuild');
var notmvn  = require('./notmaven');

funky.downloadWith(notmvn.downloader);

/////////////////////////////////

var junit = {org:'junit', item:'junit', ver:'4.8.2', type:'jar'};
var asm = {org:'asm', item:'asm', ver:'3.1', type:'jar'};
var batik = {org:'batik', item:'batik-awt-util', ver:'1.6', type:'jar'};

funky.std({root:'javaroot', project:'mainproj', projectdeps:['subproj'], testlibs:[junit, asm, batik]});
funky.std({root:'javaroot', project:'subproj', testlibs:[batik, junit, asm]});
funky.run('mainproj', 'mainprojpackage.Hello');

console.log(funky.graph);

funky.build();
