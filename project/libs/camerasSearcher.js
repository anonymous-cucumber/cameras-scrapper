const getSearchBBoxes = require("../libs/getSearchBBoxes");
const promiseConcurrency = require("../libs/promiseConcurrency");
const Camera = require("../models/Camera");

const showCamerasLimit = 20;

// Last method to calcul partsize was to divide dimensions of map (in px) by 100, and divide nb degres of height and width by the result :
//   degHeight = lat2-lat1;
//   degWidth = lon2-lon1;
//   verticalPartSize = degHeight/(height/pixelPartSize);
//   horizontalPartSize = degWidth/(width/pixelPartSize);

// This method has a problem, because of the verticalPartSize, for a defined height in px, and zoom, 
// change in function of latitude, because of merkator projection.

// We want a static partsize, horizontal, and vertical, for each zoom, 
// so, for vertical partsize, when make an average of value for each zoom, between the max (at equator) and the min (at the poles). 

function getVerticalPartSizeFromZoom(zoom) {
    if (zoom === 19)
        return 0.00014567552990700142 // avg(0.0002682125174869481, 0.000023138542327054746)
    if (zoom === 18)
        return 0.00029135105977001096 // avg(0.0005364250348823238,0.00004627708465769809)
    if (zoom === 17)
        return 0.0005827021192062646 // avg(0.0010728500690289496, 0.00009255416938357957)
    if (zoom === 16)
        return 0.0011654042341232203 // avg(0.002145700128980466, 0.00018510833926597452)
    if (zoom === 15)
        return 0.002330808453008118 // avg(0.004291400223477616, 0.00037021668253862055)
    if (zoom === 14)
        return 0.00466161673331181 // avg(0.00858280006945712, 0.0007404333971664994)
    if (zoom === 13)
        return 0.009323232084974679 // avg(0.017165597118931, 0.0014808670510183565)
    if (zoom === 12)
        return 0.018646452710076228 // avg(0.03433116926462212, 0.0029617361555303394)
    if (zoom === 11)
        return 0.03729281699526199 // avg(0.06866214525148379,0.005923488739040194)
    if (zoom === 10)
        return 0.07458492660796018 // avg(0.1373227443135104, 0.011847108902409944)
    if (zoom === 9)
        return 0.14916419468528866 // avg(0.2746331201557582, 0.023695269214819133)
    if (zoom === 8)
        return 0.29828324176841126 // avg(0.549167533335405, 0.0473989502014175)
    if (zoom === 7)
        return 0.5962050139007742 // avg(1.097544817487971, 0.09486521031357731)
    if (zoom === 6)
        return 1.1895338418737436 // avg(2.1887982803654884, 0.19026940338199866)
    if (zoom === 5)
        return 2.3566020841181 // avg(4.32833740172214, 0.38486676651405993)
    if (zoom === 4)
        return 4.549097792471465 // avg(8.293325223656781, 0.8048703612861493)
    if (zoom === 3)
        return 8.14330587062053 // avg(14.379763823861255, 1.9068479173798047)
    if (zoom === 2)
        return 13.365892268879422 // avg(20.185650483297966, 6.54613405446088)
    if (zoom === 1)
        return 21.32838982611206 // avg(22.502904289604544, 20.153875362619576)
    if (zoom === 0)
        return 22.716320780196234 // avg(22.725532728701218, 22.70710883169125)
}

// For horizontal parsize, we just have to do that is described bellow, because of it's don't change in function of latitude.
function getPartSizesFromZoom(zoom) {
    return {
        horizontalPartSize: 0.0002682209014895356 * 2**(19-zoom),
        verticalPartSize: getVerticalPartSizeFromZoom(zoom)
    }
}

function searchCameras({bbox: [lon1,lat1,lon2,lat2], prevBbox, zoom, doGetAllCameras, coordinatesSources, infosSources, types}) {
    const {horizontalPartSize, verticalPartSize} = getPartSizesFromZoom(zoom)

    const cameraQuery = {
        lat: null,
        lon: null,
        $and: [
            ...(coordinatesSources ? [{coordinatesSource: {$in: coordinatesSources}}] : []),
            ...(infosSources ? [{$or: infosSources.map(source => ({["infos."+source]: {$exists: true}}))}] : []),
            ...(types ? [{$or: types.map(type => ({["infos.type"]: type}))}] : [])
        ]
    }
    if (cameraQuery.$and.length === 0)
        delete cameraQuery.$and;

    return promiseConcurrency(
        getSearchBBoxes([lon1,lat1,lon2,lat2], verticalPartSize, horizontalPartSize, prevBbox)
            .map(({lat1,lon1,lat2,lon2,zoneId}) => async () => {
                const specificCameraQuery = {
                    ...cameraQuery,
                    lat: {$gte: lat1, $lte: lat2},
                    lon: {$gte: lon1, $lte: lon2}
                }
                const count = await Camera.countDocuments(specificCameraQuery);
                if (count === 0) return null;

                if (count > showCamerasLimit && !doGetAllCameras)
                    return {
                        type: "zone",
                        zoneId, 
                        count,
                        lat: (lat1+lat2)/2,
                        lon: (lon1+lon2)/2,
                        lat1,lon1,lat2,lon2
                    }
                
                let cameras = await Camera.find(specificCameraQuery);
                return cameras.map(camera => ({
                    _id: camera._doc._id,
                    lat: camera._doc.lat,
                    lon: camera._doc.lon,
                    type: "camera",
                    infos: {
                        type: camera._doc.infos.type
                    }
                }))
            }),
        process.env.NB_PARRALLEL_CAMERA_FETCHING ?? 100
    )
    .then(results => 
        results
        .filter(result => result !== null)
        .reduce((acc,result) => {
            if (result instanceof Array)
                return acc.concat(result);
            acc.push(result);
            return acc;
        }, [])
    )
}

module.exports = {searchCameras};
