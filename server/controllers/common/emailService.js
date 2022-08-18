exports.sendEmail = async function (data) {
    try {
        const superagent = require("superagent");

        let url = `https://api.sendgrid.com/v3/mail/send`;
        await superagent
            .post(url)
            .send(data)
            .set("Authorization", `Bearer ${process.env.SENDGRID_API_KEY}`)
            .set("Content-Type", "application/json")
            .end((err, response) => {
                if (err) {
                    return console.log("######", err);
                }
            })
            .on("error", (err) => {
                Helper.catchException(JSON.stringify(e), err.message);
            });
    } catch (e) {
        // Helper.catchException(JSON.stringify(e), res)
    }
};
