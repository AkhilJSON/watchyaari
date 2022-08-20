"use strict";

// packages
import { Entity, Schema } from "redis-om";

// redis-om client
import client from "../../config/redisOm.js";

class Chat extends Entity {}

const chatSchema = new Schema(Chat, {
    partyId: { type: "string" },
    userId: { type: "string" },
    message: { type: "string" },
    userName: { type: "string" },
    cAt: { type: "date" },
});

const ChatRepository = client.fetchRepository(chatSchema);
export default ChatRepository;

await ChatRepository.createIndex();
