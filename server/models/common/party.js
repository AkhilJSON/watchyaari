// Schema of party
"use strict";
// packages
var mongoose = require("mongoose");
var Promise = require("bluebird");
Promise.promisifyAll(mongoose);

// constants
let GLOBAL_CONSTANTS = require("../../config/constants");

var partySchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        videoId: {
            type: String,
        },
        videoSource: {
            type: String, //YOUTUBE
        },
        description: {
            type: String,
        },
        guests: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Guest",
            },
        ],
        guestUserIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        removedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        startedOn: {
            type: Date,
        },
        endedOn: {
            type: Date,
        },
        isStarted: {
            type: Boolean,
        },
        isEnded: {
            type: Boolean,
            default: false,
        },
        endedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        hostedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isDeleted: {
            type: Boolean,
        },
        modifiedOn: { type: Date },
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["CREATED", "ACTIVE", "IN-ACTIVE", "ENDED", "DELETED"],
            default: "CREATED",
        },
        scheduledDate: {
            type: Date,
        },
        cAt: {
            type: Date,
        },
        partyDuration: {
            //In seconds
            type: Number,
            default: 0,
        },
        lastActiveTime: {
            type: Number,
            default: 0,
        },
        lastSeek: {
            type: Number,
            default: 0,
        },
        initialisedAt: {
            type: Date,
            default: Date.now,
        },
        videoListHistory: [
            {
                videoId: {
                    type: String,
                },
                videoSource: {
                    type: String, //YOUTUBE
                },
                mAt: {
                    type: Date,
                },
                mBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        maxGuestsAllowed: {
            type: Number,
            default: GLOBAL_CONSTANTS.DEFAULT_MAX_GUESTS_ALLOWED,
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        mode: {
            type: String,
            enum: ["URL", "SEARCH"],
        },
    },
    { versionKey: false }
);

var Party = mongoose.model("Party", partySchema);
module.exports = Party;
