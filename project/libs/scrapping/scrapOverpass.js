const OverpassFrontend = require('overpass-frontend')
const promiseConcurrency = require("../promiseConcurrency");
const getSearchBBoxes = require("../getSearchBBoxes");

function scrapOverpass(source, bbox, searchsSize, query) {
    const overpassFrontend = new OverpassFrontend(source)

    return promiseConcurrency(
        getSearchBBoxes(bbox, searchsSize.vertical, searchsSize.horizontal).map(({lat1, lon1, lat2, lon2}) => () => {
            return new Promise(resolve => {
                console.log("Scrapping on rectangle "+[lon1,lat1,lon2,lat2].join(","))

                let datas = [];

                overpassFrontend.BBoxQuery(
                    query,
                    { minlon: lon1, minlat: lat1, maxlon: lon2, maxlat: lat2 },
                    {
                        properties: OverpassFrontend.ALL
                    },
                    function (err, result) {
                        if (err) {
                            throw err;
                        }
                        datas.push(result.data);
                    },
                    function (err) {
                        if (err) {
                            throw err;
                        }
                        resolve(datas)
                    }
                )
            })
        }), 10, (i,total) => {
            console.log((Math.round((i/total)*10000)/100)+"%")
        }
    ).then(lists => 
        lists
        .reduce((acc,list) => acc.concat(list), [])
        .map(({lat,lon, ...infos}) => ({lat,lon,infos}))
    )
}

module.exports = scrapOverpass;