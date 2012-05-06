(function(){
	var when = require('when');

	var service = {};
	
	module.exports = service;
	
	service.services = {};
	
	service.registerFunction = function(name, fn) {	    
	    service.services[name] = function() {
    	    var deferred = when.defer();    	    
            deferred.resolve(fn());
            return deferred.promise;
	    };
	};
    
    service.createNewContext = function() {
        return service.services;
    }    
    	
})();

