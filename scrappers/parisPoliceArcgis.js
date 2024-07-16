const scrapArcgis = require("../libs/scrapping/scrapArcgis");

function scrapper() {
    return scrapArcgis("https://arcg.is/08y0y10")
}

module.exports = scrapper;