const scrapArcgis = require("../libs/scrapping/scrapArcgis");

function scrapper() {
    return scrapArcgis("https://arcg.is/08y0y10", ({attributes: {code_postal, adresse}}) => code_postal+" - "+adresse)
}

module.exports = scrapper;