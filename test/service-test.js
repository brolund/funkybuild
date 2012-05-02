var buster = require("buster");
var service = require("./../src/service");
var v = require("buster-assertions");
var assert = v.assert,
	refute = v.refute,
	expect = v.expect;

buster.testCase("Service provider", {
    'stores callable service': function (done) {
    	var service = service.create();
    	var calls = 0;
    	ctx.register('some name', function(){calls++;});
    },

    "states the obvious again": function () {
        assert(true);
    }
});