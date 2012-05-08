(function(){
	var when = require('when');
	var _ = require('underscore');

	var registry = {};
	
	module.exports = registry;
	
	registry.services = {};
	
	registry.registerFunction = function(name, fn) {	 
	    registry.registerPromiseFunction(name,
	        function() {
    	        var deferred = when.defer(); 	  
    	        deferred.resolve(_.bind(fn, registry.services, arguments)()); 
                return deferred.promise;
            });
	};
    
	registry.registerPromiseFunction = function(name, fn) {	    
        registry.services[name] = 
            function() {
                return _.bind(fn, registry.services, arguments)();
            };
	};
    	
})();

