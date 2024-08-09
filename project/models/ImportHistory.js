const {Schema} = require("mongoose");
const {connect} = require("../Mongo");

const db = connect();

const ImportHistorySchema = new Schema({
    source: {type: String, required: true},
    
    scrappingDate: {type: Date, required: true},
    scrappingParams: {type: String, required: false},

    importDate: {type: Date, required: true}
});

module.exports = db.model('ImportHistory', ImportHistorySchema);