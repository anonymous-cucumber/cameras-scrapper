const fs = require("fs/promises");
const { dumpCsvPath } = require("../paths");

async function postArgsFindDumpFiles(params) {
    const {dateRange: [dateA, dateB]} = params

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
}

module.exports = {postArgsFindDumpFiles}