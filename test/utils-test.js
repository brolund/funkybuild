var buster = require("buster");
var v = require("buster-assertions");

buster.testCase("utils", {
    'fn callback returns same value': function (done) {
		var utils = require("../src/utils");
		utils.fn("value")(function(err,val){
	        v.assert.equals(val, "value");
			done();
		})
		assert(true);
    },

});
