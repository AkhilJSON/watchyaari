/* // Schema of Chat
"use strict";
// packages
import mongoose, { Schema, model } from "mongoose";
import { promisifyAll } from "bluebird";

promisifyAll(mongoose);

var chatSchema = new Schema(
    {
        partyId: {
            type: Schema.Types.ObjectId,
            ref: "Party",
        },
        userId: {
            type: Schema.Types.ObjectId,
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

var Chat = model("Chat", chatSchema); */
const Chat = {};
export default Chat;
