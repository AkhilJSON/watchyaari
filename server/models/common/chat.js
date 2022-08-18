// Schema of Chat

"use strict";
var mongoose = require("mongoose");
var Promise = require("bluebird");
Promise.promisifyAll(mongoose);
var mongoose = require("mongoose");
var chatSchema = new mongoose.Schema(
    {
        partyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Party",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        message: {
            type: String,
        },
        userName: {
            type: String,
        },
        cAt: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false }
);

var Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
