const fs = require("fs/promises");
const lazyReadCsv = require("../../libs/lazyReadCsv");
const Camera = require("../../models/Camera");
const ImportHistory = require("../../models/ImportHistory");
const {question} = require("../../libs/ui");
const getAllSources = require("../../libs/getAllSources");
const {scrapCsvPath} = require("../../paths");
const { dateToDateRangeValidator } = require("../../libs/validators/commandValidators");
const { calcDistanceBetween } = require("../../libs/convertCoordinates");
const {getComputedInfosBySource, getTypeFromSourceAndComputedInfos} = require("./camerasComputeInfos");
const findNearestInLimitedRadiusCamera = require("./findNearestInLimitedRadiusCamera");
const mergeCameras = require("./mergeCameras");

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
    
    let acc = {};

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
        acc = await lazyReadCsv(scrapCsvPath+filename, async (acc,obj,i) => {
            if ((i+1)%Math.floor(nbLines/100) === 0) {
                console.log(`${i+1}/${nbLines} (${Math.round((i+1)/(nbLines)*100)}%)`)
            }
            const [lat,lon,infos] = [parseFloat(obj.lat),parseFloat(obj.lon),JSON.parse(obj.infos)];
            
            if ((await Camera.findOne({[`infos.${fileSource}.lat`]: lat, [`infos.${fileSource}.lon`]: lon})) !== null) {
                return acc;
            }

            const computedInfos = getComputedInfosBySource(fileSource, infos, lat, lon);
            computedInfos.addedAt = date;
            computedInfos.scrappedAt = fileDate;
            
            const computedType = getTypeFromSourceAndComputedInfos(fileSource, computedInfos);

            const nearestCamera = await findNearestInLimitedRadiusCamera(computedType, lat, lon)

            if (nearestCamera !== null) {
                if (nearestCamera.infos[fileSource] === undefined) {
                    await mergeCameras(computedInfos, fileSource, date, nearestCamera);
                    
                    if (!acc[fileSource])
                        acc[fileSource] = {}
                    
                    acc[fileSource].aggregateds = (acc[fileSource].aggregateds??0) + 1;
                    return acc
                }
                
                if (nearestCamera.infos[fileSource].lat === lat && nearestCamera.infos[fileSource].lon === lon) {
                    return acc;
                }


                const distFromMeAndNear = calcDistanceBetween(lat, lon, nearestCamera.lat, nearestCamera.lon);
                const distFromAggregatedToNear = calcDistanceBetween(nearestCamera.infos[fileSource].lat, nearestCamera.infos[fileSource].lon, nearestCamera.lat, nearestCamera.lon);

                if (distFromMeAndNear < distFromAggregatedToNear) {
                    await Camera.create({
                        createdAt: nearestCamera.infos[fileSource].addedAt,
                        updatedAt: nearestCamera.infos[fileSource].addedAt,
                        scrappedAt: nearestCamera.infos[fileSource].scrappedAt,
                        source: fileSource,
                        lat: nearestCamera.infos[fileSource].lat,
                        lon: nearestCamera.infos[fileSource].lon,
                        infos: {
                            [fileSource]: nearestCamera.infos[fileSource],
                            type: getTypeFromSourceAndComputedInfos(fileSource, nearestCamera.infos[fileSource])
                        }
                    });

                    await mergeCameras(computedInfos, fileSource, date, nearestCamera);

                    if (!acc[fileSource])
                        acc[fileSource] = {}

                    acc[fileSource].createds = (acc[fileSource].createds??0) + 1;

                    return acc;
                }
            }

            
            await Camera.create({
                createdAt: date,
                updatedAt: date,
                scrappedAt: fileDate,
                source: fileSource,
                lat, lon,
                infos: {
                    [fileSource]: computedInfos,
                    type: computedType
                }
            })

            if (!acc[fileSource])
                acc[fileSource] = {}

            acc[fileSource].createds = (acc[fileSource].createds??0) + 1;

            return acc;
        }, {acc})
    }

    console.log(acc);
}

module.exports = {getArgs, example, execute, postArgs}