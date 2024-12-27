const getIntValidator = (mandatory, min, max) => (value) => {
    if (mandatory && value === undefined) return "error";

    value = parseInt(value);
    if (isNaN(value) || (min !== undefined && value < min) || (max !== undefined && value > max)) return "error"
    return value
}

const getBboxValidator = (mandatory) => (bbox) => {
    if (bbox === undefined) 
        return mandatory ? "error" : undefined;

    const splittedBbox = bbox.split(",");
    if (splittedBbox.length !== 4) return "error";

    const computedBbox = splittedBbox.map(v => parseFloat(v.trim()));
    if (computedBbox.find(v => isNaN(v))) return "error";

    const [lon1,lat1,lon2,lat2] = computedBbox;

    if (lon1 > lon2 || lat1 > lat2) return "error";

    return computedBbox;
}

const APIValidators = {
    getCameras: {
        bbox: getBboxValidator(true),
        prevBbox: getBboxValidator(false),
        zoom: getIntValidator(true, 0, 19),
        doGetAllCameras: (value) => value === "true",
        coordinatesSources: async (value) => (value instanceof Array || value === undefined) ? value : "error",
        infosSources: async (value) => (value instanceof Array || value === undefined) ? value : "error",
        types: (value) => (value instanceof Array || value === undefined) ? value : "error"
    },
    exportCameras: {
        rows: getIntValidator(true, 1),
        page: getIntValidator(true, 0)
    }
}

module.exports = APIValidators;