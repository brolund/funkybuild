var buster = require("buster");
var assert = buster.assertions.assert,
    refute = buster.assertions.refute,
    expect = buster.assertions.expect;
var registry = require("./../src/service");
var when = require('when');
var _ = require('underscore');

var unexpectedErrback = function(error) {
    console.log("Error:", error);
    v.fail("Error shouldn't be called");
}


buster.testCase("Service provider", {
    'registers plain ol function and creates promise': function () {     
        registry.registerFunction(
            'some name', 
            function(){return 'some result';});
        var res;
        registry.services['some name']().then(function(result) {
                                    res = result;
                                }, unexpectedErrback);
        expect(res).toEqual('some result'); 
    },
    
    'registers promise function': function (done) {     
        var promiseFn = function(){
            var deferred = when.defer();
            _.delay(function() {
               deferred.resolve('deferred result');
            }, 1);
            return deferred.promise;
        };
        registry.registerPromiseFunction('promise name', promiseFn);
        registry.services['promise name']().then(function(result) {
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
                expect(this['calling function']).toBeDefined(); 
                return this['called function']();
            }
        registry.registerPromiseFunction('calling function', promiseFn);
            
        registry.services['calling function']().then(function(result) {
                                    expect(result).toEqual('the result'); 
                                    done();
                                }, unexpectedErrback);        
    },     

    'caches service results': function(done) {
        var calls = [];

        var promiseFn = function(a, b){
            calls.push(a+b);
            var deferred = when.defer();
            _.delay(function() {
               deferred.resolve('deferred result');
            }, 1);
            return deferred.promise;
        };

        var regFn = registry.registerPromiseFunction('promise name', promiseFn);
        
        when.all(
            [regFn('a', 'b'),
             regFn('a', 'b'),
             regFn('b', 'a')])
        .then(function(results) {
                    expect(results[0].toString()).toEqual('deferred result'); 
                    expect(calls.length).toEqual(_.uniq(calls).length); 
                    expect(results.length).toEqual(3); 
                    done();
                }, unexpectedErrback);
        
    },

    
});



















