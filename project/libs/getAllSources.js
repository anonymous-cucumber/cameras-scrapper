const fs = require("fs");
const {scrappersPath} = require("../paths");

let sources = null;

function getAllSources() {
    if (sources === null) {
        sources = fs.readdirSync(scrappersPath)
                    .filter(file => file !== ".keep")
                    .map(file => file.replace(".js",""))
    }
    return sources;
}

module.exports = getAllSources;