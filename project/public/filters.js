import { searchCameras } from "./fetcher.js";
import labels from "./labels.js";

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const sourcesFilterConfig = {
    camerci: {link: "https://camerci.fr"},
    parisPoliceArcgis: {link: "https://arcg.is/08y0y10"},
    sousSurveillanceNet: {link: "https://www.sous-surveillance.net"},
    surveillanceUnderSurveillance: {link: "https://sunders.uber.space"}
}

const typesFilterConfig = ["public","private",""];

let filterSectionPrototype = null;
let filterLinePrototype = null;

export const filtersState = {
    infosSources: {
        title: "Filter par source - infos",
        filtersConfig: sourcesFilterConfig,
        expanded: false
    },
    coordinatesSources: {
        title: "Filter par source - positions",
        filtersConfig: sourcesFilterConfig,
        expanded: false
    },
    types: {
        title: "Filtrer par types",
        filtersConfig: typesFilterConfig,
        expanded: false
    }
}


function closeOpenFilterSections() {
    let anyExpanded = false;
    for (const [filterName,{expanded}] of Object.entries(filtersState)) {
        if (expanded) anyExpanded = true;

        const filterSectionContainer = document.getElementById(`filter-section-${filterName}`);
        const filtersListContainer = filterSectionContainer.querySelector(".filter-lines");
        const arrow = filterSectionContainer.querySelector(".title-block .arrow");

        filterSectionContainer.classList[expanded ? "add" : "remove"]("expanded");
        arrow.classList[expanded ? "add" : "remove"]("down");
        filtersListContainer.classList[expanded ? "remove" : "add"]("hidden");
    }
    for (const [filterName,{expanded}] of Object.entries(filtersState)) {
        const filterSectionContainer = document.getElementById(`filter-section-${filterName}`);
        filterSectionContainer.classList[(anyExpanded && !expanded) ? "add" : "remove"]("no-expanded");
    }
}
function generateFilterSection(filterName, filterObj, onFilter) {
    const {title, filtersConfig} = filterObj;

    let filters = Object.entries(filtersConfig).reduce((acc,[id,{checked}]) => ({...acc, [id]: !!checked}) , {})

    const filterSectionContainer = filterSectionPrototype.cloneNode(true);
    filterSectionContainer.classList.remove("prototype")
    filterSectionContainer.id = `filter-section-${filterName}`

    const titleBlockContainer = filterSectionContainer.querySelector(".title-block")
    titleBlockContainer.querySelector(".text").innerText = title

    const filtersListContainer = filterSectionContainer.querySelector(".filter-lines");
    titleBlockContainer.addEventListener("click", () => {
        if (isMobile && filterObj.expanded) return;
        if (isMobile) {
            for (const [anotherFilterName, filterObj] of Object.entries(filtersState)) {
                if (anotherFilterName === filterName)
                    continue;
                filterObj.expanded = false
            }
        }
        filterObj.expanded = !filterObj.expanded;
        closeOpenFilterSections();
    })
    filtersListContainer.innerHTML = "";

    const numberText = titleBlockContainer.querySelector(".number");
    
    for (const config of (filtersConfig instanceof Array ? filtersConfig : Object.entries(filtersConfig))) {

        const [key,{title,link,checked}] = config instanceof Array ? config : [config,{}];

        const filterLineContainer = filterLinePrototype.cloneNode(true);
        filterLineContainer.querySelector(".filter-line-title").innerText = title??labels[key]??key;

        if (isMobile) numberText.style.display = "none";

        const checkbox = filterLineContainer.querySelector("input[type=checkbox]")
        checkbox.checked = !!checked;
        const onClick = (isCheckbox = false) => (e) => {
            e.stopPropagation();

            if (!isCheckbox)
                checkbox.checked = !checkbox.checked;
            filters[key] = checkbox.checked;
            const filtered = Object.entries(filters).filter(([,value]) => value).map(([key]) => key);

            const numberText = titleBlockContainer.querySelector(".number");
            numberText.innerText = filtered.length == 0 ? "   " : ` (${filtered.length})`;
            if (isMobile) numberText.style.display = filtered.length == 0 ? "none" : "block"

            onFilter(filtered)
        }
        filterLineContainer.addEventListener("click", onClick());
        checkbox.addEventListener("click", onClick(true));

        const externalLink = filterLineContainer.querySelector(".external-link")
        if (link) {
            externalLink.addEventListener("click", (e) => {
                e.stopPropagation();
            });
            externalLink.href = link;
        } else {
            externalLink.classList.add("hidden")
        }

        filtersListContainer.appendChild(filterLineContainer)
    }

    return filterSectionContainer;
}

export function onMobileMenuCloseButton() {
    let anyFilterSectionClosed = false;
    for (const filterObj of Object.values(filtersState)) {
        if (filterObj.expanded) anyFilterSectionClosed = true;

        filterObj.expanded = false;
    }
    if (anyFilterSectionClosed)
        return closeOpenFilterSections();

    document.querySelector(".menu").style.display = "none";
    document.querySelector(".black-background").style.display = "none";
}
export function onMobileMenuOpenButton() {
    document.querySelector(".menu").style.display = "block";
    document.querySelector(".black-background").style.display = "block";
}

export function initAndListenFilters(map) {
    filterSectionPrototype = document.querySelector(".filter-section.prototype");
    filterSectionPrototype.classList.remove("prototype")
    filterLinePrototype = filterSectionPrototype.querySelector(".filter-line");

    const filterSectionsDiv = document.querySelector(".filter-sections");

    filterSectionsDiv.innerHTML = "";

    for (const [filterName,filterObj] of Object.entries(filtersState)) {
        filterSectionsDiv.appendChild(generateFilterSection(filterName, filterObj, (filtered) => {
            filterObj.value = filtered;
            searchCameras(map,filtersState)
        }))   
    }
}