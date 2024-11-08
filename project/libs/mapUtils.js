function getIn(obj, path, getValue = null) {
    if (typeof(path) === "string")
        path = path.split(".");

    if (path.length === 0)
        return obj;

    const value = getValue ? getValue(obj, path.shift()) : obj[path.shift()];
    if (typeof(value) !== "object" || value === null)
        return value

    return getIn(value, path, getValue);    
}

function putIn(obj,path,value) {
    if (typeof(path) === "string")
        path = path.split(".");
    
    if (path.length === 0)
        return value;
    
    const key = path.shift();

    obj[key] = putIn(obj[key]??{}, path, value)
    return obj;
}

module.exports = {getIn, putIn};