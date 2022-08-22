// packages
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import _ from "lodash";

// models
import UserRepository from "../models/common/user.js";

// Setup work and export for the JWT passport strategy
export default function (passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
    opts.secretOrKey = process.env.SECRET_KEY;

    passport.use(
        "user",
        new JwtStrategy(opts, async function (jwt_payload, done) {
            let entityId = jwt_payload.entityId,
                user = await UserRepository.fetch(entityId);

            if (!user) {
                return done(err, false);
            }

            user = _.pick(user, [
                "entityId",
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
        })
    );
}
