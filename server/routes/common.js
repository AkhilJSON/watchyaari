// packages
import { Router } from "express";
import passport from "passport";

// controllers
import { userRegistration, userAuthentication } from "../controllers/common/userLoginAuth.js";
import { getChatHistory } from "../controllers/chat.js";
import {
    joinParty,
    getRecentPartyList,
    getUpcomingPartyList,
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

var router = Router();

router.post("/userRegistration", userRegistration);

router.post("/userAuthentication", userAuthentication);

/* router.post("/createUserManually", commonController.createUserManually);


router.post("/verifyUserEmail", commonController.verifyUserEmail);

router.post("/forgotPassword", commonController.forgotPassword);

router.post("/resetPassword", commonController.resetPassword);

router.post("/resetPasswordLink", commonController.verifyResetPasswordLink);

router.post(
    "/getPartyDetails",
    passport.passport.authenticate("user", {
        session: false,
    }),
    commonController.getPartyDetails
);

router.post(
    "/getUserDetails",
    passport.passport.authenticate("user", {
        session: false,
    }),
    commonController.getUserDetails
); */

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
    "/getUPrtyList",
    passport.authenticate("user", {
        session: false,
    }),
    getUpcomingPartyList
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
