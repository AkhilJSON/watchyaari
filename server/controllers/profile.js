var User = require('../models/common/user');

var UserLoginAuth = require('./common/userLoginAuth');

var Helper = require('./helper');

const mongoose = require('mongoose');
var _ = require("lodash");


exports.updateProfile = async function (req, res) {
    try {
        let user = req.user;

        let userData = await User.findById(user._id);
        userData = _.assignIn(userData, req.body);

        await userData.save()
        return res.json({
            Success: true,
            message: 'OK',
            code: 200
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}


exports.fetchProfile = async function (req, res) {
    try {
        let user = req.user;

        return res.json({
            Success: true,
            message: 'OK',
            code: 200,
            data: user
        })
    } catch (e) {
        console.log(e)
        Helper.catchException(JSON.stringify(e), res)
    }
}