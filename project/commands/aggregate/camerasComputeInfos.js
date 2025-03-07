const getAllSources = require("../../libs/getAllSources");

function getTypeFromSurveillanceUnderSurveillance(infos) {
    const surveillanceTypes = (infos.surveillance ?? "").split(",")

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

function getTypeFromSourceAndComputedInfos(source, computedInfos) {
    switch (source) {
        case "parisPoliceArcgis":
        case "camerci":
            return "official";

        case "sousSurveillanceNet":
            return ["public","private"].includes(computedInfos.op_type) ? computedInfos.op_type : "unknown"
        
        case "surveillanceUnderSurveillance":
        case "allOverpassOsm":
            return getTypeFromSurveillanceUnderSurveillance(computedInfos)

        case "umapAngers":
            return "unknown";
    }
    throw new Error(`Invalid source type on cameras aggregation : "${source}"`)
}

const weightByType = {
    unknown: 0,
    private: 1,
    public: 1,
    official: 2
}
function getSourceCamWithStrongestType(infos) {
    return (
        getAllSources()
        .filter(source => infos[source])
        .map((source) => [source, getTypeFromSourceAndComputedInfos(source, infos[source])])
        .reduce(([strongestSource, strongestType], [source, type]) => {
        
            if (strongestType === null || weightByType[type] > weightByType[strongestType])
                return [source, type]
        
            return [strongestSource, strongestType];
        
        }, [null, null])
    )
}


function getComputedInfosBySource(source, infos, lat, lon) {
    let camera_direction;
    switch (source) {
        case "parisPoliceArcgis":
            return {
                adresse: infos.adresse,
                code_postal: infos.code_postal,
                lat,
                lon
            }
        
        case "camerci":
            return {
                desc: infos,
                lat,
                lon
            }

        case "sousSurveillanceNet":
            return {
                zone: infos.zone,
                apparence: infos.apparence,
                direction: infos.direction,
                angle: infos.angle,
                op_type: infos.op_type,
                lat,
                lon
            }

        case "surveillanceUnderSurveillance":
            camera_direction = parseInt(infos["camera:direction"]);

            return {
                description: infos.description,
                camera_direction: isNaN(camera_direction) ? undefined : camera_direction,
                camera_mount: infos["camera:mount"],
                camera_type: infos["camera:type"],
                surveillance: infos.surveillance,
                lat,
                lon
            }

        case "allOverpassOsm":
            const {tags} = infos;
            camera_direction = parseInt(tags["camera:direction"]);

            return {
                description: tags.description,
                camera_direction: isNaN(camera_direction) ? undefined : camera_direction,
                camera_mount: tags["camera:mount"],
                camera_type: tags["camera:type"],
                surveillance: tags.surveillance,
                lat,
                lon
            }

        case "umapAngers":
            return {
                name: infos.name,
                lat,
                lon
            }
    }

    throw new Error(`Invalid source type on cameras aggregation : "${source}"`)
};

module.exports = {getComputedInfosBySource, getTypeFromSourceAndComputedInfos, getSourceCamWithStrongestType};