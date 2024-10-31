const express = require("express");
const Camera = require("./models/Camera");
const getSearchBBoxes = require("./libs/getSearchBBoxes");
const parseQueries = require("./libs/parseQueries");
const promiseConcurrency = require("./libs/promiseConcurrency");

const app = express();

app.use(express.static('public'));


const pixelPartSize = 100;
const showCamerasLimit = 20;
app.get("/api/cameras", async (req,res) => {
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
                return cameras.map(camera => ({...camera._doc, type: "camera"}))
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

app.listen(process.env.HTTP_SERVER_PORT ?? 8000, () => {console.log("server started on "+(process.env.HTTP_SERVER_PORT ?? 8000))})