// Schema of user, USER is the collection of every single user

"use strict";

// packages
import { Entity, Schema } from "redis-om";

// redis-om client
import client from "../../config/redisOm.js";

class User extends Entity {}

const userSchema = new Schema(User, {
    fullName: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    passwordResetCode: { type: "string" },
    emailVerified: { type: "boolean" },
    emailVerifiedOn: { type: "date" },
    emailVerificationCode: { type: "string" },
    mobileVerified: { type: "boolean" },
    mobileVerifiedOn: { type: "boolean" },
    mobileVerificationCode: { type: "string" },
    status: { type: "string" }, //["ADDED", "ACTIVE", "INACTIVE"],
    createdOn: { type: "date" },
    createdBy: { type: "string" }, // reference to other schema
    isDeleted: { type: "boolean" },
    modifiedOn: { type: "date" },
    modifiedBy: { type: "string" }, // reference to other schema
    isAdmin: { type: "boolean" },
});

// TODO :: Generate password salt before saving user in the controllers itself
const UserRepository = client.fetchRepository(userSchema);
export default UserRepository;

await UserRepository.createIndex();
