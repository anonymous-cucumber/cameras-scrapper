const Camera = require("../models/Camera");
const request = require("./request");

async function exportLocalCameras(partSize = null, callback = null) {
    if (partSize && !callback)
        throw new Error("You have to mention a callback when asking the function to export cameras in many parts");

    if (partSize === null)
        return Camera.find({});

    const totalCameras = await Camera.countDocuments({});

    let skip = 0;
    while (skip < totalCameras) {
        const cameras = await Camera.find({}).limit(partSize).skip(skip);
        skip = Math.min(skip+partSize, totalCameras);
        await callback(cameras, skip, totalCameras);
    }
}

const {REMOTE_PROJECT, REMOTE_ADMIN_API_TOKEN} = process.env;

const Authorization = "Basic "+Buffer.from(`admin:${REMOTE_ADMIN_API_TOKEN}`).toString('base64')

async function getRemoteTotalCameras() {
    const {code, data} = await request(`${REMOTE_PROJECT}/api/admin/dump/total`, {
        getCode: true,
        headers: { Authorization }
    });
    
    return {code, data: code === 200 ? JSON.parse(data): data}
}
async function getRemoteCameras() {
    const {code, data} = await request(`${REMOTE_PROJECT}/api/admin/dump/total`, {
        getCode: true,
        headers: { Authorization }
    });
    
    return {code, data: code === 200 ? JSON.parse(data): data}
}

async function exportRemoteCameras(partSize, callback) {
    const {code, data} = await getRemoteTotalCameras();
    if (code === 401)
        throw "Access to remote project failed, please check you API key"
    
    const {total: totalCameras} = data;
    
    
    let skip = 0;
    while (skip < totalCameras) {
        const {code, data} = await Camera.find({}).limit(partSize).skip(skip);
        skip = Math.min(skip+partSize, totalCameras);
        await callback(cameras, skip, totalCameras);
    }
}

module.exports = {exportLocalCameras, exportRemoteCameras};