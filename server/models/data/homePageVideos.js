/* // Schema of Home page videos

"use strict";
// packages
import mongoose, { Schema, model } from "mongoose";
import { promisifyAll } from "bluebird";

promisifyAll(mongoose);

var homePageVideosSchema = new Schema(
    {
        data: {
            type: String,
        },
        isDeleted: {
            type: Boolean,
        },
    },
    { versionKey: false }
);

var HomePageVideo = model("HomePageVideo", homePageVideosSchema); */
const HomePageVideo = {};
export default HomePageVideo;
