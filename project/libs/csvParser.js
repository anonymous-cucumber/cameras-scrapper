const { putIn, getIn } = require("./mapUtils");
const replaceAll = require("./replaceAll");

function generateObjFromCsvLine(header, line, delimiter = ";", model = null) {
    if (typeof(header) === "string")
        header = header.split(delimiter);

    if (typeof(line) === "string")
        line = line.split(delimiter);

    let obj = {};
    for (let i=0;i<header.length;i++) {
        let [path,value] = [header[i],line[i]];

        if (value.trim() === "")
            continue;

        if (model !== null)
            value = castStringValueFromModelType(model, path, value)
        
        obj = putIn(obj, path, value)
    }

    return obj;
}

function castStringValueFromModelType(model, path, value) {
    const type = getModelTypeFromPath(model, path);
    switch (type) {
        case "Number":
            return parseFloat(value);
        case "Date":
            return new Date(value);
        case "String":
            return replaceAll(value, "\\n", "\n");
    }
    return value
}

function getModelTypeFromPath(model, path) {
    return getIn(model, path, (obj, key) => obj.schema.paths[key]).instance
}

module.exports = {getModelTypeFromPath, generateObjFromCsvLine}