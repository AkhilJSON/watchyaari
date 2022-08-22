// packages
import express from "express";
var router = express.Router();

// Get Homepage
router.get("/", function (req, res) {
    res.render("index", { layout: null });
});

export default router;
