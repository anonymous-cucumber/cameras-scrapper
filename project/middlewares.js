const {writeLogs} = require("./libs/logsManager");

const pathsToLogs = [
    /^\/$/, // route '/'
    /^\/api\/(.*)/ // routes '/api/*'
]
async function logConnectionsMiddleware(req, res, next) {
    if (!pathsToLogs.some(regex => regex.test(req.path)))
        return next();

    const path = req.path;
    const queryString = Object.entries(req.query).map(([k,v]) => `${k}=${v}`).join("&")
    const method = req.method;

    writeLogs(`${method} ${path}${queryString !== "" ? "?"+queryString : ""}`);

    next()
}

module.exports = {logConnectionsMiddleware}