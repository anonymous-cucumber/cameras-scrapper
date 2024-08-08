import labels from "./labels.js";

let markers = [];
let currentPolygon = null;
let currentPolygonCoordinates = null;

let popupPrototype = null;
export function setPopupPrototype() {
    popupPrototype = document.querySelector(".cam-popup.prototype");
}

const popupByCamId = {};

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

function getCameraImage(camera) {
    const {infos: {type}} = camera
    if (type === "private")
        return "cctvBlue.png";
    if (type === "public")
        return "cctvRed.png";
    return "cctvGrey.png"
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
                            iconUrl: `/images/${getCameraImage(data)}`,
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
                if (type === "camera") {
                    marker.on("click", () => {
                        if (!popupByCamId[data._id]) {
                            popupByCamId[data._id] = L.popup()
                            .setLatLng({lat, lng: lon})
                            .setContent(generatePopup(data))
                        }

                        popupByCamId[data._id].openOn(map)
                    })
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

function generatePopup(camera) {
    const popupContainer = popupPrototype.cloneNode(true)
    popupContainer.classList.remove("prototype");

    const sections = [
        {
            title: "Global",
            properties: [[labels.type,labels[camera.infos.type] ?? camera.infos.type],[labels.lat,camera.lat],[labels.lon,camera.lon]],
            defaultShow: true
        },
        ...Object.entries(camera.infos)
            .filter(([sectionKey]) => !["type","_id"].includes(sectionKey))
            .map(([sectionKey,properties]) => ({
                title: labels[sectionKey]??sectionKey, 
                properties: Object.entries(properties)
                    .filter(([key]) => key !== "_id")
            }))
    ]

    popupContainer.innerHTML = "";

    for (const {title,properties,defaultShow} of sections) {
        const popupSectionContainer = popupPrototype.querySelector(".cam-section").cloneNode(true);
        const titleBlockContainer = popupSectionContainer.querySelector(".cam-section-title-block");
        titleBlockContainer.querySelector("span").innerText = title;

        const arrow = titleBlockContainer.querySelector(".arrow");
        const propertiesContainer = popupSectionContainer.querySelector(".cam-section-properties");

        let shown = defaultShow??false;
        const hideOrShow = () => {
            arrow.classList[shown ? "add" : "remove"]("down");
            propertiesContainer.classList[shown ? "remove" : "add"]("hidden");
        }
        hideOrShow();
        titleBlockContainer.addEventListener("click", () => {
            shown = !shown;
            hideOrShow();
        });
        propertiesContainer.innerHTML = "";

        for (const [label,value] of properties) {
            const propertyContainer = popupPrototype.querySelector(".cam-section-property").cloneNode(true);

            const [labelContainer,valueContainer] = [1,2].map(n => propertyContainer.querySelector(`span:nth-child(${n})`))
            labelContainer.textContent = label+"\u00a0:\u00a0";
            valueContainer.textContent = value;

            propertiesContainer.appendChild(propertyContainer);
        }

        popupContainer.appendChild(popupSectionContainer);
    }

    return popupContainer;
}