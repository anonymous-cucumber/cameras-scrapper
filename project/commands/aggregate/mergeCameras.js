const { getSourceCamWithStrongestType } = require("./camerasComputeInfos");

function mergeCameras(computedInfos, fileSource, currentDate, nearCamera) {
    nearCamera.infos[fileSource] = computedInfos;

    const [strongestSource, strongestType] = getSourceCamWithStrongestType(nearCamera.infos);
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