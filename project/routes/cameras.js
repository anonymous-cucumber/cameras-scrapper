const express = require("express");
const router = express.Router();
const Camera = require("../models/Camera");
const parseQueries = require("../libs/parseQueries");
const { searchCameras } = require("../libs/camerasSearcher");

router.get("/:id", async (req, res) => {
    let camera = null;

    try {
        camera = await Camera.findById(req.params.id);
    } catch (e) {
        if (e.name === "CastError")
            return res.sendStatus(404)
        
        console.log(e);
        return res.sendStatus(500)
    }

    if (camera === null)
        return res.sendStatus(404);

    res.json(camera)
});

router.get("/", async (req,res) => {
    const parsedQueries = await parseQueries(req.query,"getCameras");
    if (parsedQueries === null)
        return res.sendStatus(400);

    searchCameras(parsedQueries).then(result => res.json(result))
})

module.exports = router;