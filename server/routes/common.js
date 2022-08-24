// packages
import { Router } from "express";
import passport from "passport";

// controllers
import {
    userRegistration,
    userAuthentication,
    forgotPassword,
    resetPassword,
    verifyResetPasswordLink,
    getUserDetails,
    getPartyDetails,
} from "../controllers/common/userLoginAuth.js";
import { getChatHistory } from "../controllers/chat.js";
import {
    joinParty,
    getRecentPartyList,
    togglePartyPrivacy,
    fetchUsers,
    fetchBlockedUsers,
    unBlockUsers,
    updateCoHosts,
    launchParty,
    updateVideoInTheParty,
    inviteGuestsInTheParty,
    searchVideos,
    trendVideos,
} from "../controllers/party.js";

import * as Migrations from "../migrations/restoreData.js";

var router = Router();

// User signup
router.post("/userRegistration", userRegistration);

// User signin
router.post("/userAuthentication", userAuthentication);

// To restored application default data
router.get("/restoreData", Migrations.restoreData);

// router.post("/createUserManually", createUserManually);

router.post("/forgotPassword", forgotPassword);

router.post("/resetPassword", resetPassword);

router.post("/resetPasswordLink", verifyResetPasswordLink);

router.post(
    "/getPartyDetails",
    passport.authenticate("user", {
        session: false,
    }),
    getPartyDetails
);

router.post(
    "/getUserDetails",
    passport.authenticate("user", {
        session: false,
    }),
    getUserDetails
);

router.post(
    "/getChatHistory",
    passport.authenticate("user", {
        session: false,
    }),
    getChatHistory
);

router.post(
    "/joinParty",
    passport.authenticate("user", {
        session: false,
    }),
    joinParty
);

router.post(
    "/getRPrtyList",
    passport.authenticate("user", {
        session: false,
    }),
    getRecentPartyList
);

router.post(
    "/tglePrtPrvcy",
    passport.authenticate("user", {
        session: false,
    }),
    togglePartyPrivacy
);

router.post(
    "/fetchUsrs",
    passport.authenticate("user", {
        session: false,
    }),
    fetchUsers
);

router.post(
    "/fetchBlckdUsrs",
    passport.authenticate("user", {
        session: false,
    }),
    fetchBlockedUsers
);

router.post(
    "/unBlckUsrs",
    passport.authenticate("user", {
        session: false,
    }),
    unBlockUsers
);

router.post(
    "/updCohs",
    passport.authenticate("user", {
        session: false,
    }),
    updateCoHosts
);

router.post(
    "/launchParty",
    passport.authenticate("user", {
        session: false,
    }),
    launchParty
);

router.post(
    "/updateVideoInTheParty",
    passport.authenticate("user", {
        session: false,
    }),
    updateVideoInTheParty
);

router.post(
    "/inviteGuestsInTheParty",
    passport.authenticate("user", {
        session: false,
    }),
    inviteGuestsInTheParty
);

router.post("/serchVids", searchVideos);
router.post("/trendVids", trendVideos);

export default router;
