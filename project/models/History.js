const {Schema} = require("mongoose");
const {connect} = require("../Mongo");
const getAllSources = require("../libs/getAllSources");

const db = connect();

const HistorySchema = new Schema({
    type: {type: String, enum: ["import","export","aggregation","scrapping"], required: true},
    date: {type: Date, required: true},

    source: {type: String, enum: getAllSources(), required: false},

    additionalParams: {type: String, required: false},
    
    aggregationFileDate: {type: Date, required: false},

    importFileDate: {Type: Date, required: false}
});

module.exports = db.model('History', HistorySchema);