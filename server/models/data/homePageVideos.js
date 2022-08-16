// Schema of Home page videos

"use strict";
var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var mongoose = require('mongoose');
var homePageVideosSchema = new mongoose.Schema({
    data: {
        type: String
    },
    isDeleted: {
        type: Boolean
    }
}, { versionKey: false });



var HomePageVideo = mongoose.model('HomePageVideo', homePageVideosSchema);
module.exports = HomePageVideo;