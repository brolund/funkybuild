// Node tests
var buster = require("buster");

buster.testCase("A module", {
    "states the obvious": function () {
        assert(true);
    }
});