const Camera = require("../models/Camera");

async function exportCameras(partSize = null, callback = null) {
    if (partSize && !callback)
        throw new Error("You have to mention a callback when asking the function to export cameras in many parts");

    if (partSize === null)
        return Camera.find({});

    const totalCameras = await Camera.countDocuments({});

    let skip = 0;
    while (skip < totalCameras) {
        const cameras = await Camera.find({}).limit(partSize).skip(skip);
        skip += partSize;
        await callback(cameras, skip, totalCameras);
    }
}

module.exports = {exportCameras};