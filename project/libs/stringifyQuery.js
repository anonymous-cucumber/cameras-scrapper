function stringifyQuery(queryObj) {
    const keys = Object.keys(queryObj);
    if (keys.length === 0) return "";

    return "?"+keys.map((key) => `${key}=${queryObj[key]}`).join("&")
}

module.exports = stringifyQuery;