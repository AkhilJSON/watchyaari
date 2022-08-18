var express = require("express");
var router = express.Router();
var passport = require("passport");

var commonController = require("../controllers/common/userLoginAuth");
var chatController = require("../controllers/chat");
var partyController = require("../controllers/party");

router.post("/userRegistration", commonController.userRegistration);

router.post("/createUserManually", commonController.createUserManually);

router.post("/userAuthentication", commonController.userAuthentication);

router.post("/verifyUserEmail", commonController.verifyUserEmail);

router.post("/forgotPassword", commonController.forgotPassword);

router.post("/resetPassword", commonController.resetPassword);

router.post("/resetPasswordLink", commonController.verifyResetPasswordLink);

router.post(
    "/getPartyDetails",
    passport.authenticate("user", {
        session: false,
    }),
    commonController.getPartyDetails
);

router.post(
    "/getUserDetails",
    passport.authenticate("user", {
        session: false,
    }),
    commonController.getUserDetails
);

router.post(
    "/getChatHistory",
    passport.authenticate("user", {
        session: false,
    }),
    chatController.getChatHistory
);

router.post(
    "/joinParty",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.joinParty
);

router.post(
    "/getRPrtyList",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.getRecentPartyList
);

router.post(
    "/getUPrtyList",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.getUpcomingPartyList
);

router.post(
    "/tglePrtPrvcy",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.togglePartyPrivacy
);

router.post(
    "/fetchUsrs",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.fetchUsers
);

router.post(
    "/fetchBlckdUsrs",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.fetchBlockedUsers
);

router.post(
    "/unBlckUsrs",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.unBlockUsers
);

router.post(
    "/updCohs",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.updateCoHosts
);

router.post(
    "/launchParty",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.launchParty
);

router.post(
    "/updateVideoInTheParty",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.updateVideoInTheParty
);

router.post(
    "/inviteGuestsInTheParty",
    passport.authenticate("user", {
        session: false,
    }),
    partyController.inviteGuestsInTheParty
);

router.post("/serchVids", partyController.searchVideos);
router.post("/trendVids", partyController.trendVideos);

module.exports = router;
