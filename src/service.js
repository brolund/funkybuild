(function(){
	var when = require('when');
	var _ = require('underscore');

	var service = {};
	
	module.exports = service;
	
	service.services = {};
	
	service.registerFunction = function(name, fn) {	    
	    service.registerPromiseFunction(name, function() {
    	    var deferred = when.defer();    	    
            deferred.resolve(fn(service.services));
            return deferred.promise;
	    });
	};
    
	service.registerPromiseFunction = function(name, fn) {	    
        service.services[name] = function() {return fn(service.services);};
	};
	
    service.createNewContext = function() {
        return service.services;
    }    
    	
})();

