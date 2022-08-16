// Schema of user feedback

"use strict";
var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var mongoose = require('mongoose');

var userFeedbackSchema = new mongoose.Schema({
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    feedback: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FeedbackQuestion'
            },
            response: {
                type: String
            }
        }
    ],
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });



var UserFeedback = mongoose.model('UserFeedback', userFeedbackSchema);
module.exports = UserFeedback;