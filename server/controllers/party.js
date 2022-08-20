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

        let partyData = await Party.findById(
            mongoose.Types.ObjectId(body.partyId),
            "-videoListHistory -removedUsers"
        ).populate({
            path: "guests",
            model: "Guest",
            select: "-partyId",
        });

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
        let { search, skip, limit } = req.body || {};
        let regexp = generateRegex(search);
        search = search.toLowerCase();
        let users =
            (await User.aggregate([
                {
                    $project: {
                        entityId: 1,
                        fullName: 1,
                        email: 1,
                    },
                },
                {
                    $match: {
                        $or: [
                            { email: { $regex: regexp, $options: "i" } },
                            { fullName: { $regex: regexp, $options: "i" } },
                        ],
                        entityId: { $ne: req.user.entityId },
                    },
                },
                {
                    $addFields: {
                        lowerName: { $toLower: "$fullName" },
                    },
                },
                {
                    $addFields: {
                        nameIndex: { $indexOfCP: ["$lowerName", search] },
                        emailIndex: { $indexOfCP: ["$email", search] },
                    },
                },
                {
                    $addFields: {
                        nameIndex: { $cond: { if: { $eq: ["$nameIndex", -1] }, then: 999, else: "$nameIndex" } },
                        emailIndex: { $cond: { if: { $eq: ["$emailIndex", -1] }, then: 999, else: "$emailIndex" } },
                    },
                },
                {
                    $sort: {
                        nameIndex: 1,
                        emailIndex: 1,
                    },
                },
                {
                    $skip: skip || 0,
                },
                {
                    $limit: limit || 10,
                },
            ])) || [];
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
        let partyData = await Party.findById(mongoose.Types.ObjectId(partyId), "entityId removedUsers").populate({
            path: "removedUsers",
            model: "User",
            select: "entityId fullName",
        });
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

        partyId = mongoose.Types.ObjectId(partyId);
        let updateRes = await Party.updateOne(
            { entityId: partyId },
            {
                $pull: {
                    removedUsers: { $in: [userId] },
                },
            }
        );

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

        guestId = mongoose.Types.ObjectId(guestId);

        let updateRes = await Guest.findOneAndUpdate({ entityId: guestId }, { isCoHost: add });

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
        if (body.entityId) {
            partyData = (await PartyRepository.fetch(body.entityId)) || {};
            partyData.cAt = new Date().getTime();
        } else {
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

        let updRes = await Party.findByIdAndUpdate(
            { entityId: mongoose.Types.ObjectId(body.partyId) },
            {
                $push: {
                    videoListHistory: {
                        videoId: body.oldVideoId,
                        videoSource: body.oldVideoSource,
                        mAt: new Date().getTime(),
                        mBy: user.entityId,
                    },
                },
                $set: {
                    videoId: body.videoId,
                    videoSource: body.videoSource,
                },
            }
        );
        let partyData =
            (await Party.findById(mongoose.Types.ObjectId(body.partyId), "-videoListHistory -removedUsers").populate({
                path: "guests",
                model: "Guest",
                select: "-partyId",
                populate: {
                    path: "userId",
                    model: "User",
                    select: "entityId fullName email",
                },
            })) || {};

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
            let guestUserId = body.guests[index].entityId;
            let guestData = await UserLoginAuth.createGuestWithPartyId({
                entityId: guestUserId,
                partyId: body.partyId,
            });
            guestsData.push(mongoose.Types.ObjectId(guestData.entityId));
            guestsUserIds.push(mongoose.Types.ObjectId(guestUserId));
        }

        let pushQuery = {
            $addToSet: {
                guests: { $each: guestsData },
                guestUserIds: { $each: guestsUserIds },
            },
        };
        let pullQuery = null;

        if (body.removedIds) {
            if (body.removedIds.guests && body.removedIds.guests.length) {
                pullQuery = {};
                body.removedIds.guests = _.map(body.removedIds.guests, (id) => {
                    return mongoose.Types.ObjectId(id);
                });
                body.removedIds.userIds = _.map(body.removedIds.userIds, (id) => {
                    return mongoose.Types.ObjectId(id);
                });

                pullQuery["$pull"] = {
                    guests: { $in: body.removedIds.guests },
                    guestUserIds: { $in: body.removedIds.userIds },
                };
                pullQuery["$addToSet"] = {
                    removedUsers: { $each: body.removedIds.userIds },
                };
            }
        }

        if (guestsData && guestsData.length) {
            let pushres = await Party.findByIdAndUpdate(mongoose.Types.ObjectId(body.partyId), pushQuery);
        }
        if (pullQuery) {
            let pullres = await Party.findByIdAndUpdate(mongoose.Types.ObjectId(body.partyId), pullQuery);
        }

        let partyData =
            (await Party.findById(mongoose.Types.ObjectId(body.partyId), "-videoListHistory -removedUsers").populate({
                path: "guests",
                model: "Guest",
                select: "-partyId",
                populate: {
                    path: "userId",
                    model: "User",
                    select: "entityId fullName email",
                },
            })) || {};

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

        await Party.findByIdAndUpdate(mongoose.Types.ObjectId(body.partyId), { isPrivate: body.st });
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
