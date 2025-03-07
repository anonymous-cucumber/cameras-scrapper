const History = require("../models/History");

class HistoryManager {
    static registerScrapping(date, source, additionalParams) {
        return History.create({
            type: "scrapping",
            date,
            source,
            additionalParams
        })
    }

    static registerAggregation(date, source, additionalParams, fileDate) {
        return History.create({
            type: "aggregation",
            date,
            source,
            additionalParams,
            aggregationFileDate: fileDate
        })
    }

    static registerExport(date) {
        return History.create({
            type: "export",
            date
        })
    }

    static registerImport(date, filedate) {
        return History.create({
            type: "import",
            date,
            importFileDate: filedate
        })
    } 
}

module.exports = HistoryManager;