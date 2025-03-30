const {Schema} = require("mongoose");
const {connect} = require("../Mongo");
const getAllSources = require("../libs/getAllSources");

const db = connect();

const HistorySchema = new Schema({
    type: {type: String, enum: ["import","export","aggregation","scrapping"], required: true},
    date: {type: Date, required: true},

    source: {type: String, enum: getAllSources()},

    additionalParams: String,
    
    aggregationFileDate: Date,

    importFileDate: Date
});

module.exports = db.model('History', HistorySchema);