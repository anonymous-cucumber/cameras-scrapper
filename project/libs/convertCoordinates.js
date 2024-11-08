function wgs84WebMercatorToWgs84LatLon(x,y) {
    const lon = (x / 20037508.34) * 180.0
    const lat0 = (y / 20037508.34) * 180.0;
    const lat = 180.0 /
          Math.PI *
          (2 * Math.atan(Math.exp(lat0 * Math.PI / 180.0)) - Math.PI / 2);
    return {lat,lon}
}


const toRad = (deg) => deg * Math.PI / 180;
 
const toDeg = (rad) => rad * 180 / Math.PI;

const calcDistanceBetween = (lat1,lon1,lat2,lon2) =>
	Math.acos(Math.sin(toRad(lat1))*Math.sin(toRad(lat2))+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lon1-lon2)))*6371*1000
 
const calcDistOnLat = (lat1,brng,dist) => Math.asin(Math.sin(lat1) * Math.cos(dist) +  Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));
const calcDistOnLon = (lon1,lat1,lat2,brng,dist) => (
   lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
   Math.cos(lat1), 
   Math.cos(dist) - Math.sin(lat1) *
   Math.sin(lat2))
);

function destinationPointLat(lat, bottom, dist) {
   dist = dist / 1000 / 6371;  
   brng = toRad(bottom ? 180 : 0);  
   const lat1 = toRad(lat);

   return toDeg(calcDistOnLat(lat1, brng, dist))
}
function destinationPointLon(lat, lon, right, dist) {
   dist = dist / 1000 / 6371;  
   brng = toRad(right ? 90 : -90);  
   const lat1 = toRad(lat);
   const lon1 = toRad(lon);

   return toDeg(calcDistOnLon(lon1, lat1, lat1, brng, dist))
}
 
function destinationPoint({lat, lon}, brng, dist) {
   dist = dist / 1000 / 6371;  
   brng = toRad(brng);  
 
   const lat1 = toRad(lat), lon1 = toRad(lon);
 
   const lat2 = calcDistOnLat(lat1, brng, dist);
 
   const lon2 = calcDistOnLon(lon1,lat1,lat2,brng,dist);
 
   if (isNaN(lat2) || isNaN(lon2)) return null;
 
   return {lat: toDeg(lat2), lon: toDeg(lon2)}
}

module.exports = {wgs84WebMercatorToWgs84LatLon, destinationPoint, destinationPointLat, destinationPointLon, calcDistanceBetween};