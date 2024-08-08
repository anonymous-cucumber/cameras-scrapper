import { fetchCameras } from "./fetcher.js";
import labels from "./labels.js";

const sourcesFilterConfig = {
    camerci: {link: "https://camerci.fr"},
    parisPoliceArcgis: {link: "https://arcg.is/08y0y10"},
    sousSurveillanceNet: {link: "https://www.sous-surveillance.net"},
    surveillanceUnderSurveillance: {link: "https://sunders.uber.space"}
}

const typesFilterConfig = ["public","private",""];

let filterSectionPrototype = null;
let filterLinePrototype = null;

function generateFilterSection(filterTitle, filtersConfig, onFilter) {
    let filters = Object.entries(filtersConfig).reduce((acc,[id,{checked}]) => ({...acc, [id]: !!checked}) , {})

    let expanded = false;

    const filterSectionContainer = filterSectionPrototype.cloneNode(true);
    filterSectionContainer.classList.remove("prototype")

    const titleBlockContainer = filterSectionContainer.querySelector(".title-block")
    titleBlockContainer.querySelector(".text").innerText = filterTitle

    const filtersListContainer = filterSectionContainer.querySelector(".filter-lines");
    const arrow = titleBlockContainer.querySelector(".arrow");
    titleBlockContainer.addEventListener("click", () => {
        expanded = !expanded;
        arrow.classList[expanded ? "add" : "remove"]("down")
        filtersListContainer.classList[expanded ? "remove" : "add"]("hidden")
    })
    filtersListContainer.innerHTML = "";
    
    for (const config of (filtersConfig instanceof Array ? filtersConfig : Object.entries(filtersConfig))) {

        const [key,{title,link,checked}] = config instanceof Array ? config : [config,{}];

        const filterLineContainer = filterLinePrototype.cloneNode(true);
        filterLineContainer.querySelector(".filter-line-title").innerText = title??labels[key]??key;

        const checkbox = filterLineContainer.querySelector("input[type=checkbox]")
        checkbox.checked = !!checked;
        const onClick = (isCheckbox = false) => (e) => {
            e.stopPropagation();

            if (!isCheckbox)
                checkbox.checked = !checkbox.checked;
            filters[key] = checkbox.checked;
            const filtered = Object.entries(filters).filter(([,value]) => value).map(([key]) => key);
            titleBlockContainer.querySelector(".number").innerText = filtered.length == 0 ? "   " : ` (${filtered.length})`;
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

    onFilter(Object.entries(filters).filter(([,value]) => value).map(([key]) => key))

    return filterSectionContainer;
}

export const filters = {
    infosSources: {
        title: "Filter par source - infos",
        filtersConfig: sourcesFilterConfig
    },
    coordinatesSources: {
        title: "Filter par source - positions",
        filtersConfig: sourcesFilterConfig
    },
    types: {
        title: "Par types",
        filtersConfig: typesFilterConfig
    }
}

export function initAndListenFilters(map) {
    filterSectionPrototype = document.querySelector(".filter-section.prototype");
    filterSectionPrototype.classList.remove("prototype")
    filterLinePrototype = filterSectionPrototype.querySelector(".filter-line");

    const filterSectionsDiv = document.querySelector(".filter-sections");

    filterSectionsDiv.innerHTML = "";

    for (const [,filter] of Object.entries(filters)) {
        const {title,filtersConfig} = filter
        filterSectionsDiv.appendChild(generateFilterSection(title, filtersConfig, (filtered) => {
            filter.value = filtered;
            fetchCameras(map,filters)
        }))   
    }
}