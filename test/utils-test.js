// Node tests
var buster = require("buster");

buster.testCase("A module", {
    "states the obvious": function () {
        assert(true);
    },
    "states the obvious again": function () {
        assert(true);
    }
});