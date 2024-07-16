const {Schema} = require("mongoose");
const {connect} = require("../Mongo");

const db = connect();

const CameraSchema = new Schema({
    source: {type: String, required: true},
    lat: {type: Number, required: true},
    lon: {type: Number, required: true},
    infos: new Schema({
        addresse: {type: String, required: false},
        code_postal: {type: String, required: false},

        zone: {type: String, required: false},
        apparence: {type: String, required: false},
        direction: {type: Number, required: false},
        angle: {type: Number, required: false},
        op_type: {type: String, enum: ["public","private", ], required: false},
    })
});

module.exports = db.model('Camera', CameraSchema);