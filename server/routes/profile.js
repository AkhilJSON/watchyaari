// packages
var express = require("express");
var passport = require("passport");

// controllers
var profileController = require("../controllers/profile");
var userLoginAuthController = require("../controllers/common/userLoginAuth");

var router = express.Router();

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
