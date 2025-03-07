const {dumpCsvPath} = require("../../paths");
const fs = require("fs/promises");
const Camera = require("../../models/Camera");
const HistoryManager = require("../../managers/HistoryManager");
const {exportLocalCameras} = require("../../libs/dumpsCameras");
const { generateHeaderFromModel, generateLinesFromModel } = require("../../libs/csvFormatter");
const {partSizeValidator} = require("../../libs/validators/commandValidators");

function getArgs() {
    return {
        partSize: partSizeValidator
    }
}

function example() {
    return  "\nnode console.js dump export [part_size]"+
            "\nnode console.js dump export 5000"
}

async function execute({partSize}) {
    const date = new Date();

    console.log(`Start exporting dump into file '${outputFile}'`);

    await HistoryManager.registerExport(date);
    

    const outputFile = `dump_${date.toISOString()}.csv`;

    await fs.writeFile(dumpCsvPath+outputFile, generateHeaderFromModel(Camera)+"\n");

    const dateA = new Date();

    let lastPercent = null

    await exportLocalCameras(partSize??10_000, async (cameras,n,total) => {
        const percent = Math.round((n/total)*100);
        if (percent !== lastPercent) {
            console.log(`${n}/${total} (${percent}%)`)
            lastPercent = percent;
        }
        await fs.appendFile(dumpCsvPath+outputFile, generateLinesFromModel(Camera, cameras)+"\n")
    });
    const duration = (new Date().getTime()-dateA.getTime())/1000;
    console.log(`Dump exports to file '${outputFile}' finished in ${duration}s !`)
}


module.exports = {getArgs, example, execute};