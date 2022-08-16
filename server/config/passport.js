const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../models/common/user');

const mongoose = require('mongoose');
const _ = require("lodash");

// Setup work and export for the JWT passport strategy
module.exports = function(passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = process.env.SECRET_KEY;

    passport.use('user', new JwtStrategy(opts, function(jwt_payload, done) {
        let id = jwt_payload._id;
        User.findOne({ _id: mongoose.Types.ObjectId(id) }, async function(err, user) {
            if (err || !user) {
                return done(err, false);
            }
            user = _.pick(user, ['_id', 'fullName', 'email', 'emailVerified', 'emailVerificationCode', 'mobileVerified', 'isAdmin'])
            if (user) {
                if(user.emailVerificationCode){
                    user.emailVerificationSent = true;
                }else{
                    user.emailVerificationSent = false;
                }
                delete user.emailVerificationCode;
                done(null, user);
            }
        });
    }));
};