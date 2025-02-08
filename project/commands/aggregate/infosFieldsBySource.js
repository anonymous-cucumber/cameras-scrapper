function getSurveillanceUnderSurveillanceType(infos) {
    const surveillanceTypes = infos.surveillance.split(",")

    const nonUnknownType = surveillanceTypes.map(surveillanceType => {
        switch(surveillanceType) {
            case "outdoor":
                return "private";
            case "public":
                return "public";
            default:
                return "unknown";
        }
    }).find(deductedType => deductedType !== "unknown");

    return nonUnknownType??"unknown";
}

const infosFieldsBySource = {
    parisPoliceArcgis: (infos, lat, lon) => ({
        parisPoliceArcgis: {
            adresse: infos.adresse,
            code_postal: infos.code_postal,
            lat,
            lon
        },
        type: "official",
        zone: "paris"
    }),
    camerci: (infos, lat, lon) => ({
        camerci: {
            desc: infos,
            lat,
            lon
        },
        type: "official"
    }),
    sousSurveillanceNet: (infos, lat, lon) => ({
        sousSurveillanceNet: {
            zone: infos.zone,
            apparence: infos.apparence,
            direction: infos.direction,
            angle: infos.angle,
            op_type: infos.op_type,
            lat,
            lon
        },
        type: ["public","private"].includes(infos.op_type) ? infos.op_type : "unknown",
        zone: infos.zone
    }),
    surveillanceUnderSurveillance: (infos, lat, lon) => {
        const camera_direction = parseInt(infos["camera:direction"]);

        return {
            surveillanceUnderSurveillance: {
                description: infos.description,
                camera_direction: isNaN(camera_direction) ? undefined : camera_direction,
                camera_mount: infos["camera:mount"],
                camera_type: infos["camera:type"],
                surveillance: infos.surveillance.split(","),
                lat,
                lon
            },
            type: getSurveillanceUnderSurveillanceType(infos)
        }
    },
    umapAngers: (infos, lat, lon) => {
        return {
            umapAngers: {
                name: infos.name,
                lat,
                lon
            },
            type: "unknown"
        }
    }
};

module.exports = infosFieldsBySource;