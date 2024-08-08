import { fetchCameras, setPopupPrototype } from "./fetcher.js";
import { initAndListenFilters, filters } from "./filters.js";

let map;

document.addEventListener("DOMContentLoaded", () => {
    setPopupPrototype();
    
    map = L.map('map').setView([47.272899, 2.446147], 6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.Control.geocoder().addTo(map);

    fetchCameras(map,filters);
    map.on("moveend", () => fetchCameras(map,filters))

    initAndListenFilters(map);
})