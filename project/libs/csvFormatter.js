const { getIn } = require("./mapUtils");

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

module.exports = {generateHeaderFromModel, generateLineFromModel, generateLinesFromModel}