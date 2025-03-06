export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const showTemporaryMessage = message => {
    const container = document.querySelector(".temporary-message");
    const content = container.querySelector(".content");

    content.innerText = message;
    container.classList.remove("hidden");

    setTimeout(() => {
        container.classList.add("hidden");
    }, 3000)
}


let currentPosition = null;
export const locateOnMap = map => {
    if (currentPosition) {
        map.panTo(new L.LatLng(currentPosition.lat, currentPosition.lng));
        return;
    }

    

    let locationMarker = null;
    map.locate({setView: false, watch: true})
    .on("locationfound", ({latlng}) => {
        currentPosition = latlng;
        
        if (locationMarker !== null)
            map.removeLayer(locationMarker);
        else {
            map.setView(new L.LatLng(latlng.lat, latlng.lng), 19);
        }

        locationMarker = new L.Marker(latlng, {
            icon: new L.Icon({
                iconUrl: "/images/locate-point.svg",
                iconSize: [16, 16]
            })
        })
        
        map.addLayer(locationMarker)
    })
}