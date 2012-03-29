var fb  = require('./funkybuild');

/////////////////////////////////

fb.std('javaroot', 'mainproj', ['subproj']);
fb.std('javaroot', 'subproj');

fb.build();
