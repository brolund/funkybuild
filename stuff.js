var nmvn = require('./src/notmaven');

/*
nmvn.resolveTransitiveDependencies({group:'com.agical.rmock', artifact:'rmock', version:'2.0.2'}, function(err, res) {
	console.log("=========================");
	console.log(res);
	console.log("=========================");
});
nmvn.resolveTransitiveDependencies({group:'org.jboss', artifact:'jboss-common-core', version:'2.2.19.GA'}, function(err, res) {
	console.log("=========================");
	console.log(res);
	console.log("=========================");
});
*/
nmvn.resolveTransitiveDependencies({group:'org.apache.james', artifact:'apache-james', version:'3.0-beta4'}, function(err, res) {
	console.log("=========================");
	console.log(err);
	console.log("=========================");
	console.log("=========================");
	console.log(res);
	console.log("=========================");
});



