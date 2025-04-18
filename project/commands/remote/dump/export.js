const {dumpCsvPath} = require("../../../paths");
const fs = require("fs/promises");
const Camera = require("../../../models/Camera");
const {exportRemoteCameras} = require("../../../libs/dumpsCameras");
const { generateHeaderFromModel, generateLinesFromModel } = require("../../../libs/csvFormatter");
const {partSizeValidator} = require("../../../libs/validators/commandValidators");

function getArgs() {
    return {
        partSize: partSizeValidator
    }
}

function example() {
    return  "\nnode console.js remote dump export [part_size]"+
            "\nnode console.js remote dump export 5000"
}

async function execute({partSize}) {
    const outputFile = `dump_remote_${new Date().toISOString()}.csv`;

    console.log(`Start remote exporting dump into file '${outputFile}'`);

    await fs.writeFile(dumpCsvPath+outputFile, generateHeaderFromModel(Camera)+"\n");

    const dateA = new Date();

    let lastPercent = null

    await exportRemoteCameras(partSize??1000, async (cameras,n,total) => {
        const percent = Math.round((n/total)*100);
        if (percent !== lastPercent) {
            console.log(`${n}/${total} (${percent}%)`)
            lastPercent = percent;
        }
        await fs.appendFile(dumpCsvPath+outputFile, generateLinesFromModel(Camera, cameras)+"\n")
    });
    const duration = (new Date().getTime()-dateA.getTime())/1000;
    console.log(`Remote dump exports to file '${outputFile}' finished in ${duration}s !`)
}


module.exports = {getArgs, example, execute};