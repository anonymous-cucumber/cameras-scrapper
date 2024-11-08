const { getIn, putIn } = require("./mapUtils");

const headerArrayByModel = {};

function generateHeaderArrayFromModel(model, prefix = "") {
    return Object.entries(model.schema.paths).reduce((acc,[key,field]) => ([
        ...acc,
        ...(
            field.schema === undefined ? 
                [prefix+key] :
                generateHeaderArrayFromModel(field, prefix+key+".")
        )
    ]), [])
}
function getHeaderArrayFromModel(model) {
    if (headerArrayByModel[model.collection.collectionName] === undefined) {
        headerArrayByModel[model.collection.collectionName] = generateHeaderArrayFromModel(model)
    }
    return headerArrayByModel[model.collection.collectionName];
}

function generateHeaderFromModel(model, delimiter = ";") {
    return getHeaderArrayFromModel(model).join(delimiter);
}

function generateLineFromModel(model,data, delimiter = ";") {
    return getHeaderArrayFromModel(model).map(key => {
        let value = getIn(data, key);
        if (value instanceof Date)
            value = value.toISOString();
        return value;
    }).join(";")
}

function generateLinesFromModel(model, datas, delimiter = ";") {
    return datas.map(data => generateLineFromModel(model, data, delimiter)).join("\n")
}

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
            return new Date(value)
    }
    return value
}

function getModelTypeFromPath(model, path) {
    return getIn(model, path, (obj, key) => obj.schema.paths[key]).instance
}

module.exports = {getModelTypeFromPath,generateHeaderFromModel, generateLineFromModel, generateLinesFromModel, generateObjFromCsvLine}