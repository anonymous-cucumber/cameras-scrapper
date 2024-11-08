const {createReadStream} = require("fs");
const { generateObjFromCsvLine } = require("./csvFormatter");


function lazyReadCsv(path, callback, params = {}) {
    const delimiter = params.delimiter ?? ";";
    let acc = params.acc ?? null;
    const model = params.model ?? null;

    return new Promise((resolve,reject) => {
        const readableStream = createReadStream(path, 'utf8');

        readableStream.on('error', function (error) {
            reject(error)
        });

        let indexLine = 0;
        let linesToBrowse = [];
        let restData = null;
        let header = null;

        let browsing = false;
        let closed = false;

        const browseLines = async () => {
            if (!browsing)
                browsing = true;
            if (linesToBrowse.length === 0) {
                if (closed)
                    resolve(acc);
                browsing = false;
                return;
            }
            const line = linesToBrowse.shift();
            const obj = generateObjFromCsvLine(header, line, delimiter, model);
            acc = await callback(acc,obj,indexLine);
            indexLine += 1;
            await browseLines();
        }
    
        readableStream.on('data', (chunk) => {
            const lines = ((restData??"") + chunk.toString()).split("\n")
            if (header === null) {
                header = lines.shift().split(delimiter)
            }
            restData = lines.pop();

            linesToBrowse = linesToBrowse.concat(lines);

            if (!browsing)
                browseLines();
        });

        readableStream.on('close', async () => {
            closed = true
            if (restData) {
                linesToBrowse.push(restData)
                if (!browsing)
                    browseLines()
            } else if (!browsing) {
                resolve(acc);
            }
        });
    })
}

module.exports = lazyReadCsv;