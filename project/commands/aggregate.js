const fs = require("fs/promises");
const lazyReadCsv = require("../libs/lazyReadCsv");
const Camera = require("../models/Camera");
const getCameraType = require("../libs/getCameraType");
const {destinationPointLat, destinationPointLon} = require("../libs/convert");
const {fileExists} = require("../libs/fsUtils");
const {question} = require("../libs/ui");

const radius = 10; // 10 metters;
const path = __dirname+"/../CSVs/";
const scrappersPath = __dirname+"/../scrappers/";

const dateUnits = [
    ["getFullYear", "setFullYear", "", "([0-9]{4})","1970"],
    [(d) => d.getMonth()+1, (d,n) => d.setMonth(n-1), "-", "([0-9]{2})","01"],
    ["getDate", "setDate", "-", "([0-9]{2})","01"],
    ["getHours", "setHours", "T", "([0-9]{2})","00"],
    ["getMinutes", "setMinutes", ":", "([0-9]{2})","00"],
    ["getSeconds", "setSeconds", ":", "([0-9]{2})","00"],
    [null, null, ".", "([0-9]{3})Z?","000"]
]

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
        date: async (strDate,params) => {
            const {sources} = params;
            let regex = "";
            let inputUnits = null;
            if (strDate) {
                for (const [,,del,reg] of dateUnits) {
                    regex += `${del && "\\"+del}${reg}`;
                    const match = strDate.match(`^${regex}$`);
                    if (match !== null) {
                        inputUnits = match.slice(1)
                        break;
                    }
                }
            }
            if (strDate && inputUnits === null)
                return {success: false, msg: `"${strDate}" is not a valid date`}

            const date = strDate && new Date(dateUnits.reduce((acc,[,,del,,defaultValue],i) =>
                acc+del+(inputUnits[i] ?? defaultValue)
            , ""))
            const files = await fs.readdir(path).then(files =>
                files.filter(filename => {
                    const [fileSource,filestrDate] = filename.split(".")[0].split("_");
                    if (!sources.includes(fileSource))
                        return false;
                    if (strDate === undefined)
                        return true;

                    const fileDate = new Date(filestrDate);

                    if (fileDate.getTime() < date.getTime())
                        return false;

                    for (let i=dateUnits.length-1;i>=0;i--) {
                        const [getter,setter] = dateUnits[i];
                        if (getter === null || setter === null)
                            continue;
                        if (inputUnits[i] === undefined)
                            continue;

                        const getUnit = typeof(getter) === "string" ? (d => d[getter]()) : getter;
                        const setUnit = typeof(setter) === "string" ? ((d,n) => d[setter](n)) : setter;

                        const dateB = new Date(date.getTime());
                        setUnit(dateB, getUnit(dateB)+1);
                        dateB.setMilliseconds(dateB.getMilliseconds()-1)
                        return (fileDate.getTime() <= dateB.getTime())
                    }

                    return true;
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
            "\nnode console.js aggregate all 2024-04";
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