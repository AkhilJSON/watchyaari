//packages
import mongoose from "mongoose";
import superagent from "superagent";
import _ from "lodash";
import nLog from "noogger";

// models
import PartyRepository from "../models/common/party.js";
import UserRepository from "../models/common/user.js";
import UserHomePageVideosRepository from "../models/data/homePageVideos.js";
import GuestRepository from "../models/common/guest.js";

// controllers
import * as UserLoginAuth from "./common/userLoginAuth.js";

// helpers
import Helper from "./helper.js";
import redis from "../config/redis.js";
import * as Constants from "../config/constants.js";

let mongoId = mongoose.Types.ObjectId;

export async function joinParty(req, res) {
    try {
        let body = req.body;

        if (!body.partyId) {
            return res.json({
                Success: false,
                Message: "party id is required",
            });
        }

        let partyData = await PartyRepository.fetch(body.partyId);
        partyData = await Helper.populateGuestDataOfParty(partyData);

        nLog.info(`${req.user.entityId} joined party ${partyData.entityId}`);
        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: partyData,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function getRecentPartyList(req, res) {
    try {
        let partyData = await Party.aggregate([
            {
                $match: {
                    status: { $in: ["CREATED", "ACTIVE", "IN-ACTIVE", "ENDED"] },
                    $or: [
                        { guestUserIds: { $in: [mongoose.Types.ObjectId(req.user.entityId)] } },
                        { hostedBy: mongoose.Types.ObjectId(req.user.entityId) },
                    ],
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { userIds: "$guestUserIds", createdBy: "$hostedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $or: [
                                                { $in: ["$entityId", "$$userIds"] },
                                                { $eq: ["$entityId", "$$createdBy"] },
                                            ],
                                        },
                                        { $ne: ["$entityId", req.user.entityId] },
                                    ],
                                },
                            },
                        },
                        { $project: { entityId: 0, fullName: 1 } },
                    ],
                    as: "guestData",
                },
            },
            {
                $project: {
                    cAt: 1,
                    guestData: 1,
                    videoSource: 1,
                    videoId: 1,
                    status: 1,
                    endedOn: 1,
                    title: 1,
                    isEnded: 1,
                    partyDuration: 1,
                },
            },
            {
                $sort: {
                    cAt: -1,
                },
            },
        ]);

        partyData = _.map(partyData, (party) => {
            party.guests = _.map(party.guestData || [], (party) => {
                return party.fullName;
            });
            party.guests = `${party.guests.length ? "You, " : "Only you"} ${party.guests.join(", ")}`.toUpperCase();
            delete party.guestData;
            return party;
        });
        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: partyData,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function getUpcomingPartyList(req, res) {
    try {
        let partyData = await Party.aggregate([
            {
                $match: {
                    status: { $in: ["SCHEDULED"] },
                    $or: [
                        { guestUserIds: { $in: [mongoose.Types.ObjectId(req.user.entityId)] } },
                        { hostedBy: mongoose.Types.ObjectId(req.user.entityId) },
                    ],
                },
            },
            {
                $sort: {
                    cAt: -1,
                },
            },
        ]);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: partyData,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function fetchUsers(req, res) {
    try {
        let { search, skip = 0, limit = 10 } = req.body || {},
            users = await UserRepository.search()
                .where("searchableEmail")
                .matches(`${search}*`)
                .or("searchableFullName")
                .matches(`${search}*`)
                .and("email")
                .is.not.equalTo(req.user.email) // should be entityId(due to limitation of non comparision with entityId, will be updated)
                .sortBy("fullName", "ASC")
                .sortBy("email", "ASC")
                .return.page(skip, limit);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: users,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function fetchBlockedUsers(req, res) {
    try {
        let { partyId } = req.body || {};
        let partyData = await PartyRepository.fetch(partyId);

        for (let i = 0; i < partyData?.removedUsers?.length; i++) {
            // populate Guest
            let user = partyData?.removedUsers?.[i],
                userDetails = await UserRepository.fetch(user);
            userDetails = userDetails.toJSON();
            userDetails = _.pick(userDetails, ["entityId", "fullName"]);

            partyData.guests[i] = userDetails;
        }

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: partyData.removedUsers || [],
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function unBlockUsers(req, res) {
    try {
        let { partyId, userId } = req.body || {};

        // Fetch party data
        let partyData = await PartyRepository.fetch(partyId);

        if (partyData?.removedUsers?.length) {
            partyData.removedUsers = _.filter(partyData?.removedUsers, (id) => {
                if (id != userId) {
                    return true;
                }
            });
        }

        // Save party data
        await PartyRepository.save(partyData);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function updateCoHosts(req, res) {
    try {
        let { guestId, add } = req.body || {};

        // Fetch guest data
        let guestData = await GuestRepository.fetch(guestId);
        guestData.isCoHost = add;

        // Save guest data
        await GuestRepository.save(guestData);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function launchParty(req, res) {
    try {
        let body = req.body;
        let user = req.user;
        let guestsInfo = [];

        if (!body) {
            return;
        }
        if (!body.videoId) {
            return res.json({
                Success: false,
                Message: "Video URL is required",
            });
        }

        let partyData = null;
        let guestInfo = null;

        // Joing existing party
        if (body.entityId) {
            partyData = (await PartyRepository.fetch(body.entityId)) || {};
            partyData.cAt = new Date().getTime();
        } else {
            // Launching new party
            partyData = await PartyRepository.createAndSave({
                cAt: Date.now(),
                maxGuestsAllowed: Constants.DEFAULT_MAX_GUESTS_ALLOWED,
                initialisedAt: Date.now(),
                status: "CREATED",
            });

            let guestData = user;
            guestData.partyId = partyData.entityId;
            guestInfo = await UserLoginAuth.createGuestWithPartyId(guestData, res);

            if (guestInfo && guestInfo.entityId) {
                partyData.guests = [guestInfo.entityId];
            }

            guestsInfo.push(guestInfo);
            partyData.videoId = body.videoId;
            partyData.videoSource = body.videoSource;
            partyData.hostedBy = user.entityId;
        }

        partyData.status = body.status;
        partyData.mode = body.mode;
        partyData.title = body.title || getDefaultPartyTitleForUser(user);

        if (partyData.status == "SCHEDULED") {
            partyData.scheduledDate = body.scheduledDate || Date.now();
        }

        if (body?.guests?.length) {
            for (let index = 0; index < body.guests.length; index++) {
                let guestUserId = body.guests[index].entityId,
                    guestData = await UserLoginAuth.createGuestWithPartyId({
                        entityId: guestUserId,
                        partyId: partyData.entityId,
                    });

                partyData.guests.push(guestData.entityId);
                partyData.guestUserIds.push(guestUserId);
                guestsInfo.push(guestData);
            }
        }

        if (body.entityId) {
            delete partyData.entityId;

            // Save Party data
            await PartyRepository.save(partyData);

            let partyDetails = await PartyRepository.fetch(body.entityId);
            partyDetails = await Helper.populateGuestDataOfParty(partyDetails);

            let responseData = JSON.parse(JSON.stringify(partyDetails));
            responseData.isHost = true;

            nLog.info(`${partyDetails.entityId} launched party`);
            return res.json({
                Success: true,
                Message: "DONE",
                data: responseData,
            });
        } else {
            // Save Party data
            await PartyRepository.save(partyData);

            let responseData = JSON.parse(JSON.stringify(partyData));
            responseData.guests = guestsInfo;
            responseData.isHost = true;

            nLog.info(`${partyData.entityId} launched party`);
            return res.json({
                Success: true,
                Message: "DONE",
                data: responseData,
            });
        }
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
}

/**
 * Fetches video data from redis or youtube
 *
 * @param {*} req
 * @param {*} res
 * @returns videos data
 */
export async function searchVideos(req, res) {
    try {
        let body = req.body;

        //If default videos for home page, get from redis if exists.
        if (body.defaultSearch) {
            let homePageVideos = await UserHomePageVideosRepository.search()
                .where("isDeleted")
                .is.not.equal(true)
                .returnFirst();

            return res.json({
                Success: true,
                message: "OK",
                code: 200,
                data: JSON.parse(homePageVideos.data),
            });
        } else {
            nLog.info(`SEARCH ${body.search}`);
            fetchFromYoutube();
        }

        function fetchFromYoutube(defaultSearch) {
            let url = `https://www.googleapis.com/youtube/v3/search?key=${process.env.YAPI}&q=${body.search}&order=relevance&part=snippet&type=video&maxResults=${body.limit}&videoType=any&regionCode=IN`;
            superagent
                .get(url)
                .set("Referer", process.env.APP_URL)
                .then((response) => {
                    //If home page default videos are not cached storing it in redis to avoid direct hit
                    if (defaultSearch) {
                        redis.set(defaultSearchKey, JSON.stringify(response.body));
                    }

                    console.log(JSON.stringify(response.body));

                    return res.json({
                        Success: true,
                        message: "OK",
                        code: 200,
                        data: response.body,
                    });
                })
                .catch("error", (err) => {
                    Helper.catchException(JSON.stringify(e), err.message);
                });
        }
    } catch (e) {
        // Helper.catchException(JSON.stringify(e), res)
        nLog.error(JSON.stringify(e));
    }
}

export async function trendVideos(req, res) {
    try {
        let body = req.body;
        //body.userMeta contains userId
        //add item homescreen in redis

        let url = `https://www.googleapis.com/youtube/v3/search?key=${process.env.YAPI}&q=${body.search}&order=relevance&part=snippet&type=video&maxResults=${body.limit}&videoType=any&regionCode=IN`;
        await superagent
            .get(url)
            .set("Referer", process.env.APP_URL)
            .end((err, response) => {
                if (err) {
                    return console.log("######", err);
                }

                return res.json({
                    Success: true,
                    message: "OK",
                    code: 200,
                    data: response.body,
                });
            })
            .on("error", (err) => {
                Helper.catchException(JSON.stringify(e), err.message);
            });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function updateVideoInTheParty(req, res) {
    try {
        let body = req.body;
        let user = req.user;

        if (!body) {
            return;
        }

        /* TODO :: $push: {
            videoListHistory: {
                videoId: body.oldVideoId,
                videoSource: body.oldVideoSource,
                mAt: new Date().getTime(),
                mBy: user.entityId,
            },
        }, */
        let partyData = await PartyRepository.fetch(body.partyId);
        partyData.videoId = body.videoId;
        partyData.videoSource = body.videoSource;

        // Save party data
        await PartyRepository.save(partyData);

        // populate guest data
        partyData = await Helper.populateGuestDataOfParty(partyData);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: partyData,
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function inviteGuestsInTheParty(req, res) {
    try {
        let body = req.body;
        if (!body) {
            return;
        }

        if (!body.partyId) {
            return res.json({
                Success: false,
                code: 400,
                message: "Mandatory fields missing",
            });
        }

        let guestsData = [],
            guestsUserIds = [];

        for (let index = 0; index < body.guests.length; index++) {
            let guestUserId = body?.guests?.[index]?.entityId,
                guestData = await UserLoginAuth.createGuestWithPartyId({
                    entityId: guestUserId,
                    partyId: body.partyId,
                });

            guestsData.push(guestData.entityId);
            guestsUserIds.push(guestUserId);
        }

        // Fetch party data
        let partyData = await PartyRepository.fetch(body.partyId);

        if (body.removedIds) {
            if (body?.removedIds?.guests?.length) {
                // Remove guests
                partyData.guests = _.filter(partyData.guests, (guestId) => {
                    if (!body?.removedIds?.guests?.includes(guestId)) {
                        return true;
                    }
                });

                // Remove guest userIds
                partyData.guestUserIds = _.filter(partyData.guestUserIds, (userId) => {
                    if (!body?.removedIds?.userIds?.includes(userId)) {
                        return true;
                    }
                });

                // Add removed userIds
                if (partyData?.removedUsers?.length) {
                    partyData.removedUsers = _.uniq(partyData?.removedUsers?.concat(body.removedIds.userIds));
                }
            }
        }

        if (guestsData?.length) {
            // Add guests
            if (partyData?.guests?.length) {
                partyData.guests = _.uniq(partyData?.guests?.concat(guestsData));
            }

            // Add guest userids
            if (partyData?.guestUserIds?.length && guestsUserIds?.length) {
                partyData.guestUserIds = _.uniq(partyData?.guestUserIds?.concat(guestsUserIds));
            }
        }

        await PartyRepository.save(partyData);

        partyData = await Helper.populateGuestDataOfParty(partyData);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: partyData,
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function togglePartyPrivacy(req, res) {
    try {
        let body = req.body;
        if (!body) {
            return;
        }

        if (!body.partyId) {
            return res.json({
                Success: false,
                code: 400,
                message: "Mandatory fields missing",
            });
        }

        let partyData = await PartyRepository.fetch(body.partyId);
        partyData.isPrivate = body.st;
        await PartyRepository.save(partyData);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
}

function generateRegex(query = "", options) {
    if (!query) {
        return query;
    }
    var specialCharacters = ["\\", "|", "/", "(", ")", "[", "]", "{", "}", "^", ".", "+", "#", "@", "*", "?", "$"],
        i,
        replaceRegEx;
    query = query.replace(/ +(?= )/g, "").trim();
    options = options ? options : "";

    for (i = 0; i < specialCharacters.length; i++) {
        replaceRegEx = new RegExp("\\" + specialCharacters[i], "g");
        query = query.replace(replaceRegEx, "\\" + specialCharacters[i]);
    }
    return new RegExp(".*?" + query, options);
}

function getDefaultPartyTitleForUser(user) {
    return user.fullName.replace(" ", "-") + "-watch-party-" + new Date().toISOString();
}
