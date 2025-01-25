const scrapOverpass = require("../libs/scrapping/scrapOverpass");

const bboxes = {
    france: [-5.142053, 42.332792, 8.233550, 51.089147],
    paris: [2.258395, 48.815729, 2.415771, 48.901457]
};

const searchsSize = {horizontal: 0.25, vertical: 0.25}; // Exprimed in degrees

const source = "//overpass-api.de/api/interpreter";

const query = "node[man_made=surveillance];way[man_made=surveillance];relation[man_made=surveillance]"

function valid(bbox) {
    if (bbox === undefined)
        return {
            success: false, 
            msg: "You need to mention a bbox on the 'allOverpassOsm' scrapper.\n"+
                 "Existing bboxes : "+Object.keys(bboxes).join(", ")
        }
    if (bboxes[bbox])
        return {success: true, data: bbox};
    return {success: false, msg: `The bbox "${bbox}" does not exist`}
}


function scrapper(bbox) {
    return scrapOverpass(source, bboxes[bbox], searchsSize, query)
}

module.exports = {scrapper, valid};