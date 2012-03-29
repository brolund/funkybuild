(function(){
	var mvn = {};
	module.exports = mvn;
	
	var mavenrepo = '/Users/danielbrolund/.m2/repository/';
	
	mvn.downloader = function(str) {
		console.log('Downloading ' + str);
		var junit = mavenrepo + 'junit/junit/4.8.2/junit-4.8.2.jar';		
		return junit;
	};
}());