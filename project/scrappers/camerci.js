const request = require("../libs/request");

const dataUrl = "https://camerci.fr/data/";
// Create fake user agent, else, website return 403
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:124.0) Gecko/20100101 Firefox/124.0"
}

async function scrapper() {
    const index = await request(dataUrl+"/index.csv", {headers});
    
    const csvs = await Promise.all(index.split("\n").slice(1).map(line =>
        request(dataUrl+line.split(",")[0]+".csv", {headers})
    ))
    
    return csvs.map((csv) =>
        csv.split("\n").slice(1).map(line => {
            const splittedLine = line.split(",");
            if (splittedLine.length !== 3 || splittedLine.some(v => v === ""))
                return null
            return {
                lat: parseFloat(splittedLine[1]),
                lon: parseFloat(splittedLine[0]),
                infos: (splittedLine[2]??"").replace(/\r|\n/g, "")
            }
        })
    ).reduce((acc,lines) => acc.concat(lines), [])
}

module.exports = scrapper;