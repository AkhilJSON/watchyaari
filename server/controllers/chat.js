// packages
import _ from "lodash";

// models
import ChatRepository from "../models/common/chat.js";

// helpers
import Helper from "./helper.js";

/**
 * Returns chat history of a specific party
 * @param {*} req
 * @param {String} req.body.partyId
 * @param {*} res
 * @returns Chat history
 */
export async function getChatHistory(req, res) {
    try {
        let body = req.body;

        if (!body.partyId) {
            return res.json({
                Success: false,
                Message: "party id is required",
            });
        }

        let chatHistory = await ChatRepository.search()
            .where("partyId")
            .is.equalTo(body?.partyId)
            .sortBy("cAt", "DESC")
            .returnAll();

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
}
