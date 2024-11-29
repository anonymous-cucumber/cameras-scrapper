function adminAuthMiddleware(req, res, next) {
    const { authorization } = req.headers;

    if (authorization === null)
        return res.sendStatus(401);

    const [method, b64login] = authorization.split(" ");
    if (method !== "Basic")
        return res.sendStatus(400)

    const [user, password] = Buffer.from(b64login, 'base64').toString().split(":");
    if (user !== "admin" || password !== process.env.LOCAL_ADMIN_API_TOKEN)
        return res.sendStatus(401);

    next();
}

module.exports = {adminAuthMiddleware};