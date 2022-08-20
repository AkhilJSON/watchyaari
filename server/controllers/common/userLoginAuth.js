// packages
import jwt from "jsonwebtoken";
import _ from "lodash";
import randomstring from "randomstring";
import jwtDecode from "jwt-decode";
import nLog from "noogger";
import mongoose from "mongoose";

// models
import UserRepository from "../../models/common/user.js";
import PartyRepository from "../../models/common/party.js";
import Guest from "../../models/common/guest.js";

// services
import * as EmailService from "../../controllers/common/emailService.js";

// helpers
import Helper from "../helper.js";
import GuestRepository from "../../models/common/guest.js";

/**
 *
 * @param {*} req
 * @param {*} req.body
 * @param {String} req.body.email
 * @param {String} req.body.password
 * @param {String} req.body.fullName
 * @param {*} res
 * @returns JWT token
 */
export async function userRegistration(req, res) {
    try {
        let Body = req?.body;
        createUserValidations(Body, res);

        Body.email = Body?.email?.trim()?.toLowerCase();
        Body.password = Body?.password?.trim();

        let userCheck =
            (await UserRepository.search()
                .where("email")
                .equals(Body.email)
                .and("isDeleted")
                .is.not.equal(true)
                .return.count()) || 0;

        if (userCheck) {
            return res.json({
                Success: false,
                Message: "email already exists",
            });
        }

        // Encrypt user password
        const encryptedPassword = await Helper.generateEncryptedCode(Body.password);

        if (!encryptedPassword) {
            return res.json({
                Success: false,
                Message: "invalid password",
            });
        }

        let userData = {
            email: Body.email,
            password: encryptedPassword,
            fullName: Body.fullName,
            isDeleted: false,
            createdOn: Date.now(),
            modifiedOn: Date.now(),
            status: "ADDED",
        };

        // saves user data in the db
        userData = await UserRepository.createAndSave(userData);

        // creates JWT token and send to the client
        const loginToken = prepareJWTToken(userData);

        nLog.info(`${userData?.entityId} Registered successfully`);

        res.json({
            Success: true,
            Message: "Registered successfully",
            Token: loginToken,
            uid: userData?.entityId,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

/**
 *
 * @param {*} req
 * @param {*} req.body
 * @param {String} req.body.email
 * @param {String} req.body.password
 * @param {*} res
 * @returns
 */
export async function userAuthentication(req, res) {
    try {
        let Body = req.body;

        Body.email = Body?.email?.trim()?.toLowerCase();
        Body.password = Body?.password?.trim();

        if (!Body?.email?.length) {
            return res.json({
                Success: false,
                Message: "email should not be empty",
            });
        }

        if (!Body?.password?.length) {
            return res.json({
                Success: false,
                Message: "password should not be empty",
            });
        }

        let userData = await UserRepository.search()
            .where("email")
            .equals(Body.email)
            .and("isDeleted")
            .is.not.equal(true)
            .returnFirst();

        if (userData?.entityId) {
            if (userData?.status === "INACTIVE") {
                return res.json({
                    Success: false,
                    Message: "Your Account is DeActivated",
                });
            }

            // Verify user entered password
            const isPasswordMatched = await Helper.compareEncryptedCode(req?.body?.password, userData?.password);

            if (isPasswordMatched) {
                // creates JWT token and send to the client
                const loginToken = prepareJWTToken(userData);

                nLog.info(`${userData.entityId} Authenticated successfuly`);
                res.json({
                    Success: true,
                    Message: "Ok",
                    Token: loginToken,
                    uid: userData.entityId,
                });
            } else {
                return res.json({
                    Success: false,
                    Message: "passwords did not match",
                });
            }
        } else {
            return res.json({
                Success: false,
                Message: "cannot find user",
            });
        }
    } catch (e) {
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function verifyMyEmail(req, res) {
    await sendEmailVerificationLinkToUser(req.user);
    return res.json({
        Success: true,
        Message: "Sent",
    });
}

export async function forgotPassword(req, res) {
    try {
        let body = req.body;

        body.email = body?.email?.trim()?.toLowerCase();
        body.password = body?.password?.trim();

        let user = await UserRepository.search()
            .where("email")
            .equals(body.email)
            .and("isDeleted")
            .is.not.equal(true)
            .returnFirst();

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

        nLog.info(`${user.entityId} Forgot password requested`);
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
}

export async function resetPassword(req, res) {
    try {
        let body = req.body;

        let user = await UserRepository.fetch(body.uid);

        if (!user?.entityId) {
            return res.json({
                Success: false,
                Message: "User not Found",
            });
        }

        if (user.passwordResetCode) {
            const encryptedPassword = await Helper.generateEncryptedCode(body.password);

            user.passwordResetCode = "";
            user.password = encryptedPassword;

            await UserRepository.save(user);

            nLog.info(`${user.entityId} reset successfully`);
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
    } catch (e) {
        return res.json({
            Success: false,
            Message: "Invalid verification token",
        });
    }
}

export async function verifyResetPasswordLink(req, res) {
    try {
        let body = req.body;
        let token = body.token || null;

        if (!token) {
            return res.json({
                Success: false,
                Message: "Invalid verification token",
            });
        }

        let decoded = jwtDecode(token),
            user = await UserRepository.fetch(decoded.entityId);

        if (!user?.entityId) {
            return res.json({
                Success: false,
                Message: "User not Found",
            });
        }

        if (user.passwordResetCode) {
            nLog.info(`${user.entityId} password reset successfully`);

            return res.json({
                Success: true,
                Message: "Ok",
                uid: user.entityId,
            });
        } else {
            return res.json({
                Success: false,
                Message: "Invalid request",
            });
        }
    } catch (e) {
        return res.json({
            Success: false,
            Message: "Invalid verification token",
        });
    }
}

export async function verifyUserEmail(req, res) {
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
        User.findOne({ entityId: mongoose.Types.ObjectId(decoded.entityId) }, async function (err, user) {
            if (err) {
                return res.json({
                    Success: false,
                    Message: "User not Found",
                });
            }
            if (user) {
                if (!user.emailVerified) {
                    await User.findByIdAndUpdate(
                        { entityId: user.entityId },
                        {
                            $set: {
                                emailVerified: true,
                                emailVerifiedOn: new Date().getTime(),
                                emailVerificationCode: "",
                            },
                        }
                    );

                    nLog.info(`${user.entityId} verified user email`);
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
}

export async function createUserManually(req, res) {
    try {
        let Body = req.body;
        createUserValidations(Body, res);

        // Body['createdBy'] = req.user.entityId;
        // Body['modifiedBy'] = req.user.entityId;

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
}

export async function getPartyDetails(req, res) {
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

        let partyData = await PartyRepository.fetch(body.partyId)
        partyData = await Helper.populateGuestDataOfParty(partyData);

        if (!partyData) {
            return res.json({
                Success: false,
                message: "Party Not Found",
                code: 404,
            });
        }

        partyData = JSON.parse(JSON.stringify(partyData));

        if (partyData.hostedBy == user.entityId) {
            partyData.isHost = true;
        }
        if (partyData) {
            nLog.info(`${partyData.entityId} partyDetails requested`);

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
}

export async function createGuestWithPartyId(guestData) {
    return createGuest(guestData);
}

export const getVideoIdByURL = function (domain, videoURL) {
    return getVideoId(domain, videoURL);
};

export const verifyUser = function (token) {
    return new Promise((resolve, reject) => {
        var decoded = jwtDecode(token);
        User.findOne({ entityId: mongoose.Types.ObjectId(decoded.entityId) }, async function (err, user) {
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

export async function getUserDetails(req, res) {
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
}

/**
 * Generates JWT token
 * @param {*} userData
 * @returns
 */
function prepareJWTToken(userData) {
    const userObj = _.pick(userData, [
            "entityId",
            "email",
            "fullName",
            "mobile",
            "createdOn",
            "status",
            "emailVerified",
            "phoneVerified",
        ]),
        token = giveAuthTokenForLoggedInUser(userObj);

    return `JWT ${token}`;
}

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

/**
 * returns Guest data, creates if doesn't exists
 * @param {*} data
 * @param {*} res
 * @returns
 */
function createGuest(data, res) {
    return new Promise(async (resolve, reject) => {
        if (!data.entityId || !data.partyId) {
            resolve(null);
            return;
        }

        let guestData = await GuestRepository.search()
            .where("partyId")
            .equals(data.partyId)
            .and("userId")
            .equals(data.entityId)
            .returnFirst();

        // Return existing
        if (guestData && guestData.entityId) {
            guestData = JSON.parse(JSON.stringify(guestData));
            guestData.alreadyJoined = true;
            resolve(guestData);
            return;
        }

        // Create new Guest
        guestData = {};
        guestData.partyId = data.partyId;
        guestData.userId = data.entityId;
        await GuestRepository.createAndSave(guestData);

        resolve(guestData);
    });
}

function sendEmailVerificationLinkToUser(user) {
    return new Promise(async (resolve, reject) => {
        let token = generateTokenForEmailVerification({ entityId: user.entityId });
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

        await User.findByIdAndUpdate({ entityId: user.entityId }, { $set: { emailVerificationCode: token } });

        nLog.info(`userId: ${user.entityId} Email sent`);
        return resolve("Ok");
    });
}

function sendForgotPasswordLink(user) {
    return new Promise(async (resolve, reject) => {
        let token = generateTokenForEmailVerification({ entityId: user.entityId });
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

        let userData = await UserRepository.fetch(user?.entityId);
        userData.passwordResetCode = token;
        await UserRepository.save(userData);
        return resolve("Ok");
    });
}
