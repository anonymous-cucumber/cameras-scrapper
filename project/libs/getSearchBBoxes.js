function getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo, horizontalPartSize) {
    const bboxes = [];
    for (let j=0;j<horizontalNbSearchs;j++) {
        const searchLon2 = searchLon1+horizontalPartSize;

        bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2});

        searchLon1 = searchLon2
    }
    const searchLon2 = searchLon1+horizontalModulo;
    bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2});
    return bboxes;
}
function getSearchBBoxes({lat1, lon1, lat2, lon2},verticalPartSize,horizontalPartSize) {
    const verticalDistance = lat2-lat1;
    const verticalNbSearchs = Math.floor(verticalDistance/verticalPartSize);
    const verticalModulo = verticalDistance%verticalPartSize;

    const horizontalDistance = lon2-lon1;
    const horizontalNbSearchs = Math.floor(horizontalDistance/horizontalPartSize);
    const horizontalModulo = horizontalDistance%horizontalPartSize;

    let bboxes = [];

    let searchLat1 = lat1;
    let searchLon1 = lon1;
    for (let i=0;i<verticalNbSearchs;i++) {
        const searchLat2 = searchLat1+verticalPartSize;

        bboxes = bboxes.concat(getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo, horizontalPartSize));

        searchLat1 = searchLat2;
        searchLon1 = lon1;
    }
    const searchLat2 = searchLat1+verticalModulo;
    bboxes = bboxes.concat(getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo, horizontalPartSize));

    return bboxes;
}

module.exports = getSearchBBoxes;