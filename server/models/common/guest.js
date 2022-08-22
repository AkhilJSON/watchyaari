"use strict";

// packages
import { Entity, Schema } from "redis-om";

// redis-om client
import client from "../../config/redisOm.js";

class Guest extends Entity {}

const guestSchema = new Schema(Guest, {
    partyId: { type: "string" },
    userId: { type: "string" },
    isCoHost: { type: "boolean" },
});

const GuestRepository = client.fetchRepository(guestSchema);
export default GuestRepository;

await GuestRepository.createIndex();
