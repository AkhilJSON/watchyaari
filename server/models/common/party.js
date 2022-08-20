"use strict";

// packages
import { Entity, Schema } from "redis-om";

// redis-om client
import client from "../../config/redisOm.js";

class Party extends Entity {}

const partySchema = new Schema(Party, {
    title: {
        type: "string",
    },
    videoId: {
        type: "string",
    },
    videoSource: {
        type: "string", //YOUTUBE
    },
    description: {
        type: "string",
    },
    guests: {
        type: "string[]",
    },
    guestUserIds: {
        type: "string[]",
    },
    removedUsers: {
        type: "string[]",
    },
    startedOn: {
        type: "date",
    },
    endedOn: {
        type: "date",
    },
    isStarted: {
        type: "boolean",
    },
    isEnded: {
        type: "boolean", // default: false,
    },
    endedBy: {
        type: "string", // ref: "User",
    },
    hostedBy: {
        type: "string", // ref: "User",
    },
    isDeleted: {
        type: "boolean",
    },
    modifiedOn: { type: "date" },
    modifiedBy: {
        type: "string", // ref: "User",
    },
    status: {
        type: "string", // enum: ["CREATED", "ACTIVE", "IN-ACTIVE", "ENDED", "DELETED"], default: "CREATED",
    },
    scheduledDate: {
        type: "date",
    },
    cAt: {
        type: "date",
    },
    partyDuration: {
        //In seconds
        type: "number",
    },
    lastActiveTime: {
        type: "number",
    },
    lastSeek: {
        type: "number",
    },
    initialisedAt: {
        type: "date", // default: "date".now,
    },
    maxGuestsAllowed: {
        type: "number", // default: DEFAULT_MAX_GUESTS_ALLOWED,
    },
    isPrivate: {
        type: "boolean", // default: false,
    },
    mode: {
        type: "string", //enum: ["URL", "SEARCH"],
    },
});

const PartyRepository = client.fetchRepository(partySchema);
export default PartyRepository;

await PartyRepository.createIndex();
