function getHorizontalSearchBBoxes(searchCoordinates, horizontalInfos, verticalZoneId, bboxToExclude = null) {

    let { searchLat1, searchLat2, searchLon1 } = searchCoordinates;
    const { horizontalNbSearchs, horizontalStartModulo, horizontalEndModulo, horizontalPartSize, horizontalFirstZoneId } = horizontalInfos;

    const [lon1ToEx,lat1ToEx,lon2ToEx,lat2ToEx] = bboxToExclude ?? [null,null,null,null];

    const bboxes = [];

    let searchLon2 = searchLon1+horizontalStartModulo;
    bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2, zoneId: verticalZoneId+"-"+horizontalFirstZoneId});

    searchLon1 = searchLon2;
    for (let j=0;j<horizontalNbSearchs;j++) {
        const searchLon2 = searchLon1+horizontalPartSize;

        if (
            bboxToExclude && 
            searchLat1 > lat1ToEx && 
            searchLat2 < lat2ToEx &&
            searchLon1 > lon1ToEx &&
            searchLon2 < lon2ToEx
        ) {
            searchLon1 = searchLon2;
            continue;    
        }

        bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2, zoneId: verticalZoneId+"-"+(horizontalFirstZoneId+j+1)});

        searchLon1 = searchLon2
    }
    if (horizontalEndModulo > 0) {
        searchLon2 = searchLon1+horizontalEndModulo;
        bboxes.push({lat1: searchLat1, lon1: searchLon1, lat2: searchLat2, lon2: searchLon2, zoneId: verticalZoneId+"-"+(horizontalFirstZoneId+horizontalNbSearchs+1)});
    }

    return bboxes;
}
function getSearchBBoxes([lon1,lat1,lon2,lat2], verticalPartSize, horizontalPartSize, bboxToExclude = null) {

    const nbVerticalPartSizeFrom0 = lat1/verticalPartSize;
    const roundedNbVerticalPartSizeFrom0 = nbVerticalPartSizeFrom0%1 == 0 ? nbVerticalPartSizeFrom0 : Math.floor(nbVerticalPartSizeFrom0)+1;
    const latStartAt = Math.min(roundedNbVerticalPartSizeFrom0*verticalPartSize, lat2);
    const verticalStartModulo = latStartAt-lat1;

    const verticalDistance = lat2-latStartAt;
    const verticalNbSearchs = Math.floor(verticalDistance/verticalPartSize);
    const verticalEndModulo = verticalDistance%verticalPartSize;



    const nbHorizontalPartSizeFrom0 = lon1/horizontalPartSize;
    const roundedNbHorizontalPartSizeFrom0 = nbHorizontalPartSizeFrom0%1 == 0 ? nbHorizontalPartSizeFrom0 : Math.floor(nbHorizontalPartSizeFrom0)+1;
    const lonStartAt = Math.min(roundedNbHorizontalPartSizeFrom0*horizontalPartSize, lon2);
    const horizontalStartModulo = lonStartAt-lon1;

    const horizontalDistance = lon2-lonStartAt;
    const horizontalNbSearchs = Math.floor(horizontalDistance/horizontalPartSize);
    const horizontalEndModulo = horizontalDistance%horizontalPartSize;

    let bboxes = [];

    const horizontalInfos = { 
        horizontalNbSearchs, 
        horizontalStartModulo, 
        horizontalEndModulo, 
        horizontalPartSize, 
        horizontalFirstZoneId: roundedNbHorizontalPartSizeFrom0
    };

    const searchCoordinates = {
        searchLat1: lat1,
        searchLon1: lon1,
        searchLat2: lat1+verticalStartModulo
    }
    bboxes = bboxes.concat(
        getHorizontalSearchBBoxes(
            searchCoordinates,
            horizontalInfos,
            roundedNbVerticalPartSizeFrom0,
            bboxToExclude
        )
    );

    searchCoordinates.searchLat1 = searchCoordinates.searchLat2;
    for (let i=0;i<verticalNbSearchs;i++) {
        searchCoordinates.searchLat2 = searchCoordinates.searchLat1+verticalPartSize;

        bboxes = bboxes.concat(
            getHorizontalSearchBBoxes(
                searchCoordinates,
                horizontalInfos,
                roundedNbVerticalPartSizeFrom0+i+1,
                bboxToExclude
            )
        );

        searchCoordinates.searchLat1 = searchCoordinates.searchLat2;
        searchCoordinates.searchLon1 = lon1;
    }
    if (verticalEndModulo > 0) {
        searchCoordinates.searchLat2 = searchCoordinates.searchLat1+verticalEndModulo;
        bboxes = bboxes.concat(
            getHorizontalSearchBBoxes(
                searchCoordinates,
                horizontalInfos,
                roundedNbVerticalPartSizeFrom0+verticalNbSearchs+1,
                bboxToExclude
            )
        );
    }

    return bboxes;
}

module.exports = getSearchBBoxes;