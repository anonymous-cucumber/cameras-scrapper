const express = require("express");
const camerasRouter = require("./api/cameras");
const dumpRouter = require("./api/dump");

const app = express();

app.use(express.static('public'));

app.use("/api/cameras", camerasRouter);
app.use("/api/dump", dumpRouter);

app.listen(process.env.HTTP_SERVER_PORT ?? 8000, () => {console.log("server started on "+(process.env.HTTP_SERVER_PORT ?? 8000))})