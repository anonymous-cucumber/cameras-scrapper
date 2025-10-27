const request = require("../../../../libs/request");

const route = "/api/cameras";

async function getDefaultFranceBbox({endpoint, timeout}) {
    const queryParams = {
        bbox: [-17.687988281250004,41.046216814520655,22.565917968750004,52.855864177853995].join(","),
        zoom: 6
    }
    const dateA = new Date();

    await request(`${endpoint}${route}`, {timeout, queryParams})

    const dateB = new Date();

    return (dateB.getTime()-dateA.getTime())+"ms";
}

async function getIdfZoom11Bbox({endpoint, timeout}) {
  const queryParams = {
        bbox: [1.750946044921875,48.65604661485727,3.0088806152343754,49.01400494219595].join(","),
        zoom: 11
    }
    const dateA = new Date();

    await request(`${endpoint}${route}`, {timeout, queryParams})

    const dateB = new Date();

    return (dateB.getTime()-dateA.getTime())+"ms";
}

async function getIdfZoom12Bbox({endpoint, timeout}) {
  const queryParams = {
        bbox: [2.0475769042968754,48.76184695759157,2.676544189453125,48.940768732803484].join(","),
        zoom: 12
    }
    const dateA = new Date();

    await request(`${endpoint}${route}`, {timeout, queryParams})

    const dateB = new Date();

    return (dateB.getTime()-dateA.getTime())+"ms";
}

async function getWholeParisZoom13Bbox({endpoint, timeout}) {
    const queryParams = {
        bbox: [2.258337,48.815579,2.415558,48.900905].join(","),
        zoom: 13
    }
    const dateA = new Date();

    await request(`${endpoint}${route}`, {timeout, queryParams})

    const dateB = new Date();

    return (dateB.getTime()-dateA.getTime())+"ms";
}

async function getParisCenterBbox({endpoint, timeout}) {
  const queryParams = {
        bbox: [2.3109483718872075,48.84870500037748,2.3895692825317387,48.87106642269893].join(","),
        zoom: 15
    }
    const dateA = new Date();

    await request(`${endpoint}${route}`, {timeout, queryParams})

    const dateB = new Date();

    return (dateB.getTime()-dateA.getTime())+"ms";
}

async function getParisChateletLesHallesBbox({endpoint, timeout}) {
  const queryParams = {
        bbox: [2.3295521736145024,48.857289353945745,2.368862628936768,48.86846939656666].join(","),
        zoom: 16
    }
    const dateA = new Date();

    await request(`${endpoint}${route}`, {timeout, queryParams})

    const dateB = new Date();

    return (dateB.getTime()-dateA.getTime())+"ms";
}

module.exports = { getDefaultFranceBbox, getIdfZoom11Bbox, getIdfZoom12Bbox, getWholeParisZoom13Bbox, getParisCenterBbox, getParisChateletLesHallesBbox };