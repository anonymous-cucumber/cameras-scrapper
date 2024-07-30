import { fetchCameras } from "./fetcher.js";

const sourcesFilterConfig = {
    camerci: {title: "Camerci", link: "https://camerci.fr"},
    parisPoliceArcgis: {title: "Arcgis Paris Police", link: "https://arcg.is/08y0y10"},
    sousSurveillanceNet: {title: "Paris Sous Surveillance", link: "https://www.sous-surveillance.net"},
    surveillanceUnderSurveillance: {title: "Surveillance Under Surveillance", link: "https://sunders.uber.space"}
}

const typesFilterConfig = {
    public: {title: "Publiques"},
    private: {title: "Privates"}
}

let filterSectionPrototype = null;
let filterLinePrototype = null;

function generateFilterSection(filterTitle, filtersConfig, onFilter) {
    let filters = Object.entries(filtersConfig).reduce((acc,[id,{checked}]) => ({...acc, [id]: !!checked}) , {})

    let expanded = false;

    const filterSection = filterSectionPrototype.cloneNode(true);

    const titleBlock = filterSection.querySelector(".title-block")
    titleBlock.querySelector(".text").innerText = filterTitle

    const filtersList = filterSection.querySelector(".filter-lines");
    const arrow = titleBlock.querySelector("img");
    titleBlock.addEventListener("click", () => {
        expanded = !expanded;
        arrow.classList[expanded ? "add" : "remove"]("down")
        filtersList.classList[expanded ? "remove" : "add"]("hidden")
    })
    filtersList.innerHTML = "";
    
    for (const [key,{title,link,checked}] of Object.entries(filtersConfig)) {

        const filterLineDiv = filterLinePrototype.cloneNode(true);
        filterLineDiv.querySelector(".filter-line-title").innerText = title

        const checkbox = filterLineDiv.querySelector("input[type=checkbox]")
        checkbox.checked = !!checked;
        const onClick = (isCheckbox = false) => (e) => {
            e.stopPropagation();

            if (!isCheckbox)
                checkbox.checked = !checkbox.checked;
            filters[key] = checkbox.checked;
            const filtered = Object.entries(filters).filter(([,value]) => value).map(([key]) => key);
            titleBlock.querySelector(".number").innerText = filtered.length == 0 ? "   " : ` (${filtered.length})`;
            onFilter(filtered)
        }
        filterLineDiv.addEventListener("click", onClick());
        checkbox.addEventListener("click", onClick(true));

        filtersList.appendChild(filterLineDiv)
    }

    onFilter(Object.entries(filters).filter(([,value]) => value).map(([key]) => key))

    return filterSection;
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