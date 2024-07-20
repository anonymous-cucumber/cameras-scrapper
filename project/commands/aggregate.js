const fs = require("fs/promises");
const lazyReadCsv = require("../libs/lazyReadCsv");
const Camera = require("../models/Camera");
const {destinationPointLat, destinationPointLon} = require("../libs/convert");
const {fileExists} = require("../libs/fsUtils");
const {question} = require("../libs/ui");
const {deductDateRange} = require("../libs/datetimeMatching");

const publicRadius = 10; // 10 metters;
const privateRadius = 3; // 3 metters;

const path = __dirname+"/../CSVs/";
const scrappersPath = __dirname+"/../scrappers/";

function getArgs() {
    return {
        sources: async givenSources => {
            if ([undefined,"all"].includes(givenSources)) {
                const sources = await fs.readdir(scrappersPath)
                                    .then(files => 
                                        files
                                            .filter(file => file !== ".keep")
                                            .map(file => file.replace(".js",""))
                                    )
                return {success: true, data: sources}
            }
            const sources = givenSources.split(",");
            for (const source of sources) {
                if (!(await fileExists(scrappersPath+source+".js")))
                    return {success: false, msg: `The source "${source}" does not exist`};
            }

            return {success: true, data: sources};
        },
        date: (strDate,params) => {
            const {sources} = params;
            
            if (strDate === "all")
                strDate = undefined;

            const dateRange = strDate ? deductDateRange(strDate) : [null,null];

            if (strDate && dateRange === null)
                return {success: false, msg: `"${strDate}" is not a valid date`};

            return {success: true, params: {...params, dateRange}}
        },
        additionalParams: async (additionalParams,params) => {
            const {sources, dateRange: [date, dateB]} = params;

            const files = await fs.readdir(path).then(files =>
                files.filter(filename => {
                    const splittedFilename = filename.split(".csv")[0].split("_");
                    const fileSource = splittedFilename[0];
                    const filestrDate = splittedFilename[splittedFilename.length-1];
                    const fileAdditionalParams = splittedFilename.length === 3 ? splittedFilename[1] : undefined;

                    if (!sources.includes(fileSource))
                        return false;

                    if (
                        (additionalParams && additionalParams !== "nothing" && additionalParams !== fileAdditionalParams) || 
                        (additionalParams === "nothing" && fileAdditionalParams)
                    )
                        return false;

                    if (date === null)
                        return true;

                    const fileDate = new Date(filestrDate);

                    return fileDate.getTime() >= date.getTime() && fileDate.getTime() < dateB.getTime()
                })    
            )
            if (files.length === 0)
                return {success: false, msg: "Nothing file has been found with your query"}
            return {success: true, params: {...params, files}};
        }
    }
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
    console.log(files.map(file => "\t"+file).join("\n"))

    const res = await question("Do you want to aggregate these datas (Y/n) ?  ");
    if (!["yes","y","oui","o"].some(str => str === res.toLowerCase())) {
        console.log("no")
        return;
    }
    
    let acc = {createds: {}, aggregateds: {}};

    for (const file of files) {
        console.log("Importing "+file+" ...")
        const date = new Date();

        const nbLines = await lazyReadCsv(path+file, async (_acc,_obj,i) => {
            return i+1;
        })
        acc = await lazyReadCsv(path+file, async ({createds, aggregateds},obj,i) => {
            if ((i+1)%Math.floor(nbLines/100) === 0) {
                console.log(`${i+1}/${nbLines} (${Math.round((i+1)/(nbLines)*100)}%)`)
            }
            const source = file.split("_")[0]
            const [lat,lon,infos] = [parseFloat(obj.lat),parseFloat(obj.lon),JSON.parse(obj.infos)];
            
            if ((await Camera.findOne({coordinatesSource: source, lat, lon})) !== null)
                return {createds, aggregateds};

            const computedInfos = infosFieldsBySource[source](infos);
            computedInfos[source].date = date

            const radius = computedInfos.type === "public" ? publicRadius : privateRadius;

            const minLat = destinationPointLat(lat, true, radius);
            const maxLat = destinationPointLat(lat, false, radius);
            const minLon = destinationPointLon(lat,lon,false, radius);
            const maxLon = destinationPointLon(lat,lon,true, radius);

            const nearCamera = await Camera.findOne({
                lat: {$gte: minLat, $lte: maxLat},
                lon: {$gte: minLon, $lte: maxLon},
                coordinatesSsource: {$ne: source},
                "infos.type": computedInfos.type
            });

            if (nearCamera !== null) {
                if (nearCamera.infos[source] !== undefined)
                    return {createds, aggregateds};
                
                const [coordinatesToKeep,coordinatesDate,coordinatesSource] = (computedInfos.type === "public" && ["camerci","parisPoliceArcgis"].includes(nearCamera.coordinatesSource)) ?
                                                [{lat: nearCamera.lat, lon: nearCamera.lon},nearCamera.coordinatesDate,nearCamera.coordinatesSource] :
                                                [{lat, lon},date,source]
                
                nearCamera.coordinatesDate = coordinatesDate;
                nearCamera.coordinatesSource = coordinatesSource;
                nearCamera.lat = coordinatesToKeep.lat;
                nearCamera.lon = coordinatesToKeep.lon;
                nearCamera.infos = {...nearCamera.infos, ...computedInfos};
                
                await nearCamera.save();
                return {createds, aggregateds: {...aggregateds, [source]: (aggregateds[source]??0) + 1}};
            }
            
            await Camera.create({
                coordinatesDate: date,
                coordinatesSource: source,
                lat, lon,
                infos: computedInfos
            })
            return {createds: {...createds, [source]: (createds[source]??0) + 1}, aggregateds};
        }, ";", acc)
    }

    console.log(acc);
}

module.exports = {getArgs,example,execute}