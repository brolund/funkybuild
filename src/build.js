var fb  = require('./funkybuild');

/////////////////////////////////

fb.std('javaroot', 'mainproj', ['subproj']);
fb.std('javaroot', 'subproj');
fb.run('mainproj', 'mainprojpackage.Hello');

console.log(fb.graph);

fb.build();
