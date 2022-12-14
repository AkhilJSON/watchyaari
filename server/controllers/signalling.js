// packages
import os from "os";
import moment from "moment";
import _ from "lodash";
import nLog from "noogger";

// helpers
import redis from "../config/redis.js";
import Helper from "./helper.js";
import * as Constants from "../config/constants.js";

// models
import PartyRepository from "../models/common/party.js";

// controllers
import * as commonController from "./common/userLoginAuth.js";

export default async function socketHandling(socket, io) {
    try {
        // convenience function to log server messages on the client
        let partyId = socket.handshake.query && socket.handshake.query.partyId;
        let partySyncKey = `PARTYSYNC:${partyId}`;
        let videoChatConnectionKey = `VIDEOCHATCONNECTION:${partyId}`;

        function log() {
            var array = ["Message from server:"];
            array.push.apply(array, arguments);
            socket.emit("log", array);
        }

        socket.on("disconnect", async function (reason) {
            nLog.info(`${socket.id} Peer or server disconnected. Reason: ${reason}.`);

            //delete disconnected user from partsync redis.
            if (socket.user) {
                redis.get(partySyncKey, async (err, value) => {
                    let partySync = (value && JSON.parse(value)) || {};
                    // console.log(partySyncKey, " 3 value::", value, socket.user)

                    partySync.users = partySync.users || [];

                    if (partySync.users && partySync.users.length == 1) {
                        console.log("party exited for all currentTimer", new Date());

                        // update Database with
                        // partyDuration + = lastStartTime - currentTime
                        let partData = await PartyRepository.fetch(partyId),
                            lastActiveTime = partData.lastActiveTime,
                            partyDurationTillNow = partData.partyDuration || 0;

                        if (partData?.entityId) {
                            partData.partyDuration =
                                partyDurationTillNow + moment().diff(moment(lastActiveTime), "seconds");
                            partData.status = "IN-ACTIVE";
                        }

                        // Save party data
                        await PartyRepository.save(partData);

                        redis.delAsync(videoChatConnectionKey);
                    }

                    if (Helper.checkIfExists(partySync.users, "userId", socket.user.entityId)) {
                        partySync.users = _.filter(partySync.users, function (o) {
                            return o.userId != socket.user.entityId;
                        });
                        partySync = JSON.stringify(partySync);
                        redis.set(partySyncKey, partySync);
                    }
                });

                socket.to(partyId).emit("USER_DISCONNECTED", socket.user.entityId);
            }
        });

        socket.on("message", function (message) {
            log("Client said: ", message);
            // for a real app, would be room-only (not broadcast)
            socket.to(partyId).emit("message", message);
        });

        socket.on("ipaddr", function () {
            addIp(socket);
        });

        socket.on("bye", function (room) {
            // console.log(`Peer said bye on room ${room}.`);
        });

        socket.on("CREATE_OR_JOIN_PARTY_ROOM", async function (clientData) {
            createOrJoinPartyRoom(socket, clientData, io, partyId, partySyncKey);
        });

        socket.on("SYNC_SEEK_VALUE", function (syncData) {
            // socket.emit.to
        });

        socket.on("SAY_HELLO_TO_EVERYONE", async (guestData) => {
            // console.log("SAY_HELLO_TO_EVERYONE", isHost)

            socket.to(partyId).emit("HELLO_TO_EVERYONE", guestData, socket.id);

            redis.get(partySyncKey, (err, value) => {
                let partySync = (value && JSON.parse(value)) || {};

                socket.emit("CURRENT_PLAYER_STATUS", partySync.currentSeek || 0, partySync.status);
            });

            return;
        });

        socket.on("HOST_GIVE_ACCESS_TO_PLAY_VIDEO", (requestedBySocketId) => {
            // console.log("requestedBySocketId::", requestedBySocketId)
            socket.emit("RESUME_THE_PARTY", socket.id);
        });

        socket.on("SEEK_TO", (seekTo) => {
            // console.log("SEEK_TO", seekTo)

            socket.to(partyId).emit("SEEK_TO", seekTo);
        });

        socket.on("PAUSE_PARTY", (data) => {
            // console.log("PAUSE_PARTY", data)

            data = JSON.parse(data);
            socket.to(partyId).emit("PAUSE_THE_PARTY", socket.id);
        });

        socket.on("RESUME_PARTY", (data) => {
            // console.log("RESUME_PARTY", data)

            data = JSON.parse(data);
            socket.to(partyId).emit("RESUME_THE_PARTY", socket.id);
        });

        socket.on("END_PARTY", async (data) => {
            data = JSON.parse(data);
            let partyId = data.entityId;
            delete data.entityId;
            let partyData = await PartyRepository.fetch(partyId);
            partyData = _.extend(partyData, data);

            // Save Party data
            await PartyRepository.save(partyData);

            socket.to(partyId).emit("END_THE_PARTY", JSON.stringify(data));

            //Remove party sync from redis
            redis.del(partySyncKey);
        });

        socket.on("UPDATE_PARTY_PLAYER_STATUS", async (status) => {
            redis.get(partySyncKey, (err, value) => {
                let partySync = (value && JSON.parse(value)) || {};
                // console.log("\nUPDATE_PARTY_PLAYER_STATUS::", status, " partySync.status::", partySync.status)
                partySync.status = status;
                partySync = JSON.stringify(partySync);
                redis.set(partySyncKey, partySync);
            });
        });

        //Signal from individual clients
        socket.on("MY_CURRENT_SEEK", async (seek) => {
            if (socket.user) {
                //broadcast data to the room so that other users calculate the latest seek & keep synced
                socket.to(partyId).emit("MY_CURRENT_SEEK", seek, socket.user.entityId);
            }
        });

        socket.on("UPDATE_PARTY_DATA", (partyData) => {
            socket.to(partyId).emit("UPDATE_PARTY_DATA", JSON.stringify(partyData));
        });

        socket.on("ADD_REMOVE_GUESTS", (partyData) => {
            socket.to(partyId).emit("ADD_REMOVE_GUESTS", JSON.stringify(partyData));
        });

        socket.on("PUSH_NOTIFICATION", (message, specialMessageData) => {
            socket.to(partyId).emit("PUSH_NOTIFICATION", message, specialMessageData);
        });

        socket.on("UNBLOCK_USER", (userId) => {
            socket.to(partyId).emit("UNBLOCK_USER", userId);
        });

        socket.on("BLOCK_USER", (userData) => {
            socket.to(partyId).emit("BLOCK_USER", userData);
        });

        socket.on("UPDATE_VIDEO_CHAT_LIST", () => {
            socket.emit("UPDATE_VIDEO_CHAT_LIST");
        });

        //Reset seek value
        socket.on("RESET_SEEK", () => {
            socket.to(partyId).emit("RESET_SEEK");
        });

        //Release lock on user session
        socket.on("RELEASE_ACTIVE_PARTY_SESSION_LOCK", async (loggedInUserId) => {
            nLog.info("RELEASE_ACTIVE_PARTY_SESSION_LOCK", loggedInUserId);
            if (loggedInUserId) {
                redis.get(`users:${loggedInUserId}`, async (err, userSocketId) => {
                    userSocketId && io?.of?.("partySync")?.to?.(userSocketId)?.emit("REDIRECT_TO_HOMEPAGE");

                    await redis.delAsync(`users:${loggedInUserId}`);
                    await redis.delAsync(`videostreamusers:${loggedInUserId}`);

                    socket.emit("CONTINUE_WITH_CURRENT_SESSION");
                });
            }
        });

        //USER CONNCTED SIGNAL
        socket.on("USER_CONNECTED", (userId, socketId) => {
            io.of("partySync").to(socketId).emit("USER_CONNECTED", userId);
        });

        //Connection details TODO:: can be optimised
        socket.on("UPDATE_CONNECTION_DETAILS", (connection) => {
            if (socket.user) {
                let userId = socket.user.entityId;
                redis.get(videoChatConnectionKey, async (err, connectionMap) => {
                    connectionMap = (connectionMap && JSON.parse(connectionMap)) || {};

                    connectionMap[userId] = connectionMap[userId] || {};
                    connectionMap[userId][connection.id] = connection.details;

                    connectionMap = JSON.stringify(connectionMap);
                    redis.set(videoChatConnectionKey, connectionMap);

                    //Send updated connection details to client
                    io.of("partySync").to(partyId).emit("UPDATE_CONNECTION_DETAILS", connectionMap);
                });
            }
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

var createOrJoinPartyRoom = async function (socket, clientData, io, partyId, partySyncKey) {
    function log() {
        var array = ["Message from server:"];
        array.push.apply(array, arguments);
        socket.emit("log", array);
    }

    let { loggedInUser, isHost } = JSON.parse(clientData);

    if (!partyId) {
        socket.emit("invalidPartyId");
    }

    nLog.info("Received request to create or join room " + partyId);

    // console.log('Received request to create or join room ' + partyId);

    // var clientsInRoom = io.sockets.adapter.rooms[partyId];
    var clientsInRoom = io?.nsps?.["/partySync"]?.adapter?.rooms?.[partyId];
    // console.log('clientsInRoom::', clientsInRoom)

    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    // console.log('Room ' + partyId + ' now has ' + numClients + ' client(s)');

    let partyData = await PartyRepository.fetch(partyId);
    partyData = await Helper.populateGuestDataOfParty(partyData);

    if (!partyData) {
        socket.emit("invalidPartyId");
        return;
    }

    if (partyData.isEnded) {
        //Implement Ended functionality
    }

    if (partyData?.guests?.length == (partyData?.maxGuestsAllowed || Constants.DEFAULT_MAX_GUESTS_ALLOWED)) {
        let alreadyJoinedUsers = [partyData.hostedBy.toString()];
        alreadyJoinedUsers = alreadyJoinedUsers.concat(partyData.guestUserIds || []);
        alreadyJoinedUsers = _.map(alreadyJoinedUsers, (userId) => userId.toString());
        if (!alreadyJoinedUsers.includes(loggedInUser)) {
            socket.emit("PARTY_IS_FULL");
            return;
        }
    }

    if (partyData && partyData.removedUsers && partyData.removedUsers.length) {
        if (partyData.removedUsers.includes(loggedInUser)) {
            socket.emit("NO_LONGER_ACCESS_TO_PARTY");
            return;
        }
    }

    let guestAlreadyExists = _.findIndex(partyData.guests, (guest) => {
        return guest.userId.entityId.toString() == loggedInUser;
    });
    guestAlreadyExists = guestAlreadyExists >= 0 ? true : false;

    // console.log(guestAlreadyExists, 'partyData.guests::', partyData.guests, loggedInUser)
    if (partyData && partyData.isPrivate && !guestAlreadyExists) {
        socket.emit("NO_ACCESS_PRIVATE_PARTY");
        return;
    }

    let guestData = await commonController.createGuestWithPartyId({ entityId: loggedInUser, partyId });

    if (!guestAlreadyExists) {
        let partyDetails = await PartyRepository.fetch(partyData.entityId);
        partyDetails?.guests?.push(guestData.entityId);
        !partyDetails?.guestUserIds?.length && (partyDetails.guestUserIds = []);
        partyDetails?.guestUserIds?.push(loggedInUser);

        await PartyRepository.save(partyDetails);

        // Populate latest party data
        partyData = await Helper.populateGuestDataOfParty(partyDetails);
    }

    let userId = socket?.user?.entityId;
    let fullName = socket?.user?.fullName;
    let isFirstToJoin = false;

    delete partyData.removedUsers;

    /**
     * duration will only calculated only when any guest is present.
     */
    if (numClients === 0) {
        socket.join(partyId);
        // console.log('Client ID ' + socket.id + ' created partyId ' + partyId);
        socket.emit(
            "USER_CREATED_OR_JOINED_PARTY",
            JSON.stringify({ partyId, socketId: socket.id, isFirstToJoin: true, userId, fullName, partyData })
        );
        isFirstToJoin = true;
    } else if (numClients >= 1) {
        // console.log('Client ID ' + socket.id + ' joined partyId ' + partyId);
        // io.sockets.in(partyId).emit('join', partyId);
        socket.join(partyId);

        /*
            1.>Send message to loggedInUser to update partyDetails.
        */
        //#1
        let allGuests = getPartyList(io, socket, partyId);

        socket.emit(
            "USER_CREATED_OR_JOINED_PARTY",
            JSON.stringify({
                partyId,
                socketId: socket.id,
                isFirstToJoin: false,
                activeGuests: allGuests,
                userId,
                fullName,
                partyData,
            })
        );
    }

    //update connectedUsers in redis.
    if (socket.user) {
        redis.get(partySyncKey, async (err, value) => {
            let partySync = (value && JSON.parse(value)) || {};

            partySync.users = partySync.users || [];

            // console.log("\n isFirstToJoin::", isFirstToJoin, (partySync.currentSeek || 0), partySync.status)
            if (isFirstToJoin) {
                let defaultStatus = isHost ? Constants.PARTY_STATUS.RESUME : Constants.PARTY_STATUS.PAUSE;
                socket.emit("CURRENT_PLAYER_STATUS", partySync.currentSeek || 0, partySync.status || defaultStatus);
            }

            if (!Helper.checkIfExists(partySync.users, "userId", socket.user.entityId)) {
                partySync.users.push({
                    userId: socket.user.entityId,
                });
                partySync = JSON.stringify(partySync);
                redis.set(partySyncKey, partySync);

                // update lastActiveTime & status
                let partydetails = await PartyRepository.fetch(partyId);
                partydetails.lastActiveTime = Date.now();
                partydetails.status = "ACTIVE";
                partydetails.isStarted = true;
                await PartyRepository.save(partydetails);
            }
        });
    }
};

var addIp = function (socket) {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
        ifaces[dev].forEach(function (details) {
            if (details.family === "IPv4" && details.address !== "127.0.0.1") {
                socket.emit("ipaddr", details.address);
            }
        });
    }
};

function getPartyList(io, socket, partyId) {
    let clientsInRoom = io.nsps["/partySync"].adapter.rooms[partyId];

    let allSockets = clientsInRoom && clientsInRoom.sockets;
    // console.log(socket.id, "allClientsInRoom::", allSockets)

    let allGuests = _.without(_.keys(allSockets), socket.id);

    return allGuests || [];
}

function findMrX(users) {
    if (_.isArray(users)) {
        let mrX = _.max(users, function (user) {
            return parseFloat(user.seek);
        });
        return mrX;
    }
    return null;
}
// console.log =  () =>{return;}
