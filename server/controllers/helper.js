// packages
import _ from "lodash";
import nLog from "noogger";
import bcrypt from "bcryptjs";

// models
import GuestRepository from "../models/common/guest.js";
import UserRepository from "../models/common/user.js";

function catchException(exception, res) {
    console.log("e::", JSON.stringify(exception));
    nLog.error(JSON.stringify(exception));
    return res.json({
        Success: false,
        Message: "exception",
        Reason: exception,
    });
}

function checkIfExists(array, key, value) {
    if (_.isArray(array)) {
        let index = _.findIndex(array, function (o) {
            return o[key] == value;
        });
        return index >= 0 ? true : false;
    }
    return false;
}

/**
 * Generates encrypted code
 * @param {String} code
 * @returns {String} encrypted code
 */
async function generateEncryptedCode(code) {
    try {
        const salt = await bcrypt.genSalt(10);
        const encryptedCode = await bcrypt.hash(code, salt);
        return encryptedCode;
    } catch (error) {
        return null;
    }
}

/**
 * Compares given code with encrypted code
 * @param {String} code
 * @param {String} encryptedCode
 * @returns {Boolean} isMatch
 */
async function compareEncryptedCode(code, encryptedCode) {
    try {
        const isMatch = await bcrypt.compare(code, encryptedCode);
        return isMatch;
    } catch (error) {
        return false;
    }
}

/**
 * Returns populated party data
 * @param {*} partyDetails
 * @returns populated party data
 */
async function populateGuestDataOfParty(partyDetails) {
    try {
        partyDetails = partyDetails.toJSON();

        for(let i=0; i<partyDetails?.guests?.length; i++){
            // populate Guest
            let guest = partyDetails?.guests?.[i],
            guestDetails = await GuestRepository.fetch(guest);
            guestDetails = guestDetails.toJSON();

            // populate User
            if (guestDetails?.userId) {
                guestDetails.userId = await UserRepository.fetch(guestDetails?.userId);
            }

            partyDetails.guests[i] = guestDetails;
        }

        return partyDetails;
    } catch (error) {
        return null;
    }
}

export default {
    catchException,
    checkIfExists,
    generateEncryptedCode,
    compareEncryptedCode,
    populateGuestDataOfParty,
};
