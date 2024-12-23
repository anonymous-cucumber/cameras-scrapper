const express = require("express");
const router = express.Router();
const Camera = require("../../models/Camera");


router.delete("/cameras", async (req, res) => {
    await Camera.deleteMany({});
    res.sendStatus(204);
})

module.exports = router;