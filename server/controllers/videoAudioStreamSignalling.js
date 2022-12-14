// packages
import _ from "lodash";
import btoa from "btoa";

export default async function videoAudioSocketHandling(socket, io) {
    try {
        let partyId = socket.handshake.query && socket.handshake.query.partyId;

        // console.log("\n video party Room" , partyId, "\n");

        socket.on("JUST_TESTING", () => {
            // console.log("JUST TESTING AT TRIGGERING SIDE")
        });

        socket.on("joinVideoCall", () => {
            socket.join(partyId);

            let iceCredentials = process.env.IS_PROD ? process.env.ICE_SERVER_CONFIGURATION : null;

            if (iceCredentials) {
                try {
                    iceCredentials = btoa(iceCredentials);
                } catch (e) {
                    iceCredentials = null;
                }
            }

            socket.emit("joinedVideoCall", iceCredentials ? iceCredentials : "");
        });

        socket.on("broadcaster", () => {
            // console.log("\n broadcaster", "\n");
            socket.to(partyId).emit("broadcaster", socket.id);
        });

        socket.on("hi_some_one_there", () => {
            socket.user && socket.to(partyId).emit("watcher", socket.id, socket.user.entityId);
        });

        socket.on("watcher", (broadcaster) => {
            // console.log("\n watcher", "\n");
            socket.user && socket.to(broadcaster).emit("watcher", socket.id, socket.user.entityId);
        });

        socket.on("candidate", (id, message) => {
            // console.log("\n candidate", "\n");

            socket.user && socket.to(id).emit("candidate", socket.id, message, socket.user.entityId);
        });

        socket.on("offer", (id, message) => {
            // console.log("\n offer", "\n");
            socket.user && socket.to(id).emit("offer", socket.id, message, socket.user.entityId);
        });

        socket.on("answer", (id, message) => {
            // console.log("\n answer", "\n");
            socket.user && socket.to(id).emit("answer", socket.id, message, socket.user.entityId);
        });

        socket.on("broadcastData", (data) => {
            socket.user && socket.to(partyId).emit("broadcastData", socket.user.entityId, data);
        });

        socket.on("disconnect", () => {
            // console.log("\n disconnect", "\n");
            socket.user && socket.to(partyId).emit("disconnectPeer", socket.id, socket.user.entityId);
        });

        socket.on("disableVideo", () => {
            // console.log("\n disconnect", "\n");
            socket.user && socket.to(partyId).emit("disconnectPeer", socket.id, socket.user.entityId);
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

function log() {
    var array = ["Message from server:"];
    array.push.apply(array, arguments);
    socket.emit("log", array);
}
