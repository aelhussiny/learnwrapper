const filters = {
    capabilities: [],
    products: [],
    topics: [],
    types: [],
    levels: [],
    accounts: [],
};

const activeFilters = {};

let appData = null;

document.addEventListener("DOMContentLoaded", () => {
    checkParams();

    fetchData().then((data) => {
        appData = data.filter(
            (item) => item.gallery_item && item.gallery_item !== "false"
        );
        for (const item of appData) {
            filters.capabilities = Array.from(
                new Set([
                    ...filters.capabilities,
                    ...(item.capabilitiesNames || []),
                ])
            );
            filters.products = Array.from(
                new Set([...filters.products, ...(item.productNames || [])])
            );
            filters.topics = Array.from(
                new Set([...filters.topics, ...(item.industriesNames || [])])
            );
            filters.types = Array.from(
                new Set([
                    ...filters.types,
                    ...(item.typeName ? [item.typeName] : []),
                ])
            );
            filters.levels = Array.from(
                new Set([
                    ...filters.levels,
                    ...(item.experienceName ? [item.experienceName] : []),
                ])
            );
            filters.accounts = Array.from(
                new Set([...filters.accounts, ...(item.accountsTitles || [])])
            );
        }

        setupFilters();
        setupSearch();
        showCards();
    });
});

function checkParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const hideFiltersParam = urlParams.get("hideFilters");
    const hideSearchParam = urlParams.get("hideSearch");

    const capabilitiesParam = urlParams.get("c");
    const productsParam = urlParams.get("p");
    const topicsParam = urlParams.get("t");
    const typesParam = urlParams.get("type");
    const levelsParam = urlParams.get("level");
    const accountsParam = urlParams.get("a");

    const searchParam = urlParams.get("search");

    if (hideFiltersParam) {
        document.getElementById("filter-panel").style.display = "none";
        document.getElementById("mobile-filter-button").style.display = "none";
    }
    if (hideSearchParam) {
        document.getElementById("search-input").style.display = "none";
    }

    if (capabilitiesParam) {
        activeFilters["capabilities"] = capabilitiesParam;
    }
    if (productsParam) {
        activeFilters["products"] = productsParam;
    }
    if (topicsParam) {
        activeFilters["topics"] = topicsParam;
    }
    if (typesParam) {
        activeFilters["types"] = typesParam;
    }
    if (levelsParam) {
        activeFilters["levels"] = levelsParam;
    }
    if (accountsParam) {
        activeFilters["accounts"] = accountsParam;
    }

    if (searchParam) {
        document.getElementById("search-input").value = searchParam;
    }
}

function fetchData() {
    return fetch("data.json").then((response) => {
        if (!response.ok) {
            throw new Error("Failed to fetch data.json");
        }
        return response.json();
    });
}

function setupFilters() {
    const filterPanel = document.getElementById("filter-panel");
    for (const key in filters) {
        filterPanel.innerHTML += `
        <div class="filter-group">
            <calcite-label>
                <calcite-dropdown id="${key}-dropdown">
                    <calcite-button
                        slot="trigger"
                        width="full"
                        alignment="start"
                        id="${key}-button"
                    >${key.charAt(0).toUpperCase() + key.substring(1)}${
            activeFilters[key] ? `: ${activeFilters[key]}` : ""
        }</calcite-button
                    >
                    <calcite-dropdown-group>
                        <calcite-dropdown-item ${
                            !Object.keys(activeFilters).includes(key)
                                ? `selected="true"`
                                : ""
                        }>
                            All ${
                                key.charAt(0).toUpperCase() + key.substring(1)
                            }
                        </calcite-dropdown-item
                        >
                        ${filters[key]
                            .filter((item) => item.length > 0)
                            .sort((a, b) => a.localeCompare(b))
                            .map(
                                (item) => `
                            <calcite-dropdown-item ${
                                activeFilters[key] === item
                                    ? `selected="true"`
                                    : ""
                            }>${item}</calcite-dropdown-item>
                        `
                            )
                            .join("")}
                    </calcite-dropdown-group>
                </calcite-dropdown>
            </calcite-label>
        </div>
        `;
    }
    setupDropdownEvents();
}

function setupDropdownEvents() {
    for (const key in filters) {
        document
            .getElementById(`${key}-dropdown`)
            .addEventListener("calciteDropdownSelect", (event) => {
                const selection = event.target.selectedItems[0]?.innerText;
                if (!selection) return;
                if (selection.includes("All ")) {
                    delete activeFilters[key];
                    document.getElementById(`${key}-button`).innerText = `${
                        key.charAt(0).toUpperCase() + key.substring(1)
                    }`;
                } else {
                    activeFilters[key] = selection;
                    document.getElementById(`${key}-button`).innerText = `${
                        key.charAt(0).toUpperCase() + key.substring(1)
                    }: ${selection}`;
                }
                filterCards();
            });
    }
    filterCards();
}

function setupSearch() {
    document
        .getElementById("search-input")
        .addEventListener("calciteInputTextInput", () => {
            filterCards();
        });
    filterCards();
}

function showCards() {
    document.getElementById("card-gallery").innerHTML = "";
    appData.forEach((item) => {
        const card = createCard(item);
        document.getElementById("card-gallery").appendChild(card);
        item.cardElement = card;
    });
    filterCards();
}

function createCard(item) {
    const anchor = document.createElement("a");
    anchor.href = item.url;
    anchor.target = "_blank";
    const card = document.createElement("calcite-card");
    card.href = item.url;
    card.selectable = false;

    card.innerHTML = `
        <img
            slot="thumbnail"
            alt="${item.title}"
            src="https://learn.arcgis.com${item.imageUrl}"
        />
        <span slot="heading">${item.title}</span>
        <span slot="description">${item.description}</span>
        <div slot="footer-start">
            ${item.duration} Minutes
        </div>
        <div slot="footer-end">
            ${item.experienceName || ""}
        </div>
    `;

    anchor.appendChild(card);
    return anchor;
}

function filterCards() {
    const searchTerm = document.getElementById("search-input").value;

    appData.forEach((item) => {
        const isVisible =
            matchesFilters(item) && matchesSearch(item, searchTerm);
        if (item.cardElement) {
            item.cardElement.style.display = isVisible ? "block" : "none";
        }
    });
}

function matchesFilters(item) {
    let matching = true;
    for (const key in activeFilters) {
        if (key === "capabilities") {
            matching =
                matching &&
                item.capabilitiesNames?.includes(activeFilters[key]);
        }
        if (key === "products") {
            matching =
                matching && item.productNames?.includes(activeFilters[key]);
        }
        if (key === "topics") {
            matching =
                matching && item.industriesNames?.includes(activeFilters[key]);
        }
        if (key === "types") {
            matching = matching && item.typeName === activeFilters[key];
        }
        if (key === "levels") {
            matching = matching && item.experienceName === activeFilters[key];
        }
        if (key === "accounts") {
            matching =
                matching && item.accountsTitles?.includes(activeFilters[key]);
        }
    }
    return matching;
}

const matchesSearch = (item, searchTerm) => {
    if (!searchTerm || searchTerm.length === 0) return true;
    const inTitle = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const inDescription = item.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return inTitle || inDescription;
};
