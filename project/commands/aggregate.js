const fs = require("fs/promises");
const lazyReadCsv = require("../libs/lazyReadCsv");
const Camera = require("../models/Camera");
const ImportHistory = require("../models/ImportHistory");
const {destinationPointLat, destinationPointLon} = require("../libs/convertCoordinates");
const {question} = require("../libs/ui");
const getAllSources = require("../libs/getAllSources");
const {scrapCsvPath} = require("../paths");
const { dateToDateRangeValidator } = require("../libs/validators/commandValidators");

const publicRadius = 10; // 10 metters;
const privateRadius = 3; // 3 metters;

function getArgs() {
    return {
        sources: async givenSources => {
            const allSources = await getAllSources();
            if ([undefined,"all"].includes(givenSources)) {
                return {success: true, data: allSources}
            }
            const sources = givenSources.split(",");
            for (const source of sources) {
                if (!allSources.includes(source))
                    return {success: false, msg: `The source "${source}" does not exist`};
            }

            return {success: true, data: sources};
        },
        date: dateToDateRangeValidator,
        additionalParams: (additionalParams) => {
            return {success: true, data: additionalParams};
        }
    }
}

async function postArgs(params) {
    const {sources, dateRange: [date, dateB], additionalParams} = params;

    const files = await fs.readdir(scrapCsvPath).then(files =>
        files
            .filter(filename => filename !== ".keep")
            .map(filename => {
                const splittedFilename = filename.split(".csv")[0].split("_");

                const fileSource = splittedFilename[0];
                const filestrDate = splittedFilename[splittedFilename.length-1];
                const fileDate = new Date(filestrDate);
                const fileAdditionalParams = splittedFilename.length === 3 ? splittedFilename[1] : undefined; 

                return {filename, fileSource, fileDate, fileAdditionalParams}
            })
            .filter(({fileSource, fileAdditionalParams, fileDate}) => {
                if (!sources.includes(fileSource))
                    return false;

                if (
                    (additionalParams && additionalParams !== "nothing" && additionalParams !== fileAdditionalParams) || 
                    (additionalParams === "nothing" && fileAdditionalParams)
                )
                    return false;

                if (date === null)
                    return true;

                return fileDate.getTime() >= date.getTime() && fileDate.getTime() < dateB.getTime()
            })    
    )
    if (files.length === 0)
        return {success: false, msg: "Nothing file has been found with your query"}
    return {success: true, params: {...params, files}};
}

function example() {
    return "\nnode console.js aggregate"+
            "\nnode console.js aggregate camerci,parisPoliseArcgis"+
            "\nnode console.js aggregate camerci,parisPoliseArcgis 2024-04-03T12:34:54"+
            "\nnode console.js aggregate all 2024-04"+
            "\nnode console.js aggregate surveillanceUnderSurveillance all paris"+
            "\nnode console.js aggregate all all nothing";
}

const infosFieldsBySource = {
    parisPoliceArcgis: (infos) => ({
        parisPoliceArcgis: {
            adresse: infos.adresse,
            code_postal: infos.code_postal
        },
        type: "public",
        zone: "paris"
    }),
    sousSurveillanceNet: (infos) => ({
        sousSurveillanceNet: {
            zone: infos.zone,
            apparence: infos.apparence,
            direction: infos.direction,
            angle: infos.angle,
            op_type: infos.op_type
        },
        type: infos.op_type,
        zone: infos.zone
    }),
    camerci: (infos) => ({
        camerci: {
            desc: infos
        },
        type: "public"
    }),
    surveillanceUnderSurveillance: (infos) => {
        const camera_direction = parseInt(infos["camera:direction"]);
        return {
            surveillanceUnderSurveillance: {
                description: infos.description,
                camera_direction: isNaN(camera_direction) ? undefined : camera_direction,
                camera_mount: infos["camera:mount"],
                camera_type: infos["camera:type"],
                surveillance: infos.surveillance
            },
            type: infos.surveillance === "public" ? "public" : "private"
        }
    }
};

async function execute({files,sources}) {    
    console.log("Selected sources : ");
    console.log(sources.join(", "));
    console.log("\nCSVs files to aggregate :");
    console.log(files.map(({filename}) => "\t"+filename).join("\n"))

    const res = await question("Do you want to aggregate these datas (Y/n) ?  ");
    if (!["yes","y","oui","o"].some(str => str === res.toLowerCase())) {
        console.log("no")
        return;
    }
    
    let acc = {createds: {}, aggregateds: {}};

    for (const {filename, fileSource, fileDate, fileAdditionalParams} of files) {
        console.log("Importing "+filename+" ...")
        const date = new Date();

        await ImportHistory.create({
            source: fileSource,
            scrappingDate: fileDate,
            scrappingParams: fileAdditionalParams,
            importDate: date
        })

        const nbLines = await lazyReadCsv(scrapCsvPath+filename, async (_acc,_obj,i) => {
            return i+1;
        })
        acc = await lazyReadCsv(scrapCsvPath+filename, async ({createds, aggregateds},obj,i) => {
            if ((i+1)%Math.floor(nbLines/100) === 0) {
                console.log(`${i+1}/${nbLines} (${Math.round((i+1)/(nbLines)*100)}%)`)
            }
            const [lat,lon,infos] = [parseFloat(obj.lat),parseFloat(obj.lon),JSON.parse(obj.infos)];
            
            if ((await Camera.findOne({coordinatesSource: fileSource, lat, lon})) !== null)
                return {createds, aggregateds};

            const computedInfos = infosFieldsBySource[fileSource](infos);
            computedInfos[fileSource].date = date

            const radius = computedInfos.type === "public" ? publicRadius : privateRadius;

            const minLat = destinationPointLat(lat, true, radius);
            const maxLat = destinationPointLat(lat, false, radius);
            const minLon = destinationPointLon(lat,lon,false, radius);
            const maxLon = destinationPointLon(lat,lon,true, radius);

            const nearCamera = await Camera.findOne({
                lat: {$gte: minLat, $lte: maxLat},
                lon: {$gte: minLon, $lte: maxLon},
                coordinatesSource: {$ne: fileSource},
                "infos.type": computedInfos.type
            });

            if (nearCamera !== null) {
                if (nearCamera.infos[fileSource] !== undefined)
                    return {createds, aggregateds};
                
                const [coordinatesToKeep,coordinatesDate,coordinatesSource] = (computedInfos.type === "public" && ["camerci","parisPoliceArcgis"].includes(nearCamera.coordinatesSource)) ?
                                                [{lat: nearCamera.lat, lon: nearCamera.lon},nearCamera.coordinatesDate,nearCamera.coordinatesSource] :
                                                [{lat, lon},fileDate,fileSource]
                

                nearCamera.updatedAt = date;                        
                nearCamera.coordinatesDate = coordinatesDate;
                nearCamera.coordinatesSource = coordinatesSource;
                nearCamera.lat = coordinatesToKeep.lat;
                nearCamera.lon = coordinatesToKeep.lon;
                nearCamera.infos = {...nearCamera.infos, ...computedInfos};
                
                await nearCamera.save();
                return {createds, aggregateds: {...aggregateds, [fileSource]: (aggregateds[fileSource]??0) + 1}};
            }
            
            await Camera.create({
                createdAt: date,
                updatedAt: date,
                coordinatesDate: fileDate,
                coordinatesSource: fileSource,
                lat, lon,
                infos: computedInfos
            })
            return {createds: {...createds, [fileSource]: (createds[fileSource]??0) + 1}, aggregateds};
        }, {acc})
    }

    console.log(acc);
}

module.exports = {getArgs, example, execute, postArgs}