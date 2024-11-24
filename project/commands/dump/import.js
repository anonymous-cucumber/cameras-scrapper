const { deductDateRange } = require("../../libs/datetimeMatching");
const {dumpCsvPath} = require("../../paths");
const fs = require("fs/promises");
const Camera = require("../../models/Camera");
const lazyReadCsv = require("../../libs/lazyReadCsv");
const {partSizeValidator} = require("../../libs/validators/commandValidators");

function getArgs() {
    return {
        date: async (strDate, params) => {
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
        partSize: partSizeValidator
    }
}

function example() {
    return  "\nnode console.js dump import [date_search] [part_size]"+
            "\nnode console.js dump import 2024-06-12"+
            "\nnode console.js dump import 2024-06-12 500"
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