// packages
import _ from "lodash";

// models
import UserRepository from "../models/common/user.js";

// helpers
import Helper from "./helper.js";

export async function updateProfile(req, res) {
    try {
        let user = req.user;

        let userData = await UserRepository.fetch(user.entityId);
        userData = _.assignIn(userData, req.body);
        userData.searchableEmail = userData.email;
        userData.searchableFullName = userData.fullName;

        // Handle password change
        if (req.body?.password) {
            const encryptedPassword = await Helper.generateEncryptedCode(req.body?.password);
            userData.password = encryptedPassword;
        }

        await UserRepository.save(userData);

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}

export async function fetchProfile(req, res) {
    try {
        let user = req.user;

        return res.json({
            Success: true,
            message: "OK",
            code: 200,
            data: user,
        });
    } catch (e) {
        console.log(e);
        Helper.catchException(JSON.stringify(e), res);
    }
}
