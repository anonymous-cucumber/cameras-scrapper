const { deductDateRange } = require("../libs/datetimeMatching");
const {dumpCsvPath} = require("../paths");
const fs = require("fs/promises");
const Camera = require("../models/Camera");
const {exportCameras} = require("../libs/dumpsCameras");
const { generateHeaderFromModel, generateLinesFromModel } = require("../libs/csvFormatter");
const lazyReadCsv = require("../libs/lazyReadCsv");

function getArgs() {
    return {
        action: async action => {
            if (action === undefined || !["import","export"].includes(action.toLowerCase()))
                return {success: false, msg: "You have to mention action 'import' or 'export'"}

            return {success: true, data: action.toLowerCase()};
        },
        dateOrPartsize: async (strDateOrPartsize,params) => {
            if (params.action === "export") {
                const partSize = strDateOrPartsize !== undefined ? parseInt(strDateOrPartsize) : undefined;
                if (partSize !== undefined && isNaN(partSize))
                    return {success: false, msg: "You have to mention a number for partsize"}
                return {success: true, params: {...params, partSize}}
            }

            const strDate = strDateOrPartsize;

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
        partSize: (partSize, params) => {
            if (params.action === "import") {
                if (partSize !== undefined && isNaN(partSize = parseInt(partSize)))
                    return {success: false, msg: "You have to mention a number for partsize"}

                return {success: true, params: {...params, partSize}}
            }
            return {success: true, params}
        }
    }
}

function example() {
    return  "\nnode console.js dump export [part_size]"+
            "\nnode console.js dump export 5000"+
            "\nnode console.js dump import [date_search] [part_size]"+
            "\nnode console.js dump import 2024-06-12"+
            "\nnode console.js dump import 2024-06-12 500"
}

async function execute({action, file, partSize}) {
    switch (action) {
        case "export":
            return exportDump(partSize);
        case "import":
            return importDump(file, partSize);
    }
}

async function exportDump(partSize) {
    const outputFile = `dump_${new Date().toISOString()}.csv`;

    console.log(`Start exporting dump into file '${outputFile}'`);

    await fs.writeFile(dumpCsvPath+outputFile, generateHeaderFromModel(Camera)+"\n");

    const dateA = new Date();

    let lastPercent = null

    await exportCameras(partSize??10_000, async (cameras,n,total) => {
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

async function importDump(file, parseSize) {
    console.log(`Start importing cameras from file '${file}'`)
    
    const total = await lazyReadCsv(dumpCsvPath+file, async (_acc,_obj,i) => {
        return i+1;
    })

    if (parseSize == undefined)
        parseSize = 50;

    const dateA = new Date();

    let lastPercent = null;

    await lazyReadCsv(dumpCsvPath+file, async (cameras,camera,i) => {
        cameras.push(camera);
        if (cameras.length >= parseSize || i === total-1) {
            const n = i+1-cameras.length
            const percent = Math.round((n)/(total)*100);
            if (percent !== lastPercent) {
                console.log(`${n}/${total} (${percent}%)`);
                lastPercent = percent;
            }

            await Promise.all(cameras.map(async camera => {
                
                if ((await Camera.countDocuments({_id: camera._id})) === 1)
                    await Camera.deleteOne({_id: camera._id});
                return Camera.create(camera)
            }));
            cameras = [];
        }
        return cameras;
    }, {model: Camera, acc: []});

    const duration = (new Date().getTime()-dateA.getTime())/1000;
    console.log(`Dump imports from file '${file}' finished in ${duration}s !`)
}


module.exports = {getArgs, example, execute};