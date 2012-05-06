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
    'stores plain ol function and creates promise': function () {     
        var calls2 = 0;
        service.registerFunction('some name', function(){calls2++;return 'some result';});
        var ctx = service.createNewContext();
        var res;
        ctx['some name']().then(function(result) {
                                    res = result;
                                }, unexpectedErrback);
        expect(res).toEqual('some result'); 
    },
    
    'stores promise': function (done) {     
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
                                    expect(result).toEqual('deferred result'); 
                                    done();
                                }, unexpectedErrback);
    }
    
});
