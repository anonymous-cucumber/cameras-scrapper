const promiseConcurrency = require("../libs/promiseConcurrency");
const replaceAll = require("../libs/replaceAll");
const request = require("../libs/request");
const getSearchBBoxes = require("../libs/getSearchBBoxes");
const RequestTimeout = require("../libs/exceptions/RequestTimeout");
const range = require("../libs/range");

const bboxes = {
    france: {
        coords: [42.332792, -5.142053, 51.089147, 8.233550], 
        searchsSize: {horizontal: 1/4, vertical: 1/4}
    },
    paris: {
        coords: [48.815729, 2.258395, 48.901457, 2.415771], 
        searchsSize: {horizontal: 1/16, vertical: 1/16}
    },
};

const maxDepth = 4;

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

function fetchCamerasInZone({coords, searchsSize: {vertical, horizontal}}, depth = 1) {
    return promiseConcurrency(
        getSearchBBoxes(coords, vertical, horizontal).map(({lat1, lon1, lat2, lon2, zoneId}) => async () => {
            console.log(`${range(depth-1).map(() => "\t").join("")}Scrapping on rectangle ${[lon1,lat1,lon2,lat2].join(", ")} (vertical: ${vertical}, horizontal: ${horizontal}) (${zoneId})`)

            return request(
                getUrl(lat1, lon1, lat2, lon2)
            )
            .then(str => JSON.parse(replaceAll(str,"\n","\\n")))
            .catch(e => {
                if (!(e instanceof RequestTimeout)) throw e;

                if (depth > maxDepth) throw new Error("Max depth of cameras fetching exeeded")

                console.log(`${range(depth).map(() => "\t").join("")}Timeout !`)
                return fetchCamerasInZone({
                    coords: [lat1, lon1, lat2, lon2], 
                    searchsSize: {vertical: vertical/2, horizontal: horizontal/2}
                }, depth+1)
            })
        }), 8, (i,total) => {
            if (depth === 1) { 
                console.log((Math.round((i/total)*10000)/100)+"%")
            }
        }
    ).then(lists =>
        lists
        .reduce((acc,list) => acc.concat(list), [])
    )
}

function scrapper(bbox) {
    return fetchCamerasInZone(bboxes[bbox])
            .then(cameras => cameras.map(({lat,lon, ...infos}) => ({lat,lon,infos})))
}

module.exports = {scrapper, valid};