var express = require("express");
var router = express.Router();
var passport = require("passport");

var profileController = require("../controllers/profile");
var userLoginAuthController = require("../controllers/common/userLoginAuth");

router.post(
    "/updateProfile",
    passport.authenticate("user", {
        session: false,
    }),
    profileController.updateProfile
);

router.get(
    "/fetchProfile",
    passport.authenticate("user", {
        session: false,
    }),
    profileController.fetchProfile
);

router.get(
    "/verifyMyEmail",
    passport.authenticate("user", {
        session: false,
    }),
    userLoginAuthController.verifyMyEmail
);

module.exports = router;
