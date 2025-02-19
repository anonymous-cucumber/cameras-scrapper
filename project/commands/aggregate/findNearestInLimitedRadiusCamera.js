const Camera = require("../../models/Camera");
const { destinationPointLat, destinationPointLon, calcDistanceBetween } = require("../../libs/convertCoordinates");

const publicRadius = 10; // 10 metters;
const minRadius = 3 // 3 metters

function getCoordinatesQueryByRadius(lat, lon, radius) {
    const minLat = destinationPointLat(lat, true, radius);
    const maxLat = destinationPointLat(lat, false, radius);
    const minLon = destinationPointLon(lat,lon,false, radius);
    const maxLon = destinationPointLon(lat,lon,true, radius);

    return {
        lat: {$gte: minLat, $lte: maxLat},
        lon: {$gte: minLon, $lte: maxLon}
    }
}

// si private => min radius plus proche private ou unknown
// si unknown => min radius plus proche de tout type
// si public ou official => min radius plus proche unknown ou max radius plus proche publique/official
function getNearCameraQuery(type, lat, lon) {
    if (["public", "official"].includes(type)){
        return {
            $or: [
                {
                    "infos.type": {$in: ["public", "official"]},
                    ...getCoordinatesQueryByRadius(lat, lon, publicRadius)
                },
                {
                    "infos.type": "unknown",
                    ...getCoordinatesQueryByRadius(lat, lon, minRadius)
                }
            ]
         }
    }

    if (type === "private") {
        return {
            "infos.type": ["private", "unknown"],
            ...getCoordinatesQueryByRadius(lat, lon, minRadius)
        }
    }

    if (type === "unknown") {
        return getCoordinatesQueryByRadius(lat, lon, minRadius)
    }

    throw new Error(`Error when searching near camera during aggregation : this type "${type}" is invalid`);
}

async function findNearestInLimitedRadiusCamera(type, lat, lon) {
    const query = getNearCameraQuery(type, lat, lon);

    const cameras = await Camera.find(query)

    return cameras
        .reduce(
            ({nearest, shorterDistance}, camera) => {
                const distance = calcDistanceBetween(lat, lon, camera.lat, camera.lon)
                if (shorterDistance === null || distance < shorterDistance)
                    return {
                        nearest: camera,
                        shorterDistance: distance
                    };
                return {nearest, shorterDistance}
            }, 
            {nearest: null, shorterDistance: null}
        ).nearest
}

module.exports = findNearestInLimitedRadiusCamera;