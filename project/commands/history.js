const ImportHistory = require("../models/ImportHistory");
const getAllSources = require("../libs/getAllSources");
const {deductDateRange} = require("../libs/datetimeMatching");

function getArgs() {
    return {
        sources: async (givenSources) => {
            const allSources = getAllSources();
            if ([undefined,"all"].includes(givenSources)) {
                return {success: true, data: allSources}
            }
            const sources = givenSources.split(",");
            for (const source of sources) {
                if (!allSources.includes(source))
                    return {success: false, msg: `The source "${source}" does not exist`};
            }

            return {success: true, data: sources};
        },
        scrappingDate: (strDate) => {
            if (strDate === "all")
                strDate = undefined;

            const dateRange = strDate ? deductDateRange(strDate) : [null,null];

            if (strDate && dateRange === null)
                return {success: false, msg: `"${strDate}" is not a valid date`};

            return {success: true, data: dateRange}
        },
        importDate: (strDate) => {
            if (strDate === "all")
                strDate = undefined;

            const dateRange = strDate ? deductDateRange(strDate) : [null,null];

            if (strDate && dateRange === null)
                return {success: false, msg: `"${strDate}" is not a valid date`};

            return {success: true, data: dateRange}
        },
        scrappingParams: async (additionalParams) => {
            return {success: true, data: additionalParams}
        }
    }
}

function example() {
    return "\nnode console.js history <sources> <scrappingDate> <importDate> <scrappingParams>";
}

async function execute({sources,scrappingDate,importDate,scrappingParams}) {

    const items = await ImportHistory.find({
        ...(sources !== "all" ? {source : {$in: sources}} : {}),
        ...(scrappingDate[0] !== null ? {scrappingDate: {$gte: scrappingDate[0], $lte: scrappingDate[1]}} : {}),
        ...(importDate[0] !== null ? {importDate: {$gte: importDate[0], $lte: importDate[1]}} : {}),
        ...(scrappingParams ? {scrappingParams: scrappingParams === "nothing" ? {$exists: false} : scrappingParams} : {})
    });

    console.log("Imports history :");
    if (items.length === 0) {
        console.log("\tnothing");
        return;
    }
    console.log(
        items.map(({source, scrappingDate, scrappingParams, importDate}) => 
            `\t- ${source}${scrappingParams ? "_"+scrappingParams : ""}_${scrappingDate.toISOString()}.csv imported at ${importDate.toISOString()}`
        ).join("\n")
    )
    
}

module.exports = {getArgs,example,execute}