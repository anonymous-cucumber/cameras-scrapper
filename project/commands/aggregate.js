const fs = require("fs/promises");
const lazyReadCsv = require("../libs/lazyReadCsv");
const Camera = require("../models/Camera");
const {destinationPointLat, destinationPointLon} = require("../libs/convert");

function getArgs() {
    return {}
}

function example() {
    return "node console.js test";
}

const radius = 4; // 4 metters;

const path = __dirname+"/../CSVs/";

async function execute() {
    //const files = await fs.readdir(path).then(files => files.filter(file => file !== ".keep"));
    const files = ["camerci.csv"]
    
    console.log("\nCSVs files to aggregate :");
    console.log(files.map(file => "\t"+file).join("\n"));

    for (const file of files) {
        console.log("Importing "+file+" ...")
        await lazyReadCsv(path+file, async (obj) => {
            const [lat,lon,infos] = [parseFloat(obj.lat),parseFloat(obj.lon),JSON.parse(obj.infos)];
            if ((await Camera.findOne({source: file, lat, lon})) !== null)
                return;
            const minLat = destinationPointLat(lat, true, radius);
            const maxLat = destinationPointLat(lat, false, radius);
            const minLon = destinationPointLon(lat,lon,false, radius);
            const maxLon = destinationPointLon(lat,lon,true, radius);

            const nearCamera = await Camera.findOne({
                
            })
        })
    }
}

module.exports = {getArgs,example,execute}