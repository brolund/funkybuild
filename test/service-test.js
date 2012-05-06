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
    'stores plain ol function and creates promise': function (done) {     
        var calls2 = 0;
        service.registerFunction('some name', function(){calls2++;return 'some result';});
        var ctx = service.createNewContext();
        var res;
        ctx['some name']().then(
            function(result) {
                res = result;
            },
            unexpectedErrback
            );
        expect(res).toEqual('some result'); 
        done();
    }
});
