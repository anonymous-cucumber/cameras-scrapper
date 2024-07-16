const request = require("../libs/request");

const url = "https://www.sous-surveillance.net/spip.php?page=cameras&format=json&details=2&lang=fr";

async function scrapper() {
    const res = await request(url).then(res => JSON.parse(res));
    return res.features.map(({properties, geometry}) => ({
        properties,
        description: properties.id_camera+" - "+properties.zone,
        lat: geometry.coordinates[1],
        lon: geometry.coordinates[0]
    }))
}

module.exports = scrapper;