var buster = require("buster");
var assert = buster.assertions.assert,
    refute = buster.assertions.refute,
    expect = buster.assertions.expect;
var registry = require("./../src/service");
var when = require('when');

var unexpectedErrback = function(error) {
    console.log("Error:", error);
    v.fail("Error shouldn't be called");
}


buster.testCase("Service provider", {
    'registers plain ol function and creates promise': function () {     
        registry.registerFunction('some name', function(){return 'some result';});
        var ctx = registry.createNewContext();
        var res;
        ctx['some name']().then(function(result) {
                                    res = result;
                                }, unexpectedErrback);
        expect(res).toEqual('some result'); 
    },
    
    'registers promise function': function (done) {     
        var promiseFn = function(){
            var deferred = when.defer();
            setTimeout(function() {
               deferred.resolve('deferred result');
            }, 1);
            return deferred.promise;
        };
        registry.registerPromiseFunction('promise name', promiseFn);
        var ctx = registry.createNewContext();
        ctx['promise name']().then(function(result) {
                                    expect(result).toEqual('deferred result'); 
                                    done();
                                }, unexpectedErrback);
    },
    
    'provides registered functions access to registry as this.context': function(done) {
        registry.registerFunction('called function', 
            function() {
                expect(this['called function']).toBeDefined(); 
                return 'the result';
            });

        var promiseFn = function() {
                console.log("This is:", this);
                expect(this['calling function']).toBeDefined(); 
                return this['called function']();
            }
        registry.registerPromiseFunction('calling function', promiseFn);
            
        ctx = registry.createNewContext();
        ctx['calling function']().then(function(result) {
                                    expect(result).toEqual('the result'); 
                                    done();
                                }, unexpectedErrback);        
    },     

/*    
    'caches service results': function(done) {
        var calls = 0;

        var promiseFn = function(){
            calls++;
            var deferred = when.defer();
            setTimeout(function() {
               deferred.resolve('deferred result');
            }, 1);
            return deferred.promise;
        };

        registry.registerPromiseFunction('promise name', promiseFn);

        var ctx = registry.createNewContext();

        ctx['promise name']().then(function(result) {
                                    expect(calls).toEqual(1); 
                                }, unexpectedErrback);
        
        ctx['promise name']().then(function(result) {
                                    expect(calls).toEqual(1); 
                                    done();
                                }, unexpectedErrback);
        
    },
    
    'caches service results based on arguments': function(done) {
        var calls = 0;
        var arg1 = 'arg1';
        var arg2 = 'arg2';

        var promiseFn = function(a1, a2){
            calls++;
            expect(a1).toEqual(arg1); 
            expect(a2).toEqual(arg2);
             
            var deferred = when.defer();
            setTimeout(function() {
               deferred.resolve('deferred result');
            }, 1);
            return deferred.promise;
        };

        registry.registerPromiseFunction('promise name', promiseFn);

        var ctx = registry.createNewContext();

        ctx['promise name'](arg1, arg2).then(function(result) {
                                    expect(calls).toEqual(1); 
                                }, unexpectedErrback);
        
        ctx['promise name'](arg2, arg1).then(function(result) {
                                    expect(calls).toEqual(1); 
                                    done();
                                }, unexpectedErrback);
        
    }
*/
    
});



















