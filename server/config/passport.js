// packages
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import mongoose from "mongoose";
import _ from "lodash";

// models
import User from "../models/common/user.js";

// Setup work and export for the JWT passport strategy
export default function (passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
    opts.secretOrKey = process.env.SECRET_KEY;

    passport.use(
        "user",
        new JwtStrategy(opts, function (jwt_payload, done) {
            let id = jwt_payload._id;
            User.findOne({ _id: mongoose.Types.ObjectId(id) }, async function (err, user) {
                if (err || !user) {
                    return done(err, false);
                }
                user = _.pick(user, [
                    "_id",
                    "fullName",
                    "email",
                    "emailVerified",
                    "emailVerificationCode",
                    "mobileVerified",
                    "isAdmin",
                ]);
                if (user) {
                    if (user.emailVerificationCode) {
                        user.emailVerificationSent = true;
                    } else {
                        user.emailVerificationSent = false;
                    }
                    delete user.emailVerificationCode;
                    done(null, user);
                }
            });
        })
    );
}
