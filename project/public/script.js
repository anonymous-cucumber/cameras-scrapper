let mapWidth,mapHeight, map;
let markers = [];
let currentPolygon = null;
let currentPolygonCoordinates = null;

function fetchCameras(){
    const {lat: lat2, lng: lng1} = map.containerPointToLatLng(L.point(0, 0))

    const {lat: lat1, lng: lng2} = map.containerPointToLatLng(L.point(mapWidth, mapHeight))

    fetch(`/api/cameras?bbox=${[lng1,lat1,lng2,lat2].join(",")}&width=${mapWidth}&height=${mapHeight}`)
        .then(res => res.json())
        .then(datas => {
            cleanMarkers()

            for (const data of datas) {
                const {lat, lon, type, count} = data
                const marker = new L.Marker({lat, lng: lon}, {
                    icon: type === "zone" ? 
                        new L.DivIcon({ html: `<div class="zone-tooltip">${count}</div>`}) : 
                        new L.Icon({
                            iconUrl: "/cctv.png",
                            iconSize: [25, 25]
                        })
                    })
                        
                if (type === "zone") {
                    const {lat1,lon1,lat2,lon2} = data
                    marker.on("click", () => {
                        if (currentPolygon !== null) {
                            map.removeLayer(currentPolygon);
                            currentPolygon = null;
                            if (!Object.entries(currentPolygonCoordinates).some(([key,value]) => data[key] !== value))
                                return;
                        }
                        currentPolygon = L.geoJSON({
                            coordinates: [
                                [
                                    [lon1,lat1], [lon2,lat1],
                                    [lon2,lat2], [lon1,lat2]
                                ]
                            ],
                            type: "Polygon"
                        }).addTo(map);
                        currentPolygonCoordinates = {lat1,lon1,lat2,lon2}
                    });
                }
                map.addLayer(marker);

                markers.push(marker);
            }
        })
}
function cleanMarkers() {
    if (currentPolygon !== null) {
        map.removeLayer(currentPolygon);
        currentPolygon = null;
        currentPolygonCoordinates = null;
    }
    for (const marker of markers) {
        map.removeLayer(marker)
    }
    markers = [];
}


document.addEventListener("DOMContentLoaded", () => {
    map = L.map('map').setView([47.272899, 2.446147], 6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const {offsetWidth, offsetHeight} = document.getElementById("map")
    mapWidth = offsetWidth;
    mapHeight = offsetHeight;

    fetchCameras();
    map.on("moveend", fetchCameras)
})