function getIn(obj,path) {
    if (typeof(path) === "string")
        path = path.split(".");

    if (path.length === 0)
        return obj;

    const value = obj[path[0]];
    if (typeof(value) !== "object" || value === null)
        return value

    return getIn(value, path.slice(1));    
}

module.exports = {getIn};