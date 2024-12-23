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

const {REMOTE_PROJECT, CLIENT_SIDE_ADMIN_API_TOKEN} = process.env;

const Authorization = "Basic "+Buffer.from(`admin:${CLIENT_SIDE_ADMIN_API_TOKEN}`).toString('base64')

async function getRemoteTotalCameras() {
    const {code, data} = await request(`${REMOTE_PROJECT}/api/admin/dump/total`, {
        getCode: true,
        headers: { Authorization }
    });

    if (code === 401)
        throw new Error("Access to remote project failed, please check you API key");
    
    return {code, data: code === 200 ? JSON.parse(data) : data}
}
async function getRemoteCameras(rows, page) {
    const {code, data} = await request(`${REMOTE_PROJECT}/api/admin/dump/export?rows=${rows}&page=${page}`, {
        getCode: true,
        headers: { Authorization }
    });

    if (code === 401)
        throw new Error("Access to remote project failed, please check you API key");
    
    return {code, data: code === 200 ? JSON.parse(data): data}
}

async function exportRemoteCameras(partSize, callback) {
    const {data: {total: totalCameras}} = await getRemoteTotalCameras();;
    
    let page = 0;
    while (page*partSize < totalCameras) {
        const {data: cameras} = await getRemoteCameras(partSize, page);

        page += 1;
        await callback(cameras, page*partSize, totalCameras);
    }
}

module.exports = {exportLocalCameras, exportRemoteCameras};