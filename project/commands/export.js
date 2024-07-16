const fs = require("fs/promises");
const {fileExists} = require("../libs/fsUtils");

const getCsvFilePath = (scrapper,n) => __dirname+"/../CSVs/"+scrapper+(n > 1 ? "_"+n : "")+".csv";

function getArgs() {
    return {
        scrapper: async (scrapper) => {
            if (!(await fileExists(__dirname+"/../scrappers/"+scrapper+".js"))) {
                return {success: false, msg: `The scrapper ${scrapper} does not exist`}
            };
            return {success: true, data: scrapper};
        }
    }
}

function example() {
    return "node console.js export parisPoliceArcgis";
}

const cols = ["lat","lon",["infos",v => v ? JSON.stringify(v).replace(/;/g,",") : ""]];

async function execute({scrapper}) {
    let n = 1;
    while (await fileExists(getCsvFilePath(scrapper,n))) {
        n += 1;
    }

    const lines = await require(__dirname+"/../scrappers/"+scrapper+".js")();

    const header = cols.map(colInfo => colInfo instanceof Array ? colInfo[0] : colInfo).join(";")

    const csv = header+"\n"+lines.filter(line => line !== null).map(line =>
        cols.map(colInfo => {
            const [col,get] = colInfo instanceof Array ? colInfo : [colInfo,null]
            return get ? get(line[col]) : line[col]
        }).join(";")    
    ).join("\n");

    await fs.writeFile(getCsvFilePath(scrapper,n), csv);

    console.log("csv file for '"+scrapper+"' has been succesfully scrapped !")
}

module.exports = {getArgs,example,execute}