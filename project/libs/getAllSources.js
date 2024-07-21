const fs = require("fs/promises");
const {scrappersPath} = require("../paths");

let sources = null;

async function getAllSources() {
    if (sources === null) {
        sources = await fs.readdir(scrappersPath)
        .then(files => 
            files
            .filter(file => file !== ".keep")
            .map(file => file.replace(".js",""))
        )
    }
    return sources;
}

module.exports = getAllSources;