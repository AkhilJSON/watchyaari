var express = require('express');
var router = express.Router();
var passport = require('passport');

var partyController = require('../controllers/party');

router.post('/addFeedbackQuestion', passport.authenticate('user', {
    session: false
}), partyController.createFeedbackQuestion);

router.post('/getFeedbackQuestions', passport.authenticate('user', {
    session: false
}), partyController.getFeedbackQuestions);

module.exports = router;