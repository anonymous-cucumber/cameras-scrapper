const { getSourceCamWithStrongestType } = require("./camerasComputeInfos");

async function mergeCameras(computedInfos, fileSource, currentDate, nearCamera) {
    nearCamera.infos[fileSource] = computedInfos;

    const [strongestSource, strongestType] = await getSourceCamWithStrongestType(nearCamera.infos._doc);
    const strongestInfos = nearCamera.infos[strongestSource];

    nearCamera.updatedAt = currentDate;                        
    nearCamera.scrappedAt = strongestInfos.scrappedAt;
    nearCamera.source = strongestSource;
    nearCamera.lat = strongestInfos.lat;
    nearCamera.lon = strongestInfos.lon;
    nearCamera.infos.type = strongestType;
    
    return nearCamera.save();
}

module.exports = mergeCameras;