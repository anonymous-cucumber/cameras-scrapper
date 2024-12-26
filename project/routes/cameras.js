const express = require("express");
const router = express.Router();
const Camera = require("../models/Camera");
const getSearchBBoxes = require("../libs/getSearchBBoxes");
const parseQueries = require("../libs/parseQueries");
const promiseConcurrency = require("../libs/promiseConcurrency");

const pixelPartSize = 100;
const showCamerasLimit = 20;

router.get("/:id", async (req, res) => {
    let camera = null;

    try {
        camera = await Camera.findById(req.params.id);
    } catch (e) {
        if (e.name === "CastError")
            return res.sendStatus(404)
        
        console.log(e);
        return res.sendStatus(500)
    }

    if (camera === null)
        return res.sendStatus(404);

    res.json(camera)
});

router.get("/", async (req,res) => {
    const parsedQueries = await parseQueries(req.query,"getCameras");
    if (parsedQueries === null)
        return res.sendStatus(400);


    const {bbox: [lon1,lat1,lon2,lat2], width, height, doGetAllCameras, coordinatesSources, infosSources, types} = parsedQueries;

    const degHeight = lat2-lat1;
    const degWidth = lon2-lon1;

    const verticalPartSize = degHeight/(height/pixelPartSize);
    const horizontalPartSize = degWidth/(width/pixelPartSize);

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

    promiseConcurrency(
        getSearchBBoxes({lon1,lat1,lon2,lat2},verticalPartSize,horizontalPartSize)
            .map(({lat1,lon1,lat2,lon2}) => async () => {
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
            res.json(
                results
                .filter(result => result !== null)
                .reduce((acc,result) => {
                    if (result instanceof Array)
                        return acc.concat(result);
                    acc.push(result);
                    return acc;
                }, [])
            )
        )
})

module.exports = router;