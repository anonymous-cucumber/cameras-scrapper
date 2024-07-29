const getAllSources = require("./getAllSources");

const queriesParser = {
    getCameras: {
        bbox: (bbox) => {
            if (bbox === undefined) return "error";

            const splittedBbox = bbox.split(",");
            if (splittedBbox.length !== 4) return "error";
    
            const computedBbox = splittedBbox.map(v => parseFloat(v.trim()));
            if (computedBbox.find(v => isNaN(v))) return "error";

            const [lon1,lat1,lon2,lat2] = computedBbox;

            if (lon1 > lon2 || lat1 > lat2) return "error";

            return computedBbox;
        },
        width: (width) => {
            if (width === undefined) return "error";

            width = parseInt(width);
            return (isNaN(width) || width < 0) ? "error" : width;
        },
        height: (height) => {
            if (height === undefined) return "error";

            height = parseInt(height);
            return (isNaN(height) || height < 0) ? "error" : height;
        },
        doGetAllCameras: (value) => value === "true",
        coordinatesSources: async (value) => (value instanceof Array || value === undefined) ? value : "error",
        infosSources: async (value) => (value instanceof Array || value === undefined) ? value : "error",
        types: (value) => (value instanceof Array || value === undefined) ? value : "error"
    }
}

async function parseQueries(queries, queryType) {
    if (queriesParser[queryType] === undefined)
        throw new Error(`The '${queryType}' query type does not exist`);

    const parsedQueries = {};
    for (const [key,parser] of Object.entries(queriesParser[queryType])) {
        const parsed = await parser(queries[key]);
        if (parsed === "error") return null;
        parsedQueries[key] = parsed
    }

    return parsedQueries;
}

module.exports = parseQueries;