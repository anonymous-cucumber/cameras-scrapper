function stringifyQuery(queryObj) {
    const keys = Object.keys(queryObj);
    if (keys.length === 0) return "";

    return "?"+keys.flatMap((key) => {
        if (typeof(queryObj[key]) !== "object" || queryObj[key] === null)
            return [`${key}=${queryObj[key]}`]
        
        if (Array.isArray(queryObj[key]))
            return queryObj[key].map(value => `${key}[]=${value}`)
        
        return Object.keys(queryObj[key]).map(subKey => `${key}[${subKey}]=${queryObj[key][subKey]}`);
    }).join("&")
}

module.exports = stringifyQuery;