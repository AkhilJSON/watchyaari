// Schema of feedback question

"use strict";
var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var mongoose = require('mongoose');

var FeedbackQuestionSchema = new mongoose.Schema({
    title: {
        type: String
    },
    index: {
        type: Number
    },
    questionType: {
        type: String,
        enum: ['rating', 'description']
    },
    lowerLimitValue: {
        type: String
    },
    higherLimitValue: {
        type: String
    },
    feedbackType: {
        type: String,
        enum: ['party']
    },
    isActive: {
        type: Boolean,
        default: false
    },
    cAt: {
        type: Date,
        default: Date.now
    },
    cBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { versionKey: false });



var FeedbackQuestion = mongoose.model('FeedbackQuestion', FeedbackQuestionSchema);
module.exports = FeedbackQuestion;