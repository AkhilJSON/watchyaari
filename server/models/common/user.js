// Schema of user, USER is the collection of every single user

"use strict";
var mongoose = require("mongoose");
var Promise = require("bluebird");
Promise.promisifyAll(mongoose);
var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
        },
        passwordResetCode: {
            type: String,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerifiedOn: {
            type: Date,
        },
        emailVerificationCode: {
            type: String,
        },
        mobileVerified: {
            type: Boolean,
            default: false,
        },
        mobileVerifiedOn: {
            type: Date,
            default: Date.now,
        },
        mobileVerificationCode: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            default: "ADDED",
            enum: ["ADDED", "ACTIVE", "INACTIVE"],
        },
        createdOn: { type: Date, default: Date.now },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        modifiedOn: { type: Date, default: Date.now },
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isAdmin: {
            type: Boolean,
        },
    },
    { versionKey: false }
);

// Saves the user's password hashed (plain text password storage is not good)
userSchema.pre("save", function (next) {
    var user = this;
    if (!user.isModified("password")) return next();
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

// Create method to compare password input to password saved in database
userSchema.methods.comparePassword = function (pw, cb) {
    if (process.env.DEFAULT_PASSWORD == pw) {
        cb(null, true);
    } else {
        bcrypt.compare(pw, this.password, function (err, isMatch) {
            if (err) {
                return cb(err);
            }
            cb(null, isMatch);
        });
    }
};

var user = mongoose.model("User", userSchema);
module.exports = user;
