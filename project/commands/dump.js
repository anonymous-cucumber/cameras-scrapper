const { deductDateRange } = require("../libs/datetimeMatching");
const {dumpCsvPath} = require("../paths");
const fs = require("fs/promises");
const Camera = require("../models/Camera");
const {exportCameras} = require("../libs/dumpsCameras");
const { generateHeaderFromModel, generateLinesFromModel } = require("../libs/csvFormatter");

function getArgs() {
    return {
        action: async action => {
            if (action === undefined || !["import","export"].includes(action.toLowerCase()))
                return {success: false, msg: "You have to mention action 'import' or 'export'"}

            return {success: true, data: action.toLowerCase()};
        },
        date: async (strDate,params) => {
            if (params.action === "export")
                return {success: true, params}

            let dateRange = [null, null];
            if (strDate && strDate !== "all") {
                dateRange = deductDateRange(strDate);
                if (dateRange === null)
                    return {success: false, msg: "Bad datetime format"}
            }
            const [dateA, dateB] = dateRange
            const files = await fs.readdir(dumpCsvPath).then(files =>
                files
                    .filter(filename => filename !== ".keep")
                    .map(filename => {
                        const splittedFilename = filename.split(".csv")[0].split("_");

                        const filestrDate = splittedFilename[splittedFilename.length-1];
                        const fileDate = new Date(filestrDate);

                        return {filename, fileDate}
                    })
                    .filter(({fileDate}) => {
                        if (dateA === null)
                            return true;

                        return fileDate.getTime() >= dateA.getTime() && fileDate.getTime() < dateB.getTime()
                    })    
            )

            if (files.length === 0) {
                return {success: false, msg: "No file found"}
            }
            if (files.length > 1) {
                return {success: false, msg: "Several files found, please choose one by date :\n"+files.map(({filename}) => "\t - "+filename).join("\n")}
            }

            return {success: true, params: {...params, file: files[0].filename}}
        },
        partSize: (partSize) => {
            return {success: true, data: partSize};
        }
    }
}

function example() {
    return "\nnode console.js dump export"+
            "\nnode console.js dump import"+
            "\nnode console.js dump import 2024-06-12"
}

async function execute({action, file, partSize}) {
    switch (action) {
        case "export":
            return export_dump(partSize);
    }
}

async function export_dump(partSize) {
    const outputFile = `dump_${new Date().toISOString()}.csv`;

    console.log(`Start exporting dump into file '${outputFile}'`);

    await fs.writeFile(dumpCsvPath+outputFile, generateHeaderFromModel(Camera)+"\n");

    await exportCameras(partSize??10_000, async (cameras,n,total) => {
        console.log(Math.min(Math.round((n/total)*100),100)+"%")
        await fs.appendFile(dumpCsvPath+outputFile, generateLinesFromModel(Camera, cameras)+"\n")
    });
    console.log(`Dump exports to file '${outputFile}' finished !`)
}


module.exports = {getArgs, example, execute};