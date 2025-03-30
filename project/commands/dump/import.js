const Camera = require("../../models/Camera");
const { dumpCsvPath } = require("../../paths");
const lazyReadCsv = require("../../libs/lazyReadCsv");
const { partSizeValidator } = require("../../libs/validators/commandValidators");
const { dateToDateRangeValidator } = require("../../libs/validators/commandValidators");
const { postParamsFindDumpFiles } = require("../../libs/commandsPostParams");
const HistoryManager = require("../../managers/HistoryManager");

function getArgs() {
    return {
        date: dateToDateRangeValidator,
        partSize: partSizeValidator
    }
}

async function postParams(params) {
    return postParamsFindDumpFiles(params)
}

function example() {
    return  "\nnode console.js dump import [date_search] [part_size]"+
            "\nnode console.js dump import 2024-06-12"+
            "\nnode console.js dump import 2024-06-12 500"
}

async function execute({file, partSize}) {
    console.log(`Start importing cameras from file '${file}'`)

    const date = new Date();
    const splittedFilename = file.split(".csv")[0].split("_");
    const filestrDate = splittedFilename[splittedFilename.length-1];
    const fileDate = new Date(filestrDate);
    await HistoryManager.registerImport(date, fileDate)
    
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


module.exports = {getArgs, example, execute, postParams};