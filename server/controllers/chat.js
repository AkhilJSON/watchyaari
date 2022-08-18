// packages
const mongoose = require("mongoose");
const _ = require("lodash");

// models
var Chat = require("../models/common/chat");

// helpers
var Helper = require("./helper");

exports.getChatHistory = async function (req, res) {
    try {
        let body = req.body;

        if (!body.partyId) {
            return res.json({
                Success: false,
                Message: "party id is required",
            });
        }

        let chatHistory = await Chat.find(
            { partyId: mongoose.Types.ObjectId(body.partyId) },
            "message userName cAt userId"
        )
            .sort({ cAt: -1 })
            .skip(body.skip || 0);
        // .limit(body.limit || 10)

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: chatHistory,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
};
