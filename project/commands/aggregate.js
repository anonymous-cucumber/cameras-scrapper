const fs = require("fs/promises");
const lazyReadCsv = require("../libs/lazyReadCsv");
const Camera = require("../models/Camera");
const getCameraType = require("../libs/getCameraType");
const {destinationPointLat, destinationPointLon} = require("../libs/convert");
const {fileExists} = require("../libs/fsUtils");

const radius = 10; // 10 metters;
const path = __dirname+"/../CSVs/";

function getArgs() {
    return {
        sources: async sources => {
            if (sources === undefined)
                return {success: true}
            sources = sources.split(",");
            for (const source of sources) {
                if (!(await fileExists(path+source+".csv"))) {
                    return {success: false, msg: `The file ${source}.csv does not exist`}
                }
            }
            return {success: true, data: sources}
        }
    }
}

function example() {
    return "node console.js aggregate camerci,parisPoliseArcgis\nnode console.js aggregate";
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

async function execute({sources}) {
    const files = sources ? sources.map(source => source+".csv") : await fs.readdir(path).then(files => files.filter(file => file !== ".keep"));
    
    console.log("\nCSVs files to aggregate :");
    console.log(files.map(file => "\t"+file).join("\n"));

    for (const file of files) {
        console.log("Importing "+file+" ...")
        const nbLines = await lazyReadCsv(path+file, async (_acc,_obj,i) => {
            return i+1;
        })
        await lazyReadCsv(path+file, async (_,obj,i) => {
            if ((i+1)%Math.floor(nbLines/100) === 0) {
                console.log(`${i+1}/${nbLines} (${Math.round((i+1)/(nbLines)*100)}%)`)
            }
            const source = file.split(".csv")[0]
            const [lat,lon,infos] = [parseFloat(obj.lat),parseFloat(obj.lon),JSON.parse(obj.infos)];
            
            if ((await Camera.findOne({coordinates_source: source, lat, lon})) !== null)
                return;
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
                    return;
                
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
                return;
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
        })
    }
}

module.exports = {getArgs,example,execute}