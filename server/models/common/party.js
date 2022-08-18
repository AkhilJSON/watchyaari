/* // Schema of party
"use strict";
// packages
import mongoose, { Schema, model } from "mongoose";
import { promisifyAll } from "bluebird";
promisifyAll(mongoose);

// constants
import { DEFAULT_MAX_GUESTS_ALLOWED } from "../../config/constants.js";

var partySchema = new Schema(
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
                type: Schema.Types.ObjectId,
                ref: "Guest",
            },
        ],
        guestUserIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        removedUsers: [
            {
                type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        hostedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isDeleted: {
            type: Boolean,
        },
        modifiedOn: { type: Date },
        modifiedBy: {
            type: Schema.Types.ObjectId,
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
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        maxGuestsAllowed: {
            type: Number,
            default: DEFAULT_MAX_GUESTS_ALLOWED,
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

var Party = model("Party", partySchema); */
const Party = {};
export default Party;
