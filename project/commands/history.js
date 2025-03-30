const getAllSources = require("../libs/getAllSources");
const { dateToDateRangeValidator } = require("../libs/validators/commandValidators");
const History = require("../models/History");

const historyTypes = History.schema.paths.type.enumValues;

function getArgs() {
    return {
        type: (type) => {
            type = type?.toLowerCase();

            if (!historyTypes.includes(type)) {
                return {success: false, msg: `Type can only be : ${historyTypes.join(" | ")}`}
            }

            return {
                success: true,
                data: type
            }
        },
        dateOrHelp: (v, params) => {
            if (v === "help") {
                return {success: true, params: {...params, help: true}}
            }
            return dateToDateRangeValidator(v)
        }
    }
}

function getOtherConditionnalArgs({type}) {
    let args = {};

    if (["aggregation","scrapping"].includes(type)) {
        args.sources = async (givenSources) => {
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
        }
        args.additionalParams = (additionalParams) => ({success: true, data: additionalParams});
    }

    if (["aggregation", "import"]) {
        args.fileDate = dateToDateRangeValidator;
    }

    return args;
}

function example({type}) {
    switch (type) {
        case "aggregation":
            return [
                "\nnode console.js history aggregation <date> <sources> <zone> <filedate>",

                "\nGet aggregations history of camerci during April 2025 :",
                "> node console.js history aggregation 2025-04 camerci",

                "\nGet aggregations history of surveillanceUnderSurveillance, at all dates, on paris :",
                "> node console.js history aggregation all surveillanceUnderSurveillance paris",

                "\nGet aggregations history of surveillanceUnderSurveillance, whatever the zone, but from scrapping file created during the 12 december 2024 :",
                "> node console.js history aggregation all surveillanceUnderSurveillance all 2024-12-12",

                "\nGet aggregations history of all sources during April 2025, with no mentionned zone :",
                "> node console.js history aggregation 2025-04 all nothing"
            ].join("\n")

        case "scrapping":
            return [
                "\nnode console.js history scrapping <date> <sources> <zone>",

                "\nGet scrapping history during April 2025 of surveillanceUnderSurveillance, in france",
                "> node console.js history scrapping 2025-04 surveillanceUnderSurveillance france",

                "\nGet all scrapping history of camerci",
                "> node console.js history scrapping all camerci",

                "\nGet all scrapping history of all source, with no specified zone",
                "> node console.js history scrapping all all nothing"
            ].join("\n")

        case "import":
            return [
                "\nnode console.js history import <date> <filedate>",

                "\nGet import history during 15 january of 2025 :",
                "> node console.js history import 2025-01-15",

                "\nGet import history of all dates, but from dump file previously generated during 2024 :",
                "> node console.js history import all 2024"
            ].join("\n")

        case "export":
            return [
                "\nnode console.js history export <date>",

                "\nGet export history during 15 january of 2025 :",
                "> node console.js history export 2025-01-15",

                "\nGet all export history :",
                "> node console.js history export"
            ].join("\n")
    }
    return "";
}

async function execute(params) {

    console.log(params)
    
}

module.exports = {getArgs, getOtherConditionnalArgs, example, execute}