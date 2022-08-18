/* // Schema of Guest
"use strict";
// packages
import mongoose, { Schema, model } from "mongoose";
import { promisifyAll } from "bluebird";

promisifyAll(mongoose);

var guestSchema = new Schema(
    {
        partyId: {
            type: Schema.Types.ObjectId,
            ref: "Party",
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isCoHost: {
            type: Boolean,
        },
    },
    { versionKey: false }
);

var Guest = model("Guest", guestSchema);
 */
const Guest = {};
export default Guest;
