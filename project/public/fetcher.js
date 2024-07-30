let markers = [];
let currentPolygon = null;
let currentPolygonCoordinates = null;

function stringifyQuery(queryObj) {
    return Object.entries(queryObj)
        .map(([key,value]) => {
            if (value === undefined || (value instanceof Array && value.length === 0)) 
                return null;
            if (value instanceof Array)
                return value.map(v => `${key}[]=${v}`).join("&")
            return `${key}=${value}`;
        }).filter(v => v !== null).join("&")
}

export function fetchCameras(map,filters){
    const {lat: lat2, lng: lng1} = map.containerPointToLatLng(L.point(0, 0))

    const {offsetWidth, offsetHeight} = document.getElementById("map")
    const {lat: lat1, lng: lng2} = map.containerPointToLatLng(L.point(offsetWidth, offsetHeight))

    const query = stringifyQuery({
        bbox: [lng1,lat1,lng2,lat2].join(","),
        width: offsetWidth,
        height: offsetHeight,
        ...Object.entries(filters).reduce((acc,[key,{value}]) => ({...acc, [key]: value}), {})
    })

    fetch("/api/cameras?"+query)
        .then(res => res.json())
        .then(datas => {
            cleanMarkers(map)

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
function cleanMarkers(map) {
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