import labels from "./labels.js";
import { showTemporaryMessage } from "./libs.js";

let markedDatas = {};
let currentPolygon = null;
let currentPolygonCoordinates = null;

let abortController = null;
let timeout = null;

let currentBbox = null;
let prevBbox = null;

let currentZoom = null;
let prevZoom = null;

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
        return "cctvDarkBlue.png";

    if (type === "public")
        return "cctvRed.png";
    
    if (type === "official")
        return "cctvPurple.png"

    return "cctvGrey.png"
}

function setLoadingMessage(msg) {
    document.querySelector(".loading-text").innerText = msg;
}

export function killCamerasSearching() {
    if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
    }
    if (abortController !== null) {
        abortController.abort();
        abortController = null;
    }
}

export function searchAndShowCameras(map, filters) {
    killCamerasSearching();

    timeout = setTimeout(() => {
        timeout = null;
        searchCameras(map, filters)
        .then((datas) => showCameras(datas, map))
    }, 500)
}


function fetchCamera(id) {
    return fetch("/api/cameras/"+id).then(res => res.json());
}


function getCurrentBbox(map) {
    const {lat: lat2, lng: lng1} = map.containerPointToLatLng(L.point(0, 0))

    const {offsetWidth, offsetHeight} = document.getElementById("map")
    const {lat: lat1, lng: lng2} = map.containerPointToLatLng(L.point(offsetWidth, offsetHeight))

    return [lng1,lat1,lng2,lat2];
}

function searchCameras(map, filters) {

    currentBbox = getCurrentBbox(map);
    currentZoom = map.getZoom();
    
    const stringifiedCurrentBbox = currentBbox.join(",");
    const stringifiedPrevBbox = prevBbox !== null ? prevBbox.join(",") : "";

    const query = stringifyQuery({
        bbox: stringifiedCurrentBbox,
        prevBbox: (currentZoom === prevZoom && stringifiedCurrentBbox !== stringifiedPrevBbox) ? stringifiedPrevBbox : undefined,
        zoom: currentZoom,
        ...Object.entries(filters).reduce((acc,[key,{value}]) => ({...acc, [key]: value}), {})
    })
    setLoadingMessage("Chargement...");

    abortController = new AbortController();

    return fetch("/api/cameras?"+query, {signal: abortController.signal})
        .then(res => {
            abortController = null;
            return res.json();
        })
}

function showCameras(datas, map){
    cleanMarkers(map);

    for (const data of datas) {
        const {lat, lon, type} = data
        const marker = new L.Marker({lat, lng: lon}, {
            icon: type === "zone" ? 
                new L.DivIcon({ html: `<div class="zone-tooltip">${data.count}</div>`}) : 
                new L.Icon({
                    iconUrl: `/images/${getCameraImage(data)}`,
                    iconSize: [25, 25]
                })
            })
            
        let key = null;
            
        if (type === "zone") {
            const {lat1, lon1, lat2, lon2, zoneId} = data

            key = "zone-"+zoneId;

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
            
            key = "cam-"+data._id;

            marker.on("click", async () => {
                if (!popupByCamId[data._id]) {

                    const camera = await fetchCamera(data._id);

                    popupByCamId[data._id] = L.popup()
                    .setLatLng({lat, lng: lon})
                    .setContent(generatePopup(camera))
                }

                popupByCamId[data._id].openOn(map)
            })
        }

        if (key && markedDatas[key]) {
            map.removeLayer(markedDatas[key].marker);
            delete markedDatas[key];
        }

        markedDatas[key] = {marker, data};

        map.addLayer(marker);
    }

    prevBbox = currentBbox;
    prevZoom = currentZoom;
    setLoadingMessage("Chargé !");
}

function cleanMarkers(map) {
    if (currentPolygon !== null) {
        map.removeLayer(currentPolygon);
        currentPolygon = null;
        currentPolygonCoordinates = null;
    }

    const stringifiedCurrentBbox = currentBbox.join(",");
    const stringifiedPrevBbox = prevBbox !== null ? prevBbox.join(",") : "";

    const [bboxLng1,bboxLat1,bboxLng2,bboxLat2] = currentBbox;

    for (const [key,{marker, data}] of Object.entries(markedDatas)) {
        if (
            prevZoom !== currentZoom ||
            stringifiedCurrentBbox === stringifiedPrevBbox
        ) {
            delete markedDatas[key];
            map.removeLayer(marker);
            continue;
        }

        if (
            data.type === "zone" &&
            (
                data.lat1 > bboxLat2 ||
                data.lat2 < bboxLat1 ||
                data.lon1 > bboxLng2 ||
                data.lon2 < bboxLng1
            )
        ) {
            delete markedDatas[key];
            map.removeLayer(marker);
        }

        if (
            data.type === "camera" &&
            (
                data.lat > bboxLat2 ||
                data.lat < bboxLat1 ||
                data.lon > bboxLng2 ||
                data.lon < bboxLng1
            )
        ) {
            delete markedDatas[key];
            map.removeLayer(marker);
        }
    }
}

function generatePopup(camera) {
    const popupContainer = popupPrototype.cloneNode(true)
    popupContainer.classList.remove("prototype");

    const streetViewLink = popupContainer.querySelector(".cam-street-view-button");
    streetViewLink.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${camera.lat},${camera.lon}`;

    const gpsPointerLink = popupContainer.querySelector(".cam-gps-pointer-button");
    gpsPointerLink.href = `https://www.google.com/maps/search/?api=1&query=${camera.lat},${camera.lon}`;

    const copyGpsButton = popupContainer.querySelector(".cam-copy-gps-button");
    if (navigator.clipboard === undefined) {
        copyGpsButton.style.display = "none"
    } else {
        copyGpsButton.addEventListener("click", (e) => {
            e.preventDefault()
    
            navigator.clipboard.writeText(`${camera.lat},${camera.lon}`);
            showTemporaryMessage("Camera coordinates copied to clipboard !")
        })
    }

    const popupSectionsContainer = popupContainer.querySelector(".cam-sections");

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

    popupSectionsContainer.innerHTML = "";

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

        popupSectionsContainer.appendChild(popupSectionContainer);
    }

    return popupContainer;
}