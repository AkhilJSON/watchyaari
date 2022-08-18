// packages
const redis = require("./redis");
const socketAuth = require("socketio-auth");

// controllers
var userLoginAuth = require("../controllers/common/userLoginAuth");

exports.socketAauthentication = function (nameSpaceIo, usersKey = "users") {
    socketAuth(nameSpaceIo, {
        authenticate: async (socket, data, callback) => {
            const token = data.token;
            try {
                const user = await userLoginAuth.verifyUser(token);
                const canConnect = await redis.setAsync(`${usersKey}:${user._id}`, socket.id, "NX", "EX", 30);
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
                    await redis.setAsync(`${usersKey}:${socket.user._id}`, socket.id, "XX", "EX", 30);
                }
            });
        },
        disconnect: async (socket) => {
            if (socket.user) {
                await redis.delAsync(`${usersKey}:${socket.user._id}`);
            }
        },
        timeout: "none",
    });
};
