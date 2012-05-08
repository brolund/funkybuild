(function(){
	var when = require('when');
	var _ = require('underscore');

	var service = {};
	
	module.exports = service;
	
	service.services = {};
	
	service.registerFunction = function(name, fn) {	 
	    service.registerPromiseFunction(name,
	        function() {
    	        var deferred = when.defer(); 	  
    	        deferred.resolve(_.bind(fn, service.services, arguments)()); 
                return deferred.promise;
            });
	};
    
	service.registerPromiseFunction = function(name, fn) {	    
        service.services[name] = 
            function() {
                return _.bind(fn, service.services, arguments)();
            };
	};
	
    service.createNewContext = function() {
        return service.services;
    }    
    	
})();

