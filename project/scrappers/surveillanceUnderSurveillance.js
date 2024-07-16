const bboxes = {
    france: {lat1: 42.332792, lon1: -5.142053, lat2: 51.089147, lon2: 8.233550},
    paris: {lat1: 48.815729, lon1: 2.258395, lat2: 48.901457, lon2: 2.415771}
};

const searchsSize = {horizontal: 1, vertical: 1} // Exprimed in degree

function valid(bbox) {
    if (bboxes[bbox])
        return {success: true, data: bboxes[bbox]};
    return {success: false, msg: `The bbox "${bbox}" does not exist`}
}

function getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo) {
    const bboxes = [];
    for (let j=0;j<horizontalNbSearchs;j++) {
        const searchLon2 = searchLon1+searchsSize.horizontal;

        bboxes.push({searchLat1, searchLon1, searchLat2, searchLon2});

        searchLon1 = searchLon2
    }
    const searchLon2 = searchLon1+horizontalModulo;
    bboxes.push({searchLat1, searchLon1, searchLat2, searchLon2});
    return bboxes;
}
function getSearchBBoxes({lat1, lon1, lat2, lon2}) {
    const verticalDistance = lat2-lat1;
    const verticalNbSearchs = Math.floor(verticalDistance/searchsSize.vertical);
    const verticalModulo = verticalDistance%searchsSize.vertical;

    const horizontalDistance = lon2-lon1;
    const horizontalNbSearchs = Math.floor(horizontalDistance/searchsSize.horizontal);
    const horizontalModulo = horizontalDistance%searchsSize.horizontal;

    let bboxes = [];

    let searchLat1 = lat1;
    let searchLon1 = lon1;
    for (let i=0;i<verticalNbSearchs;i++) {
        const searchLat2 = searchLat1+searchsSize.vertical;

        console.log("VERTICAL ----------------------------------------------------------------------------------------------------------------------")

        bboxes = bboxes.concat(getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo));

        searchLat1 = searchLat2;
        searchLon1 = lon1;
    }
    const searchLat2 = searchLat1+verticalModulo;
    bboxes = bboxes.concat(getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo));

    return bboxes;
}

function scrapper(params) {
    console.log(getSearchBBoxes(params))
}

module.exports = {scrapper, valid};