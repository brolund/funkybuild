var buster = require("buster");
var assert = buster.assertions.assert,
    refute = buster.assertions.refute,
    expect = buster.assertions.expect;
var service = require("./../src/service");
var when = require('when');

var unexpectedErrback = function(error) {
    console.log("Error:", error);
    v.fail("Error shouldn't be called");
}


buster.testCase("Service provider", {
    'registers plain ol function and creates promise': function () {     
        service.registerFunction('some name', function(){return 'some result';});
        var ctx = service.createNewContext();
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
        service.registerPromiseFunction('promise name', promiseFn);
        var ctx = service.createNewContext();
        ctx['promise name']().then(function(result) {
                                    expect(result).toEqual('deferred result'); 
                                    done();
                                }, unexpectedErrback);
    },
    
    'provides registered functions access to registry as first argument': function(done) {
        var ctx;
        service.registerFunction('called function', 
            function(localCtx) {
                expect(localCtx).toEqual(ctx); 
                return 'the result';
            });

        service.registerPromiseFunction('calling function', 
            function(localCtx) {
                expect(localCtx).toEqual(ctx); 
                return localCtx['called function']();
            });
            
        ctx = service.createNewContext();
        ctx['called function']().then(function(result) {
                                    expect(result).toEqual('the result'); 
                                    done();
                                }, unexpectedErrback);        
    },     
    
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

        service.registerPromiseFunction('promise name', promiseFn);

        var ctx = service.createNewContext();

        ctx['promise name']().then(function(result) {
                                    expect(calls).toEqual(1); 
                                }, unexpectedErrback);
        
        ctx['promise name']().then(function(result) {
                                    expect(calls).toEqual(1); 
                                    done();
                                }, unexpectedErrback);
        
    }
    
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

        service.registerPromiseFunction('promise name', promiseFn);

        var ctx = service.createNewContext();

        ctx['promise name'](arg1, arg2).then(function(result) {
                                    expect(calls).toEqual(1); 
                                }, unexpectedErrback);
        
        ctx['promise name'](arg2, arg1).then(function(result) {
                                    expect(calls).toEqual(1); 
                                    done();
                                }, unexpectedErrback);
        
    }

    
});



















