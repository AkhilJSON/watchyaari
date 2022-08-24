// models
import ChatRepository from "../models/common/chat.js";

export default async function partyChatSocketHandling(socket, io) {
    try {
        let partyId = socket.handshake.query && socket.handshake.query.partyId;

        socket.on("CREATE_OR_JOIN_PARTY_CHAT_ROOM", () => {
            // console.log("CREATE_OR_JOIN_PARTY_CHAT_ROOM");
            socket.join(partyId);
        });

        socket.on("SEND_MESSAGE", (messageData) => {
            // console.log("SEND_MESSAGE");
            socket.to(partyId).emit("COPY_MESSAGE", messageData);
            let chat = JSON.parse(messageData);

            ChatRepository.createAndSave(chat);
        });

        socket.on("disconnect", () => {
            // console.log("\n disconnect", "\n");
            // socket.to(partyId).emit("disconnectPeer", socket.id);
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
