// packages
import socketAuth from "socketio-auth";

// config
import redis from "./redis.js";

// controllers
import * as userLoginAuth from "../controllers/common/userLoginAuth.js";

export function socketAauthentication(nameSpaceIo, usersKey = "users") {
    socketAuth(nameSpaceIo, {
        authenticate: async (socket, data, callback) => {
            const token = data.token;
            try {
                const user = await userLoginAuth.verifyUser(token);
                const canConnect = await redis.setAsync(`${usersKey}:${user.entityId}`, socket.id, "NX", "EX", 30);
                if (!canConnect) {
                    return callback({ message: "ALREADY_LOGGED_IN" });
                }

                socket.user = user;
                return callback(null, true);
            } catch (e) {
                return callback({ message: "UNAUTHORIZED" });
            }
        },
        postAuthenticate: async (socket) => {
            socket.conn.on("packet", async (packet) => {
                if (socket.auth && packet.type === "ping") {
                    await redis.setAsync(`${usersKey}:${socket.user.entityId}`, socket.id, "XX", "EX", 30);
                }
            });
        },
        disconnect: async (socket) => {
            if (socket.user) {
                await redis.delAsync(`${usersKey}:${socket.user.entityId}`);
            }
        },
        timeout: "none",
    });
}
