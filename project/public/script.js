import { searchCameras, setPopupPrototype } from "./fetcher.js";
import { initAndListenFilters, filters } from "./filters.js";

document.addEventListener("DOMContentLoaded", () => {
    setPopupPrototype();
    
    const map = L.map('map').setView([47.272899, 2.446147], 6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.Control.geocoder().addTo(map);

    searchCameras(map,filters);
    map.on("moveend", () => searchCameras(map,filters))

    initAndListenFilters(map);

    document.querySelector(".mobile-filter-burger").addEventListener("click", () => {
        document.querySelector(".filters-menu").style.display = "block";
        document.querySelector(".black-background").style.display = "block";
    })
    document.querySelector(".close-mobile-menu-button").addEventListener("click", () => {
        document.querySelector(".filters-menu").style.display = "none";
        document.querySelector(".black-background").style.display = "none";
    })
})