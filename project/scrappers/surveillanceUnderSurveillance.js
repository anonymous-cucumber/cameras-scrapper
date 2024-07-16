const {calcDistanceBetween,destinationPointLat,destinationPointLon} = require("../libs/convert");

const bboxes = {
    france: {lat1: 42.332792, lon1: -5.142053, lat2: 51.089147, lon2: 8.233550}
};

const searchsSize = {horizontal: 1, vertical: 1} // Exprimed in degree

function valid(bbox) {
    if (bboxes[bbox])
        return {success: true, data: bboxes[bbox]};
    return {success: false, msg: `The bbox "${bbox}" does not exist`}
}

function scrapper({lat1, lon1, lat2, lon2}) {
    const verticalDistance = calcDistanceBetween(lat1,lon1,lat2,lon1);
    const verticalNbSearchs = Math.floor(verticalDistance/searchsSize.vertical);
    const verticalModulo = verticalDistance%searchsSize.vertical;

    let searchLat1 = lat1;
    let searchLon1 = lon1;
    for (let i=0;i<verticalNbSearchs;i++) {
        const searchLat2 = destinationPointLat(searchLat1, false, searchsSize.vertical);

        const horizontalDistance = calcDistanceBetween(searchLat2,lon1,searchLat2,lon2);
        const horizontalNbSearchs = Math.floor(horizontalDistance/searchsSize.horizontal);
        const horizontalModulo = horizontalDistance%searchsSize.horizontal;
        console.log({searchLat1, searchLat2, horizontalDistance});

        for (let j=0;j<horizontalNbSearchs;j++) {
            const searchLon2 = destinationPointLon(searchLat2, searchLon1, true, searchsSize.horizontal);

            //console.log({lat1, lon1, lat2, lon2});

            searchLon1 = searchLon2
        }
        const searchLon2 = destinationPointLon(searchLat2, lon1, true, horizontalModulo);

        searchLat1 = searchLat2;
    }
    const searchLat2 = destinationPointLat(searchLat1, false, verticalModulo);
}

module.exports = {scrapper, valid};