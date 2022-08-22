// packages
import { Router } from "express";
import passport from "passport";

// controllers
import { updateProfile, fetchProfile } from "../controllers/profile.js";
// import { verifyMyEmail } from "../controllers/common/userLoginAuth.js";

var router = Router();

router.post(
    "/updateProfile",
    passport.authenticate("user", {
        session: false,
    }),
    updateProfile
);

router.get(
    "/fetchProfile",
    passport.authenticate("user", {
        session: false,
    }),
    fetchProfile
);

/* router.get(
    "/verifyMyEmail",
    passport.authenticate("user", {
        session: false,
    }),
    verifyMyEmail
); */

export default router;
