function getCameraType(camera) {
    return camera?.infos?.op_type ?? "public"
}

module.exports = getCameraType