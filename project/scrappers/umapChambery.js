const scrapUmap = require("../libs/scrapping/scrapUmap");

const umapId = "985787";
const publicCamerasDataLayerId = "a09b2d72-a37b-4c96-a229-383259e18d6c";
const privateCamerasDatalayerId = "136d48d4-3a59-4d47-b180-9d4e970f6e1f"

function scrapper() {
  // https://umap.openstreetmap.fr/fr/map/lesyeuxdechambery_985787
  return Promise.all([
    scrapUmap(umapId,publicCamerasDataLayerId)
    .then(lines => 
        lines.map(({lat, lon, infos}) => ({
            lat, lon, infos: {...infos, type: "public"}
        }))
    ),
    scrapUmap(umapId,privateCamerasDatalayerId)
    .then(lines => 
      lines.map(({lat, lon, infos}) => ({
        lat, lon, infos: {...infos, type: "private"}
      }))
    ),
  ]).then(scraps => scraps.flat())
}

module.exports = {scrapper}