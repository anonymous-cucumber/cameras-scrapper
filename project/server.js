const express = require("express");
const camerasRouter = require("./routes/cameras");
const dumpRouter = require("./routes/admin/dump");
const wipeRouter = require("./routes/admin/wipe");
const {adminAuthMiddleware} = require("./middlewares");

const app = express();

app.use(express.static('public'));
app.use(express.json())

app.use("/api/cameras", camerasRouter);

app.use(adminAuthMiddleware);
app.use("/api/admin/dump", dumpRouter);
app.use("/api/admin/wipe", wipeRouter)

app.listen(process.env.HTTP_SERVER_PORT ?? 8000, () => {console.log("server started on "+(process.env.HTTP_SERVER_PORT ?? 8000))})