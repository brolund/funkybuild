var funky  = require('./funkybuild');
var notmvn  = require('./notmaven');

//notmvn.mavenrepo = {host:'localhost', port:8000, path:'/'};

funky.downloadWith(notmvn.downloader);

/////////////////////////////////

var junit = {group:'junit', artifact:'junit', version:'4.8.2', type:'jar'};
var asm = {group:'asm', artifact:'asm', version:'3.1', type:'jar'};
var batik = {group:'batik', artifact:'batik-awt-util', version:'1.6', type:'jar'};

funky.std({root:'javaroot', project:'subproj', libs:[batik, asm], testlibs:[junit]});
funky.std({root:'javaroot', project:'mainproj', projectdeps:['subproj'], libs:[asm], testlibs:[junit]});
funky.run('mainproj', 'mainprojpackage.Hello');

console.log(funky.graph);

funky.build();
