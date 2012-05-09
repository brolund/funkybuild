(function(){
	var when = require('when');
	var _ = require('underscore');

	var registry = {};
	
	module.exports = registry;
	
	registry.services = {};
	
	registry.registerFunction = function(name, fn) {	 
	    return registry.registerPromiseFunction(name,
	        function() {
                var deferred = when.defer(); 	  
    	        deferred.resolve(
    	            fn.apply(registry.services, arguments)); 
                return deferred.promise;
            });
	};
    
	registry.registerPromiseFunction = function(name, fn) {	    
        return registry.services[name] = 
            _.memoize(function() {
                return fn.apply(registry.services, arguments);
            });
	};
    	
})();

