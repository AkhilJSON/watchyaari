var Party = require('../models/common/party');

var User = require('../models/common/user');

var HomePageVideos = require('../models/data/homePageVideos');

var Guest = require('../models/common/guest');

var UserLoginAuth = require('./common/userLoginAuth');

var PartyMetrics = require('../models/common/partyMetrics');

var FeedbackQuestion = require('../models/common/feedbackQuestions');
var UserFeedback = require('../models/common/userFeedback');

var Helper = require('./helper');

const mongoose = require('mongoose');
const superagent = require('superagent');
var _ = require("lodash");
const redis = require('../config/redis');

let nLog = require('noogger');

let mongoId = mongoose.Types.ObjectId;
exports.joinParty = async function (req, res) {
    try {
        let body = req.body;

        if (!body.partyId) {
            return res.json({
                Success: false,
                Message: 'party id is required'
            });
        }

        let partyData = await Party.findById(mongoose.Types.ObjectId(body.partyId), '-videoListHistory -removedUsers')
            .populate({
                path: 'guests',
                model: 'Guest',
                select: '-partyId'
            });

        nLog.info(`${req.user._id} joined party ${partyData._id}`);
        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: partyData
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}


exports.getRecentPartyList = async function (req, res) {
    try {
        let partyData = await Party.aggregate(
            [
                {
                    $match: {
                        status: { $in: ['CREATED', 'ACTIVE', 'IN-ACTIVE', 'ENDED'] },
                        $or: [
                            { guestUserIds: { $in: [mongoose.Types.ObjectId(req.user._id)] } },
                            { hostedBy: mongoose.Types.ObjectId(req.user._id) }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { userIds: "$guestUserIds", createdBy: "$hostedBy" },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                {
                                                    $or: [
                                                        { $in: ["$_id", "$$userIds"] },
                                                        { $eq: ["$_id", "$$createdBy"] },
                                                    ]
                                                },
                                                { $ne: ["$_id", req.user._id] }
                                            ]
                                    }
                                }

                            },
                            { $project: { _id: 0, fullName: 1 } }
                        ],
                        as: 'guestData'
                    }
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
                        partyDuration: 1
                    }
                },
                {
                    $sort: {
                        cAt: -1
                    }
                }
            ]
        );

        partyData = _.map(partyData, (party) => {
            party.guests = _.map(party.guestData || [], (party) => { return party.fullName });
            party.guests = `${(party.guests.length) ? 'You, ' : 'Only you'} ${party.guests.join(', ')}`.toUpperCase();
            delete party.guestData;
            return party;
        })
        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: partyData
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.getUpcomingPartyList = async function (req, res) {
    try {
        let partyData = await Party.aggregate(
            [
                {
                    $match: {
                        status: { $in: ['SCHEDULED'] },
                        $or: [
                            { guestUserIds: { $in: [mongoose.Types.ObjectId(req.user._id)] } },
                            { hostedBy: mongoose.Types.ObjectId(req.user._id) }
                        ]
                    }
                },
                {
                    $sort: {
                        cAt: -1
                    }
                }
            ]
        );

        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: partyData
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.fetchUsers = async function (req, res) {
    try {
        let { search, skip, limit } = req.body || {};
        let regexp = generateRegex(search);
        search = search.toLowerCase();
        let users = await User.aggregate(
            [
                {
                    $project: {
                        _id: 1,
                        fullName: 1,
                        email: 1
                    }
                },
                {
                    $match: {
                        $or: [
                            { email: { $regex: regexp, $options: "i" } },
                            { fullName: { $regex: regexp, $options: "i" } }
                        ],
                        _id: { $ne: req.user._id }
                    }
                },
                {
                    $addFields: {
                        lowerName: { $toLower: "$fullName" }
                    }
                },
                {
                    $addFields: {
                        nameIndex: { $indexOfCP: ['$lowerName', search] },
                        emailIndex: { $indexOfCP: ['$email', search] }
                    }
                },
                {
                    $addFields: {
                        nameIndex: { $cond: { if: { $eq: ["$nameIndex", -1] }, then: 999, else: '$nameIndex' } },
                        emailIndex: { $cond: { if: { $eq: ["$emailIndex", -1] }, then: 999, else: '$emailIndex' } }
                    }
                },
                {
                    $sort: {
                        nameIndex: 1,
                        emailIndex: 1
                    }
                },
                {
                    $skip: skip || 0
                },
                {
                    $limit: limit || 10
                }
            ]
        ) || [];
        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: users
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.fetchBlockedUsers = async function (req, res) {
    try {
        let { partyId } = req.body || {};
        let partyData = await Party.findById(mongoose.Types.ObjectId(partyId), '_id removedUsers')
            .populate({
                path: 'removedUsers',
                model: 'User',
                select: '_id fullName',
            })
        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: partyData.removedUsers || []
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.unBlockUsers = async function (req, res) {
    try {
        let { partyId, userId } = req.body || {};

        partyId = mongoose.Types.ObjectId(partyId);
        let updateRes = await Party.updateOne({ _id: partyId }, {
            $pull: {
                removedUsers: { $in: [userId] }
            }
        });

        return res.json({
            Success: true,
            message: 'OK',
            code: 200
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.updateCoHosts = async function (req, res) {
    try {
        let { guestId, add } = req.body || {};

        guestId = mongoose.Types.ObjectId(guestId);

        let updateRes = await Guest.findOneAndUpdate({ _id: guestId }, { isCoHost: add });

        return res.json({
            Success: true,
            message: 'OK',
            code: 200
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}


exports.launchParty = async function (req, res) {
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
                Message: 'Video URL is required'
            });
        }

        let partyData = null;
        let guestInfo = null;
        if (body._id) {
            partyData = await Party.findById(mongoose.Types.ObjectId(body._id)) || {};
            partyData.cAt = new Date().getTime();
        } else {
            partyData = new Party();
            let guestData = user;
            guestData.partyId = partyData._id;
            partyData.cAt = new Date().getTime();

            guestInfo = await UserLoginAuth.createGuestWithPartyId(guestData, res);
            if (guestInfo && guestInfo._id) {
                partyData.guests = [mongoose.Types.ObjectId(guestInfo._id)];
            }
            guestsInfo.push(guestInfo);
            partyData.videoId = body.videoId;
            partyData.videoSource = body.videoSource;
            partyData.hostedBy = mongoose.Types.ObjectId(user._id);
        }
        partyData.status = body.status;
        partyData.mode = body.mode;
        partyData.title = body.title || (getDefaultPartyTitleForUser(user));


        if (partyData.status == 'SCHEDULED') {
            partyData.scheduledDate = body.scheduledDate || new Date().getTime();
        }



        if (body.guests && body.guests.length) {
            for (let index = 0; index < body.guests.length; index++) {
                let guestUserId = body.guests[index]._id;
                let guestData = await UserLoginAuth.createGuestWithPartyId({ _id: guestUserId, partyId: partyData._id });
                partyData.guests.push(mongoose.Types.ObjectId(guestData._id))
                partyData.guestUserIds.push(guestUserId);
                guestsInfo.push(guestData);
            }
        }

        //create party metrics document
        // new PartyMetrics({ partyId: partyData._id }).save();

        if (body._id) {
            delete partyData._id;
            await Party.updateOne({ _id: mongoose.Types.ObjectId(body._id) }, { $set: partyData });
            let partyDetails = await Party.findById(mongoose.Types.ObjectId(body._id), '-videoListHistory -removedUsers')
                .populate({
                    path: 'guests',
                    model: 'Guest',
                    select: '-partyId',
                    populate: {
                        path: 'userId',
                        model: 'User',
                        select: '_id fullName email'
                    }
                }) || {};
            let responseData = JSON.parse(JSON.stringify(partyDetails));
            responseData.isHost = true;

            nLog.info(`${partyDetails._id} launched party`);
            return res.json({
                Success: true,
                Message: 'DONE',
                data: responseData
            })
        } else {
            partyData.save()
                .then(async (val) => {
                    let responseData = JSON.parse(JSON.stringify(val));
                    responseData.guests = guestInfo;
                    responseData.isHost = true;

                    nLog.info(`${partyData._id} launched party`);
                    return res.json({
                        Success: true,
                        Message: 'DONE',
                        data: responseData
                    })
                })
                .catch((err) => {
                    return res.json({
                        Success: false,
                        message: 'Error'
                    })
                })
        }
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.searchVideos = async function (req, res) {
    try {
        let body = req.body;
        //body.userMeta contains userId
        //add item homescreen in redis
        let defaultSearchKey = "DEFAULT_VIDEOS"

        //If default videos for home page, get from redis if exists.
        if (body.defaultSearch) {
            redis.get(defaultSearchKey, async (err, results) => {
                if (!results) {
                    let homePageVideos = await HomePageVideos.findOne({ isDeleted: { $ne: true } });

                    if (homePageVideos) {
                        nLog.info("Fetching stored home page videos from db");

                        //Store data in redis
                        redis.set(defaultSearchKey, homePageVideos.data);

                        return res.json({
                            Success: true,
                            message: 'OK',
                            code: 200,
                            data: JSON.parse(homePageVideos.data)
                        })
                    } else {
                        nLog.info("FETCHIG VIDEOS USING YAPI")
                        fetchFromYoutube(true);
                    }
                } else {
                    nLog.info("CACHED DEFAULT VIDEOS")
                    return res.json({
                        Success: true,
                        message: 'OK',
                        code: 200,
                        data: JSON.parse(results)
                    })
                }
            });
        } else {
            nLog.info(`SEARCH ${body.search}`)
            fetchFromYoutube();
        }

        function fetchFromYoutube(defaultSearch) {
            let url = `https://www.googleapis.com/youtube/v3/search?key=${process.env.YAPI}&q=${body.search}&order=relevance&part=snippet&type=video&maxResults=${body.limit}&videoType=any&regionCode=IN`
            superagent.get(url)
                .set('Referer', process.env.APP_URL)
                .then((response) => {

                    //If home page default videos are not cached storing it in redis to avoid direct hit 
                    if (defaultSearch) {
                        redis.set(defaultSearchKey, JSON.stringify(response.body));
                    }

                    console.log(JSON.stringify(response.body))

                    return res.json({
                        Success: true,
                        message: 'OK',
                        code: 200,
                        data: response.body
                    })
                })
                .catch("error", (err) => {
                    Helper.catchException(JSON.stringify(e), err.message)
                });
        }
    } catch (e) {
        // Helper.catchException(JSON.stringify(e), res)
        nLog.error(JSON.stringify(e));
    }
}

exports.trendVideos = async function (req, res) {
    try {
        let body = req.body;
        //body.userMeta contains userId
        //add item homescreen in redis

        let url = `https://www.googleapis.com/youtube/v3/search?key=${process.env.YAPI}&q=${body.search}&order=relevance&part=snippet&type=video&maxResults=${body.limit}&videoType=any&regionCode=IN`
        await superagent.get(url)
            .set('Referer', process.env.APP_URL)
            .end((err, response) => {
                if (err) { return console.log("######", err); }

                return res.json({
                    Success: true,
                    message: 'OK',
                    code: 200,
                    data: response.body
                })
            }).on("error", (err) => {
                Helper.catchException(JSON.stringify(e), err.message)
            });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res)
    }


}



exports.updateVideoInTheParty = async function (req, res) {
    try {
        let body = req.body;
        let user = req.user;

        if (!body) {
            return;
        }

        let updRes = await Party.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(body.partyId) }, {
            $push: {
                videoListHistory: {
                    videoId: body.oldVideoId,
                    videoSource: body.oldVideoSource,
                    mAt: new Date().getTime(),
                    mBy: user._id
                }
            },
            $set: {
                videoId: body.videoId,
                videoSource: body.videoSource,
            }
        })
        let partyData = await Party.findById(mongoose.Types.ObjectId(body.partyId), '-videoListHistory -removedUsers').populate({
            path: 'guests',
            model: 'Guest',
            select: '-partyId',
            populate: {
                path: 'userId',
                model: 'User',
                select: '_id fullName email'
            }
        }) || {};

        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: partyData
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.inviteGuestsInTheParty = async function (req, res) {
    try {
        let body = req.body;
        if (!body) {
            return;
        }

        if (!body.partyId) {
            return res.json({
                Success: false,
                code: 400,
                message: 'Mandatory fields missing'
            });
        }

        let guestsData = [], guestsUserIds = [];

        for (let index = 0; index < body.guests.length; index++) {
            let guestUserId = body.guests[index]._id;
            let guestData = await UserLoginAuth.createGuestWithPartyId({ _id: guestUserId, partyId: body.partyId });
            guestsData.push(mongoose.Types.ObjectId(guestData._id))
            guestsUserIds.push(mongoose.Types.ObjectId(guestUserId));
        }

        let pushQuery = {
            $addToSet: {
                guests: { $each: guestsData },
                guestUserIds: { $each: guestsUserIds },
            }
        };
        let pullQuery = null;

        if (body.removedIds) {
            if (body.removedIds.guests && body.removedIds.guests.length) {
                pullQuery = {};
                body.removedIds.guests = _.map(body.removedIds.guests, (id) => { return mongoose.Types.ObjectId(id) });
                body.removedIds.userIds = _.map(body.removedIds.userIds, (id) => { return mongoose.Types.ObjectId(id) });

                pullQuery['$pull'] = {
                    guests: { $in: body.removedIds.guests },
                    guestUserIds: { $in: body.removedIds.userIds }
                }
                pullQuery['$addToSet'] = {
                    removedUsers: { $each: body.removedIds.userIds }
                }
            }
        }

        if (guestsData && guestsData.length) {
            let pushres = await Party.findByIdAndUpdate(mongoose.Types.ObjectId(body.partyId), pushQuery);
        }
        if (pullQuery) {
            let pullres = await Party.findByIdAndUpdate(mongoose.Types.ObjectId(body.partyId), pullQuery);
        }

        let partyData = await Party.findById(mongoose.Types.ObjectId(body.partyId), '-videoListHistory -removedUsers').populate({
            path: 'guests',
            model: 'Guest',
            select: '-partyId',
            populate: {
                path: 'userId',
                model: 'User',
                select: '_id fullName email'
            }
        }) || {};


        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: partyData
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.togglePartyPrivacy = async function (req, res) {
    try {
        let body = req.body;
        if (!body) {
            return;
        }

        if (!body.partyId) {
            return res.json({
                Success: false,
                code: 400,
                message: 'Mandatory fields missing'
            });
        }

        await Party.findByIdAndUpdate(mongoose.Types.ObjectId(body.partyId), { isPrivate: body.st })
        return res.json({
            Success: true,
            message: 'OK',
            code: 200
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res)
    }
}

exports.saveTransportPolicyMetrics = async function ({ metricsData = null, partyId = null }) {
    try {
        if (!partyId || !metricsData) {
            return;
        }
        partyId = mongoId(partyId);

        let partyMetricsData = await PartyMetrics.findOne({ partyId });
        if (!partyMetricsData) {
            partyMetricsData = new PartyMetrics();
            partyMetricsData.partyId = partyId;

            let guestInfo = {
                userId: mongoId(metricsData.userId),
                iceTransportPolicy: [
                    {
                        peerId: mongoId(metricsData.peerId),
                        transportPolicy: metricsData.transportPolicy,
                        address: metricsData.address
                    }
                ]
            };
            partyMetricsData['guestInfo'] = [guestInfo];

            await partyMetricsData.save();
        } else {
            let userDataExists = _.find(partyMetricsData.guestInfo || [], { userId: mongoId(metricsData.userId) });
            if (userDataExists) {
                await PartyMetrics.update({ partyId, 'guestInfo.userId': mongoId(metricsData.userId) }, {
                    $addToSet: {
                        'guestInfo.$.iceTransportPolicy': {
                            peerId: mongoId(metricsData.peerId),
                            transportPolicy: metricsData.transportPolicy,
                            address: metricsData.address
                        }
                    }
                })
            } else {
                await PartyMetrics.update({ partyId }, {
                    $addToSet: {
                        guestInfo: {
                            userId: mongoId(metricsData.userId),
                            iceTransportPolicy: [
                                {
                                    peerId: mongoId(metricsData.peerId),
                                    transportPolicy: metricsData.transportPolicy,
                                    address: metricsData.address
                                }
                            ]
                        }
                    }
                })
            }
        }
    } catch (e) {
        console.log("e::", e)
    }
}


//Only admin can add feedback questions.
exports.createFeedbackQuestion = async function (req, res) {
    try {
        /*
            status codes::
            100: No access to this endpoint
            101: Mandatory fields are missing
            102: rating questions should have lowerLimitValue && higherLimitValue
            200: DONE
        */
        let { title, questionType, feedbackType, isActive, index, lowerLimitValue, higherLimitValue, questionId } = req.body || {};

        if (!req.user.isAdmin) {
            return res.json({
                Success: false,
                status: 100,
                message: "You have no access to this endpoint"
            });
        }

        if (!questionId && (!title || !questionType || !feedbackType)) {
            return res.json({
                Success: false,
                status: 101,
                message: "Mandatory fields are missing"
            });
        }

        if (questionId && !questionType) {
            return res.json({
                Success: false,
                status: 101,
                message: "Mandatory fields are missing, (questionType)"
            });
        }
        let questionData = {}

        if (!questionId && questionType == 'rating') {
            if (!lowerLimitValue || !higherLimitValue) {
                return res.json({
                    Success: false,
                    status: 101,
                    message: "Rating questions should have lowerLimitValue && higherLimitValue"
                });
            }

            questionData['lowerLimitValue'] = lowerLimitValue;
            questionData['higherLimitValue'] = higherLimitValue;
        }


        if (questionId) {
            _.has(req.body, 'title') && (questionData['title'] = title);
            _.has(req.body, 'questionType') && (questionData['questionType'] = questionType);
            _.has(req.body, 'feedbackType') && (questionData['feedbackType'] = feedbackType);
            _.has(req.body, 'isActive') && (questionData['isActive'] = isActive);
            _.has(req.body, 'index') && (questionData['index'] = index);
            _.has(req.body, 'lowerLimitValue') && (questionData['lowerLimitValue'] = lowerLimitValue);
            _.has(req.body, 'higherLimitValue') && (questionData['higherLimitValue'] = higherLimitValue);
        } else {
            questionData = {
                title,
                questionType,
                feedbackType,
                isActive,
                index,
                cBy: req.user._id
            };

            if (questionType == 'rating' && lowerLimitValue && higherLimitValue) {
                questionData['lowerLimitValue'] = lowerLimitValue;
                questionData['higherLimitValue'] = higherLimitValue;
            }
        }



        if (questionId) {
            questionId = mongoId(questionId);

            FeedbackQuestion.update({ _id: questionId }, { $set: questionData })
                .then((response) => {
                    nLog.info(`${req.user._id} Updated question ${questionId}`);
                    return res.json({
                        Success: true,
                        status: 200,
                        message: "Updated Successfully."
                    });
                })
                .catch((err) => {
                    return res.json({
                        Success: false,
                        status: 400,
                        message: JSON.stringify(err)
                    });
                })
        } else {
            new FeedbackQuestion(questionData).save()
                .then((question) => {
                    nLog.info(`${req.user._id} CREATED question ${question._id}`);
                    return res.json({
                        Success: true,
                        status: 200,
                        message: "Created Successfully."
                    });
                })
                .catch((err) => {
                    return res.json({
                        Success: false,
                        status: 400,
                        message: JSON.stringify(err)
                    });
                })
        }
    } catch (e) {
        console.log("e::", e)
    }
}

//Method to fetch feedback question
exports.getFeedbackQuestions = async function (req, res) {
    try {
        /*
            status codes::
            101: Mandatory fields are missing
            200: DONE
        */
        let { feedbackType = ["party"], isActive = true } = req.body || {};

        if (!feedbackType) {
            return res.json({
                Success: false,
                status: 101,
                message: "Mandatory fields are missing"
            });
        }

        let questions = await FeedbackQuestion.find({ feedbackType: { $in: feedbackType }, isActive }, 'title questionType lowerLimitValue higherLimitValue').sort({ index: 1 });
        return res.json({
            Success: true,
            status: 200,
            message: "OK",
            questions
        });

    } catch (e) {
        console.log("e::", e)
    }
}

//Submit feedback response of the user
exports.submitFeedbackResponse = async function (req, res) {
    try {
        /*
            status codes::
            101: Mandatory fields are missing
            200: DONE
        */
        let { feedbackResponse = [], partyId } = req.body || {};

        if (!feedbackResponse || !partyId) {
            return res.json({
                Success: false,
                status: 101,
                message: "Mandatory fields are missing"
            });
        }

        partyId = mongoId(partyId);

        feedbackResponse = _.map(feedbackResponse, (question) => {
            question.questionId = mongoId(question.questionId);
            return question
        })

        UserFeedback({ partyId, feedback: feedbackResponse, userId: req.user._id }).save()
            .then((response) => {
                nLog.info(`${req.user._id} submitted feedback ${response._id}`);
            })
            .catch((err) => {
                nLog.info(err);
            })
        return res.json({
            Success: true,
            status: 200,
            message: "Successfully submitted."
        });

    } catch (e) {
        console.log("e::", e)
    }
}


function generateRegex(query = "", options) {
    if (!query) {
        return query;
    }
    var specialCharacters = ['\\', '|', '/', '(', ')', '[', ']', '{', '}', '^', '.', '+', '#', '@', '*', '?', '$'],
        i,
        replaceRegEx;
    query = query.replace(/ +(?= )/g, '').trim();
    options = options ? options : '';

    for (i = 0; i < specialCharacters.length; i++) {
        replaceRegEx = new RegExp('\\' + specialCharacters[i], 'g');
        query = query.replace(replaceRegEx, '\\' + specialCharacters[i]);
    }
    return new RegExp(".*?" + query, options);
}


function getDefaultPartyTitleForUser(user) {
    return user.fullName.replace(' ', '-') + '-watch-party-' + new Date().toISOString();
}