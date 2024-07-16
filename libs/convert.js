function wgs84WebMercatorToWgs84LatLon(x,y) {
    const lon = (x / 20037508.34) * 180.0
    const lat0 = (y / 20037508.34) * 180.0;
    const lat = 180.0 /
          Math.PI *
          (2 * Math.atan(Math.exp(lat0 * Math.PI / 180.0)) - Math.PI / 2);
    return {lat,lon}
}

module.exports = {wgs84WebMercatorToWgs84LatLon};