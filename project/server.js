const express = require("express");
const Camera = require("./models/Camera");

const app = express();

app.use(express.static('public'));

app.get("/api/cameras/paris", (req,res) => {
    Camera.find({
        $or: [
            {
                "infos.zone": "paris",
            },
            {
                infos_sources: "parisPoliceArcgis",
                "infos.code_postal": /^75/i
            }
        ]
    }).then(cameras => res.json(cameras))
})

app.listen(process.env.HTTP_SERVER_PORT ?? 8000, () => {console.log("server started on "+(process.env.HTTP_SERVER_PORT ?? 8000))})