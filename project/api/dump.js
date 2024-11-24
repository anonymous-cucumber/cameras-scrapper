const express = require("express");
const router = express.Router();
const parseQueries = require("../libs/parseQueries");
const Camera = require("../models/Camera");


router.get("/export", async (req, res) => {
    const parsedQueries = await parseQueries(req.query,"exportCameras");
    if (parsedQueries === null)
        return res.sendStatus(400);

    const {rows, page} = parsedQueries;


    const cameras = await Camera.find({}).limit(rows).skip(page*rows);
    res.json(cameras);
});


module.exports = router;