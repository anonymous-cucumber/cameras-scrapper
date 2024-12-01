const express = require("express");
const router = express.Router();
const parseQueries = require("../../libs/parseQueries");
const Camera = require("../../models/Camera");

router.get("/total", (req, res) => Camera.countDocuments().then(total => res.json({total})))

router.get("/export", async (req, res) => {
    const parsedQueries = await parseQueries(req.query,"exportCameras");
    if (parsedQueries === null)
        return res.sendStatus(400);

    const {rows, page} = parsedQueries;


    const cameras = await Camera.find({}).limit(rows).skip(page*rows);
    res.json(cameras);
});

router.post("/import", async (req, res) => {
    if (!(req.body instanceof Array))
        return res.sendStatus(400);

    const cameras = req.body;
    await Promise.all(
        cameras.map(async camera => {
            if ((await Camera.countDocuments({_id: camera._id})) === 1)
                await Camera.deleteOne({_id: camera._id});
            return Camera.create(camera)
        })
    )

    res.sendStatus(204)
})

module.exports = router;