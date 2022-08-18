// packages
var jwt = require("jsonwebtoken");
var _ = require("lodash");
var randomstring = require("randomstring");
var jwtDecode = require("jwt-decode");
let nLog = require("noogger");
const mongoose = require("mongoose");

// models
var User = require("../../models/common/user");
var Party = require("../../models/common/party");
var Guest = require("../../models/common/guest");

// services
var EmailService = require("../../controllers/common/emailService");

// helpers
var Helper = require("../helper");

exports.userRegistration = async function (req, res) {
    try {
        let Body = req.body;
        createUserValidations(Body, res);

        // Body['createdBy'] = req.user._id;
        // Body['modifiedBy'] = req.user._id;

        let userCheck = await User.findOne({
            $and: [{ email: Body.email }, { isDeleted: false }],
        });

        if (userCheck) {
            return res.json({
                Success: false,
                Message: "email already exists",
            });
        }

        let userData = new User();
        userData.email = Body.email.trim();
        userData.password = Body.password;
        userData.fullName = Body.fullName;

        userData
            .save()
            .then(async (user) => {
                //SEND EMAIL TO THE USER
                // sendEmailVerificationLinkToUser(user);

                let userObj = _.pick(user, [
                    "_id",
                    "email",
                    "fullName",
                    "mobile",
                    "createdOn",
                    "status",
                    "emailVerified",
                    "phoneVerified",
                ]);
                var token = giveAuthTokenForLoggedInUser(userObj);

                nLog.info(`${userObj._id} Registered successfully`);
                res.json({
                    Success: true,
                    Message: "Registered successfully",
                    Token: "JWT " + token,
                    uid: userObj._id,
                });
            })
            .catch((err) => {
                console.log(err);
                Helper.catchException(JSON.stringify(err), res);
            });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
};

exports.verifyMyEmail = async function (req, res) {
    await sendEmailVerificationLinkToUser(req.user);
    return res.json({
        Success: true,
        Message: "Sent",
    });
};

exports.forgotPassword = async function (req, res) {
    try {
        let body = req.body;

        let user = await User.findOne(
            { email: body.email, isDeleted: { $ne: true } },
            "_id email fullName passwordResetCode"
        );
        if (!user) {
            return res.json({
                Success: false,
                Message: "Invalid user",
            });
        }
        if (user.passwordResetCode) {
            return res.json({
                Success: false,
                Message: "Already requested",
            });
        }
        sendForgotPasswordLink(user);

        nLog.info(`${user._id} Forgot password requested`);
        return res.json({
            Success: true,
            Message: "Ok",
        });
    } catch (e) {
        return res.json({
            Success: false,
            Message: "Invalid user",
        });
    }
};

exports.resetPassword = async function (req, res) {
    try {
        let body = req.body;

        User.findOne({ _id: body.uid }, async function (err, user) {
            if (err) {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
            if (user) {
                if (user.passwordResetCode) {
                    user.passwordResetCode = "";
                    user.password = body.password;
                    await user.save();

                    nLog.info(`${user._id} reset successfully`);
                    return res.json({
                        Success: true,
                        Message: "Ok",
                    });
                } else {
                    return res.json({
                        Success: false,
                        Message: "Invalid user",
                    });
                }
            } else {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
        });
    } catch (e) {
        return res.json({
            Success: false,
            Message: "Invalid verification token",
        });
    }
};

exports.verifyResetPasswordLink = async function (req, res) {
    try {
        let body = req.body;
        let token = body.token || null;

        if (!token) {
            return res.json({
                Success: false,
                Message: "Invalid verification token",
            });
        }

        var decoded = jwtDecode(token);
        User.findOne({ _id: mongoose.Types.ObjectId(decoded._id) }, async function (err, user) {
            if (err) {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
            if (user) {
                if (user.passwordResetCode) {
                    nLog.info(`${user._id} password reset successfully`);

                    return res.json({
                        Success: true,
                        Message: "Ok",
                        uid: user._id,
                    });
                } else {
                    return res.json({
                        Success: false,
                        Message: "Invalid request",
                    });
                }
            } else {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
        });
    } catch (e) {
        return res.json({
            Success: false,
            Message: "Invalid verification token",
        });
    }
};

exports.verifyUserEmail = async function (req, res) {
    try {
        let body = req.body;
        let token = body.token || null;

        if (!token) {
            return res.json({
                Success: false,
                Message: "Invalid verification token",
            });
        }

        var decoded = jwtDecode(token);
        User.findOne({ _id: mongoose.Types.ObjectId(decoded._id) }, async function (err, user) {
            if (err) {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
            if (user) {
                if (!user.emailVerified) {
                    await User.findByIdAndUpdate(
                        { _id: user._id },
                        {
                            $set: {
                                emailVerified: true,
                                emailVerifiedOn: new Date().getTime(),
                                emailVerificationCode: "",
                            },
                        }
                    );

                    nLog.info(`${user._id} verified user email`);
                    return res.json({
                        Success: true,
                        Message: "Ok",
                    });
                } else {
                    return res.json({
                        Success: true,
                        Message: "Already verified",
                    });
                }
            } else {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
        });
    } catch (e) {
        return res.json({
            Success: false,
            Message: "Invalid verification token",
        });
    }
};

exports.createUserManually = async function (req, res) {
    try {
        let Body = req.body;
        createUserValidations(Body, res);

        // Body['createdBy'] = req.user._id;
        // Body['modifiedBy'] = req.user._id;

        let user = new User(Body);

        user.save()
            .then((u) => {
                res.json({
                    Success: true,
                    Message: "Ok",
                    User: user,
                });
            })
            .catch((err) => {
                console.log(err);
                Helper.catchException(JSON.stringify(err), res);
            });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
};

exports.userAuthentication = async function (req, res) {
    try {
        let Body = req.body;

        if (!Body.email || (Body.email && Body.email.length == 0)) {
            return res.json({
                Success: false,
                Message: "email should not be empty",
            });
        }
        if (!Body.password || (Body.password && Body.password.length == 0)) {
            return res.json({
                Success: false,
                Message: "password should not be empty",
            });
        }

        User.findOne({
            $and: [{ $or: [{ email: Body.email }, { mobile: Body.email }] }, { isDeleted: false }],
        })
            .then(async (val) => {
                if (val) {
                    if (val.status === "INACTIVE") {
                        return res.json({
                            Success: false,
                            Message: "Your Account is DeActivated",
                        });
                    }
                    val.comparePassword(req.body.password, async function (err, isMatch) {
                        if (isMatch && !err) {
                            let userObj = _.pick(val, [
                                "_id",
                                "email",
                                "fullName",
                                "mobile",
                                "createdOn",
                                "status",
                                "emailVerified",
                                "phoneVerified",
                            ]);
                            var token = giveAuthTokenForLoggedInUser(userObj);

                            nLog.info(`${userObj._id} Authenticated successfuly`);
                            res.json({
                                Success: true,
                                Message: "Ok",
                                Token: "JWT " + token,
                                uid: userObj._id,
                            });
                        } else {
                            return res.json({
                                Success: false,
                                Message: "passwords did not match",
                            });
                        }
                    });
                } else {
                    return res.json({
                        Success: false,
                        Message: "cannot find user",
                    });
                }
            })
            .catch((err) => {
                console.log(err);
                Helper.catchException(JSON.stringify(err), res);
            });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
};

exports.getPartyDetails = async function (req, res) {
    try {
        let body = req.body;
        let user = req.user;

        if (!body) {
            return;
        }
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
            populate: {
                path: "userId",
                model: "User",
                select: "_id fullName",
            },
        });

        if (!partyData) {
            return res.json({
                Success: false,
                message: "Party Not Found",
                code: 404,
            });
        }

        partyData = JSON.parse(JSON.stringify(partyData));

        if (partyData.hostedBy == user._id) {
            partyData.isHost = true;
        }
        if (partyData) {
            nLog.info(`${partyData._id} partyDetails requested`);

            return res.json({
                Success: true,
                message: "OK",
                code: 200,
                data: partyData,
            });
        } else {
            return res.json({
                Success: false,
                message: "Party Not Found",
                code: 404,
            });
        }
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
};

exports.createGuestWithPartyId = async function (guestData) {
    return createGuest(guestData);
};

exports.getVideoIdByURL = function (domain, videoURL) {
    return getVideoId(domain, videoURL);
};

exports.verifyUser = function (token) {
    return new Promise((resolve, reject) => {
        var decoded = jwtDecode(token);
        User.findOne({ _id: mongoose.Types.ObjectId(decoded._id) }, async function (err, user) {
            if (err) {
                return reject("USER_NOT_FOUND");
            }
            if (user) {
                return resolve(user);
            } else {
                return reject("USER_NOT_FOUND");
            }
        });
    });
};

exports.getUserDetails = async function (req, res) {
    try {
        let body = req.body;
        let user = req.user;

        if (!body) {
            return;
        }
        let userData = _.pick(user, ["fullName"]);
        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: userData,
        });
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
};

function giveAuthTokenForLoggedInUser(val) {
    let temp = Object.assign(val, {
        exp: Math.floor(new Date() / 1000) + 60 * 60 * 24 * 365, // 1 year
    });
    var token = jwt.sign(temp, process.env.SECRET_KEY);
    return token;
}

function generateTokenForEmailVerification(val) {
    let temp = Object.assign(val, {
        exp: Math.floor(new Date() / 1000) + 60 * 60 * 24 * 365, // 1 year
    });
    var token = jwt.sign(temp, process.env.SECRET_KEY);
    return token;
}

function createUserValidations(Body, res) {
    if (!Body.fullName || (Body.fullName && Body.fullName.length == 0)) {
        return res.json({
            Success: false,
            Message: "full name should not be empty",
        });
    }

    if (!Body.email || (Body.email && Body.email.trim() && Body.email.trim().length == 0)) {
        return res.json({
            Success: false,
            Message: "email should not be empty",
        });
    }

    if (!Body.password || (Body.password && Body.password.length == 0)) {
        return res.json({
            Success: false,
            Message: "password should not be empty",
        });
    }
}

function getVideoId(domain, videoURL) {
    switch (domain) {
        default:
            if (videoURL.length) {
                videoURL = new URL(videoURL);
                if (videoURL && videoURL.search) {
                    videoURL = new URLSearchParams(videoURL.search).get("v");
                    if (videoURL) {
                        return videoURL;
                    }
                }
            }
            return "";
            break;
    }
}

function createGuest(data, res) {
    return new Promise(async (resolve, reject) => {
        if (!data._id || !data.partyId) {
            resolve(null);
            return;
        }
        let guestData = await Guest.findOne({
            partyId: mongoose.Types.ObjectId(data.partyId),
            userId: mongoose.Types.ObjectId(data._id),
        });
        if (guestData && guestData._id) {
            guestData = JSON.parse(JSON.stringify(guestData));
            guestData.alreadyJoined = true;
            resolve(guestData);
            return;
        }
        guestData = new Guest();
        guestData.partyId = mongoose.Types.ObjectId(data.partyId);
        guestData.userId = data._id;
        guestData
            .save()
            .then((val) => {
                resolve(val);
            })
            .catch((err) => {
                resolve(null);
            });
    });
}

function sendEmailVerificationLinkToUser(user) {
    return new Promise(async (resolve, reject) => {
        let token = generateTokenForEmailVerification({ _id: user._id });
        let emailBody = {
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
            },
            personalizations: [
                {
                    to: [
                        {
                            email: user.email,
                        },
                    ],
                    dynamic_template_data: {
                        userName: user.fullName,
                        verificationURL: `${process.env.WEBSITE_URL}/verifyEmail/${token}`,
                    },
                    subject: "Welcome to WatchYaari.com, Please verify your account.",
                },
            ],
            template_id: "d-04c2b5465c874ad7a7c6559523824c52",
        };
        EmailService.sendEmail(emailBody);

        await User.findByIdAndUpdate({ _id: user._id }, { $set: { emailVerificationCode: token } });

        nLog.info(`userId: ${user._id} Email sent`);
        return resolve("Ok");
    });
}

function sendForgotPasswordLink(user) {
    return new Promise(async (resolve, reject) => {
        let token = generateTokenForEmailVerification({ _id: user._id });
        let emailBody = {
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
            },
            personalizations: [
                {
                    to: [
                        {
                            email: user.email,
                        },
                    ],
                    dynamic_template_data: {
                        userName: user.fullName,
                        verificationURL: `${process.env.WEBSITE_URL}/forgotPassword/${token}`,
                    },
                    subject: "Instructions for changing your WatchYaari Account password.",
                },
            ],
            template_id: "d-50e759883aa34b3aa25332015f56888a",
        };
        EmailService.sendEmail(emailBody);

        await User.findByIdAndUpdate({ _id: user._id }, { $set: { passwordResetCode: token } });
        return resolve("Ok");
    });
}
