const fs = require("fs/promises");
const {fileExists} = require("../libs/fsUtils");

function getArgs() {
    return {
        scrapper: async (scrapper) => {
            if (!(await fileExists(__dirname+"/../scrappers/"+scrapper+".js"))) {
                return {success: false, msg: `The scrapper ${scrapper} does not exist`}
            };
            return {success: true, data: require(__dirname+"/../scrappers/"+scrapper+".js")};
        },
        additionalParams: async (additionalParams,params) => {
            const {scrapper} = params;
            if (typeof(scrapper.valid) !== "function")
                return {success: true, data: params};
            return await scrapper.valid(additionalParams,params);
        }
    }
}

function example() {
    return "node console.js scrap parisPoliceArcgis"+
            "\nnode console.js scrap surveillanceUnderSurveillance paris"
}

const cols = ["lat","lon",["infos",v => v ? JSON.stringify(v).replace(/;/g,",") : ""]];

async function execute({scrapper,additionalParams}) {

    /*const lines = */await scrapper.scrapper(additionalParams);

    /*const header = cols.map(colInfo => colInfo instanceof Array ? colInfo[0] : colInfo).join(";")

    const csv = header+"\n"+lines.filter(line => line !== null).map(line =>
        cols.map(colInfo => {
            const [col,get] = colInfo instanceof Array ? colInfo : [colInfo,null]
            return get ? get(line[col]) : line[col]
        }).join(";")    
    ).join("\n");

    await fs.writeFile(`${__dirname}/../CSVs/${scrapper}_${new Date().toISOString()}.csv`, csv);

    console.log("csv file for '"+scrapper+"' has been succesfully scrapped !")*/
}

module.exports = {getArgs,example,execute}