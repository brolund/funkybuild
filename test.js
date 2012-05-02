var _ = require('underscore');

	var replaceProperties = function(text, properties) {
	    console.log(properties);
            _.templateSettings.interpolate = /\$\{(.+?)\}/g;
	    var t = _.template(text);
	    return t(properties);
	}

console.log(replaceProperties("${a}", {a: 'b'}));
