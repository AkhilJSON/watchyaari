// packages
const _ = require("lodash");
let nLog = require("noogger");

exports.catchException = function (exception, res) {
    console.log("e::", JSON.stringify(exception));
    nLog.error(JSON.stringify(exception));
    return res.json({
        Success: false,
        Message: "exception",
        Reason: exception,
    });
};

exports.checkIfExists = function (array, key, value) {
    if (_.isArray(array)) {
        let index = _.findIndex(array, function (o) {
            return o[key] == value;
        });
        return index >= 0 ? true : false;
    }
    return false;
};
