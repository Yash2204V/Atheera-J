const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");

router.get("/", authMiddleware, (req,res) => {
    res.render("account");
})

router.get("/customer-care", (req,res) => {
    res.render("customer-care");
})

router.get("/recently", (req,res) => {
    res.render("recently-viewed");
})

router.get("/terms", (req,res) => {
    res.render("terms");
})

router.get("/promotion", (req,res) => {
    res.render("promotional-terms");
})

router.get("/returns", (req,res) => {
    res.render("returns-refund");
})

router.get("/whoweare", (req,res) => {
    res.render("who-we-are");
})

module.exports = router;