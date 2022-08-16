// Schema of Guest

"use strict";
var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var mongoose = require('mongoose');
var guestSchema = new mongoose.Schema({
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isCoHost: {
        type: Boolean
    }
}, { versionKey: false });



var Guest = mongoose.model('Guest', guestSchema);
module.exports = Guest;