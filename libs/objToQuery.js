function objToQuery(obj) {
    return Object.entries(obj)
        .map(([key,value]) => key+"="+value)
        .join("&")
}

module.exports = objToQuery;