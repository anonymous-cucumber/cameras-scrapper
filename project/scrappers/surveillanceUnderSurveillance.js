const promiseConcurrency = require("../libs/promiseConcurrency");
const replaceAll = require("../libs/replaceAll");
const request = require("../libs/request");

const bboxes = {
    france: {lat1: 42.332792, lon1: -5.142053, lat2: 51.089147, lon2: 8.233550},
    paris: {lat1: 48.815729, lon1: 2.258395, lat2: 48.901457, lon2: 2.415771}
};

const searchsSize = {horizontal: 0.5, vertical: 0.5} // Exprimed in degrees

const getUrl = (lat1, lon1, lat2, lon2) => 
    `https://sunders.uber.space/camera.php?bbox=${lon1},${lat1},${lon2},${lat2}&zoom=16&width=1848&height=539`

function valid(bbox) {
    if (bbox === undefined)
        return {
            success: false, 
            msg: "You need to mention a bbox on the 'surveillanceUnderSurveillance' scrapper.\n"+
                 "Existing bboxes : "+Object.keys(bboxes).join(", ")
        }
    if (bboxes[bbox])
        return {success: true, data: bbox};
    return {success: false, msg: `The bbox "${bbox}" does not exist`}
}

function getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo) {
    const bboxes = [];
    for (let j=0;j<horizontalNbSearchs;j++) {
        const searchLon2 = searchLon1+searchsSize.horizontal;

        bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2});

        searchLon1 = searchLon2
    }
    const searchLon2 = searchLon1+horizontalModulo;
    bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2});
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

        bboxes = bboxes.concat(getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo));

        searchLat1 = searchLat2;
        searchLon1 = lon1;
    }
    const searchLat2 = searchLat1+verticalModulo;
    bboxes = bboxes.concat(getHorizontalSearchBBoxes(searchLat1, searchLat2, searchLon1, horizontalNbSearchs, horizontalModulo));

    return bboxes;
}

function scrapper(bbox) {
    return promiseConcurrency(
        getSearchBBoxes(bboxes[bbox]).map(({lat1, lon1, lat2, lon2}) => async () => {
            console.log("Scrapping on rectangle "+[lon1,lat1,lon2,lat2].join(","))
            return request(getUrl(lat1, lon1, lat2, lon2)).then(str => JSON.parse(replaceAll(str,"\n","\\n")));
        }), 10, (i,total) => {
            console.log((Math.round((i/total)*10000)/100)+"%")
        }
    ).then(lists => 
        lists
        .reduce((acc,list) => acc.concat(list), [])
        .map(({lat,lon, ...infos}) => ({lat,lon,infos}))
    )
}

module.exports = {scrapper, valid};