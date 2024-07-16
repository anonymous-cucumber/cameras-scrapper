const request = require("../request");
const objToQuery = require("../objToQuery");
const {wgs84WebMercatorToWgs84LatLon} = require("../convert");

function queryAllMapLayer(url) {
    const query = {
        where: '1=1',
        outFields: '*',
        f: 'json'
    }
    return request(`${url}/query?${objToQuery(query)}`).then(res => JSON.parse(res))
}

function getDataItem(viewerHost, id) {
    return request(`${viewerHost}/sharing/rest/content/items/${id}/data?f=json`)
        .then(res => JSON.parse(res))
}

async function scrapArcgis(url) {
    const viewerUrl = url.split("/")[2] === "arcg.is" ?
        await request(url, {getHeaders: true}).then(({headers: {location}}) => location) :
        url
    const viewerHost = viewerUrl.split("/").slice(0,3).join("/")
    
    const viewerId = viewerUrl.match(/id=[0-9a-f]+/g)[0].split("=")[1]

    const viewerDataItem = await getDataItem(viewerHost, viewerId);

    const mapId = viewerDataItem.map.itemId

    const mapDataItem = await getDataItem(viewerHost, mapId);

    const {operationalLayers} = mapDataItem;
    const layers = await Promise.all(operationalLayers.map(({url}) => queryAllMapLayer(url)))
    return layers.reduce((acc,layer) => 
        acc.concat(
                layer.features.map(feature => ({
                    infos: feature.attributes,
                    ...wgs84WebMercatorToWgs84LatLon(feature.geometry.x,feature.geometry.y)
                }))
        ), 
    [])
}

module.exports = scrapArcgis