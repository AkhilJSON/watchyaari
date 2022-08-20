"use strict";

// packages
import { Entity, Schema } from "redis-om";

// redis-om client
import client from "../../config/redisOm.js";

class UserHomePageVideos extends Entity {}

const userHomePageVideosSchema = new Schema(UserHomePageVideos, {
    data: { type: "string" },
    isDeleted: { type: "boolean" },
});

const UserHomePageVideosRepository = client.fetchRepository(userHomePageVideosSchema);
export default UserHomePageVideosRepository;

await UserHomePageVideosRepository.createIndex();
