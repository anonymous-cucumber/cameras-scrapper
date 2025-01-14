const request = require("../request");

async function scrapUmap(umapId, dataLayerId) {
    return request(`https://umap.openstreetmap.fr/fr/datalayer/${umapId}/${dataLayerId}/`)
    .then(res => JSON.parse(res))
    .then(({features}) =>
        features.map(feature => ({
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0],
            infos: feature.properties
        })
    ))
}

module.exports = scrapUmap;