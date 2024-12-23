const APIValidators = require("./validators/APIValidators");

async function parseQueries(queries, queryType) {
    if (APIValidators[queryType] === undefined)
        throw new Error(`The '${queryType}' query type does not exist`);

    const parsedQueries = {};
    for (const [key,parser] of Object.entries(APIValidators[queryType])) {
        const parsed = await parser(queries[key]);
        if (parsed === "error") return null;
        parsedQueries[key] = parsed
    }

    return parsedQueries;
}

module.exports = parseQueries;