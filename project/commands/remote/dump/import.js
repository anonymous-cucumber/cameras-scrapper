const Camera = require("../../../models/Camera");
const { dumpCsvPath } = require("../../../paths");
const lazyReadCsv = require("../../../libs/lazyReadCsv");
const { partSizeValidator } = require("../../../libs/validators/commandValidators");
const { dateToDateRangeValidator } = require("../../../libs/validators/commandValidators");
const { postArgsFindDumpFiles } = require("../../../libs/commandsPostArgs");
const { importRemoteCameras } = require ("../../../libs/dumpsCameras");

function getArgs() {
    return {
        date: dateToDateRangeValidator,
        partSize: partSizeValidator
    }
}

async function postArgs(params) {
    return postArgsFindDumpFiles(params)
}

function example() {
    return  "\nnode console.js remote dump import [file_date] [part_size]"+
            "\nnode console.js remote dump import 2024-06-12"+
            "\nnode console.js remote dump import 2024-06-12 500"
}

async function execute({file, partSize}) {
    console.log(`Start importing cameras from file '${file}'`)
    
    const total = await lazyReadCsv(dumpCsvPath+file, async (_acc,_obj,i) => {
        return i+1;
    })

    if (partSize == undefined)
        partSize = 50;

    const dateA = new Date();

    let lastPercent = null;

    await lazyReadCsv(dumpCsvPath+file, async (cameras,camera,i) => {
        cameras.push(camera);
        if (cameras.length >= partSize || i === total-1) {
            const n = i+1-cameras.length
            const percent = Math.round((n)/(total)*100);
            if (percent !== lastPercent) {
                console.log(`${n}/${total} (${percent}%)`);
                lastPercent = percent;
            }

            await importRemoteCameras(cameras);
            cameras = [];
        }
        return cameras;
    }, {model: Camera, acc: []});

    const duration = (new Date().getTime()-dateA.getTime())/1000;
    console.log(`Dump imports from file '${file}' finished in ${duration}s !`)
}


module.exports = {getArgs, example, execute, postArgs};