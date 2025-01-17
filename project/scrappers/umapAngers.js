const scrapUmap = require("../libs/scrapping/scrapUmap");

function scrapper() {
    // https://umap.openstreetmap.fr/fr/map/publicites-angers_1109346
    return scrapUmap("1109346","e61879f9-b07a-428b-9a3b-b1dc7115d63b");
}

module.exports = {scrapper}