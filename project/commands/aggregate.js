const fs = require("fs/promises");
const lazyReadCsv = require("../libs/lazyReadCsv");
const Camera = require("../models/Camera");
const getCameraType = require("../libs/getCameraType");
const {destinationPointLat, destinationPointLon} = require("../libs/convert");
const {fileExists} = require("../libs/fsUtils");

const radius = 10; // 10 metters;
const path = __dirname+"/../CSVs/";
const scrappersPath = __dirname+"/../scrappers/"

function getArgs() {
    return {
        sources: async sources => {
            if ([undefined,"all"].includes(sources))
                return {success: true, data: sources}
            return {success: true, data: sources.split(",")}
        },
        num: async (num,{sources}) => {
            const files = (![undefined,"all"].includes(sources) ? 
                                sources : 
                                await fs.readdir(scrappersPath)
                                    .then(files => 
                                        files
                                            .filter(file => file !== ".keep")
                                            .map(file => file.replace(".js",""))
                                    )).map(source => source+(num > 1 ? "_"+num : "")+".csv")
            
            for (let i=0;i<files.length;i++) {
                const file = files[i];
                if (await fileExists(path+file))
                    continue;
                if ([undefined,"all"].includes(sources)) {
                    files.splice(i,1);
                    i--;
                    continue;
                }
                return {success: false, msg: `The file ${file} does not exist`}
            }

            return {success: true, params: {files}};
        }
    }
}

function example() {
    return "\nnode console.js aggregate"+
            "\nnode console.js aggregate camerci,parisPoliseArcgis"+
            "\nnode console.js aggregate camerci,parisPoliseArcgis 2"+
            "\nnode console.js aggregate all 2";
}

const infosFieldsBySource = {
    parisPoliceArcgis: (infos) => ({
        adresse: infos.adresse,
        code_postal: infos.code_postal,
        op_type: "public",
        zone: "paris"
    }),
    sousSurveillanceNet: ["zone","apparence","direction","angle","op_type"],
    camerci: (infos) => ({camerci_desc: infos, op_type: "public"})
};

async function execute({files}) {    
    console.log("\nCSVs files to aggregate :");
    console.log(files.map(file => "\t"+file).join("\n"));
    
    let acc = {createds: {}, aggregateds: {}};

    for (const file of files) {
        console.log("Importing "+file+" ...")
        const nbLines = await lazyReadCsv(path+file, async (_acc,_obj,i) => {
            return i+1;
        })
        acc = await lazyReadCsv(path+file, async ({createds, aggregateds},obj,i) => {
            if ((i+1)%Math.floor(nbLines/100) === 0) {
                console.log(`${i+1}/${nbLines} (${Math.round((i+1)/(nbLines)*100)}%)`)
            }
            const source = file.split(".csv")[0].split("_").slice(0,-1).join("_")
            const [lat,lon,infos] = [parseFloat(obj.lat),parseFloat(obj.lon),JSON.parse(obj.infos)];
            
            if ((await Camera.findOne({coordinates_source: source, lat, lon})) !== null)
                return {createds, aggregateds};
            const minLat = destinationPointLat(lat, true, radius);
            const maxLat = destinationPointLat(lat, false, radius);
            const minLon = destinationPointLon(lat,lon,false, radius);
            const maxLon = destinationPointLon(lat,lon,true, radius);

            const nearCamera = await Camera.findOne({
                lat: {$gte: minLat, $lte: maxLat},
                lon: {$gte: minLon, $lte: maxLon},
                coordinates_source: {$ne: source},
                "infos.op_type": getCameraType({infos})
            });

            if (nearCamera !== null) {
                if (nearCamera.infos_sources.includes(source))
                    return {createds, aggregateds};
                
                const [coordinatesToKeep,coordinatesSource] = nearCamera.coordinates_source !== "sousSurveillanceNet" ?
                                                [{lat: nearCamera.lat, lon: nearCamera.lon},nearCamera.coordinates_source] :
                                                [{lat, lon},source]
                
                nearCamera.coordinates_source = coordinatesSource;
                nearCamera.lat = coordinatesToKeep.lat;
                nearCamera.lon = coordinatesToKeep.lon;
                nearCamera.infos = typeof(infosFieldsBySource[source]) === "function" ?
                                    {...nearCamera.infos, ...infosFieldsBySource[source](infos)} :
                                    infosFieldsBySource[source].reduce((acc,col) => ({
                                        ...acc,
                                        [col]: infos[col]
                                    }), nearCamera.infos);
                nearCamera.infos_sources.push(source);
                
                await nearCamera.save();
                return {createds, aggregateds: {...aggregateds, [source]: (aggregateds[source]??0) + 1}};
            }
            
            await Camera.create({
                coordinates_source: source,
                infos_sources: [source],
                lat, lon,
                infos: typeof(infosFieldsBySource[source]) === "function" ?
                        infosFieldsBySource[source](infos) :
                        infosFieldsBySource[source].reduce((acc,col) => ({
                            ...acc,
                            [col]: infos[col]
                        }), {})
            })
            return {createds: {...createds, [source]: (createds[source]??0) + 1}, aggregateds};
        }, ";", acc)
    }

    console.log(acc);
}

module.exports = {getArgs,example,execute}