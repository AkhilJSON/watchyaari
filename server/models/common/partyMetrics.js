// Schema of party

"use strict";
var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var mongoose = require('mongoose');
let GLOBAL_CONSTANTS = require('../../config/constants');

var partyMetricSchema = new mongoose.Schema({
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party'
    },
    connectionDetails: {
        type: String
    }
}, { versionKey: false });



var Partymetric = mongoose.model('Partymetric', partyMetricSchema);
module.exports = Partymetric;