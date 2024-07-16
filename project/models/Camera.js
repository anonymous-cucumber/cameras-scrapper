const {Schema} = require("mongoose");
const {connect} = require("../Mongo");

const db = connect();

const CameraSchema = new Schema({
    coordinates_source: {type: String, required: true},
    lat: {type: Number, required: true},
    lon: {type: Number, required: true},
    
    infos_sources: [{type: String, required: true}],
    infos: new Schema({
        parisPoliceArcgis: new Schema({
            adresse: {type: String, required: false},
            code_postal: {type: String, required: false},
        }),

        camerci: new Schema({
            desc: {type: String, required: false}
        }),

        surveillanceUnderSurveillance: new Schema({
            description: {type: String, required: false},
            camera_direction: {type: Number, required: false},
            camera_mount: {type: String, required: false},
            camera_type: {type: String, required: false},
            surveillance: {type: String, required: false}
        }),

        sousSurveillanceNet: new Schema({
            zone: {type: String, required: false},
            apparence: {type: String, required: false},
            direction: {type: Number, required: false},
            angle: {type: Number, required: false},
            op_type: {type: String, enum: ["public","private",""], required: false},
        }),

        type: {type: String, enum: ["public","private",""], required: false}
    })
});

module.exports = db.model('Camera', CameraSchema);