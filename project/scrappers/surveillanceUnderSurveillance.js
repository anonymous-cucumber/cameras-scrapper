const promiseConcurrency = require("../libs/promiseConcurrency");
const replaceAll = require("../libs/replaceAll");
const request = require("../libs/request");
const getSearchBBoxes = require("../libs/getSearchBBoxes");

const bboxes = {
    france: [-5.142053, 42.332792, 8.233550, 51.089147],
    paris: [2.258395, 48.815729, 2.415771, 48.901457]
};

const searchsSize = {horizontal: 0.125, vertical: 0.125} // Exprimed in degrees

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

function scrapper(bbox) {
    return promiseConcurrency(
        getSearchBBoxes(bboxes[bbox],searchsSize.vertical,searchsSize.horizontal).map(({lat1, lon1, lat2, lon2}) => async () => {
            console.log("Scrapping on rectangle "+[lon1,lat1,lon2,lat2].join(","))
            return request(getUrl(lat1, lon1, lat2, lon2)).then(str => JSON.parse(replaceAll(str,"\n","\\n")));
        }), 8, (i,total) => {
            console.log((Math.round((i/total)*10000)/100)+"%")
        }
    ).then(lists => 
        lists
        .reduce((acc,list) => acc.concat(list), [])
        .map(({lat,lon, ...infos}) => ({lat,lon,infos}))
    )
}

module.exports = {scrapper, valid};