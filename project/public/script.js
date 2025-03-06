import { searchAndShowCameras, killCamerasSearching, setPopupPrototype } from "./cameras.js";
import { initAndListenFilters, filtersState, onMobileMenuCloseButton, onMobileMenuOpenButton, onLegendHeaderClick, getOnLegendItemContainerClick } from "./filters.js";

document.addEventListener("DOMContentLoaded", () => {
    setPopupPrototype();

    const {zoom, lat, lng} = JSON.parse(localStorage.getItem("currentMapState"))??{}
    const map = L.map('map').setView([lat??47.272899, lng??2.446147], zoom??6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.Control.geocoder().addTo(map);

    searchAndShowCameras(map,filtersState);
    map.on("movestart", () => {
        killCamerasSearching();
    })
    map.on("moveend", () => {
        const zoom = map.getZoom();
        const {lat, lng} = map.getCenter()
        
        localStorage.setItem("currentMapState", JSON.stringify({zoom, lat, lng}))

        searchAndShowCameras(map,filtersState);
    })

    initAndListenFilters(map);

    document.querySelector(".mobile-menu-burger").addEventListener("click", onMobileMenuOpenButton)
    document.querySelector(".close-mobile-menu-button").addEventListener("click", onMobileMenuCloseButton)

    document.querySelector(".legend-header").addEventListener("click", onLegendHeaderClick)
    Array.from(document.querySelectorAll(".legend-item-container")).map((legendItem, i) => {
        legendItem.addEventListener("click", getOnLegendItemContainerClick(i))
    })

    document.querySelector(".locate-button").addEventListener("click", () => {
        map.locate({setView: true, watch: true})
        // .on("locationfound", () => {
        //     alert("FOUND")
        // })
        .on("locationerror", (e) => {
            alert("ERROR")
            alert(e.message)
        })
    })
})