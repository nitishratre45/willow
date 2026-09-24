const API_URL = "/api/matches";

const matchesGrid = document.getElementById("matchesGrid");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");
const emptyBox = document.getElementById("emptyBox");
const statusText = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");


// ========================================
// LOAD MATCHES
// ========================================

async function loadMatches() {

    loader.style.display = "flex";
    errorBox.style.display = "none";
    emptyBox.style.display = "none";

    matchesGrid.innerHTML = "";

    statusText.textContent = "Loading matches...";

    refreshBtn.disabled = true;
    refreshBtn.textContent = "↻ Loading...";

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            throw new Error(
                `Server returned ${response.status}: ${text}`
            );
        }


        // --------------------------------
        // API ERROR
        // --------------------------------

        if (!response.ok) {

            console.error(
                "API RESPONSE:",
                data
            );

            throw new Error(
                data?.error ||
                `API Error: ${response.status}`
            );
        }


        console.log(
            "MATCH API RESPONSE:",
            data
        );


        // --------------------------------
        // FIND MATCH ARRAY
        // --------------------------------

        const matches =
            getMatchesArray(data);


        if (!matches.length) {

            emptyBox.style.display = "block";

            statusText.textContent =
                "No matches found";

            return;
        }


        // --------------------------------
        // RENDER
        // --------------------------------

        renderMatches(matches);

        statusText.textContent =
            `${matches.length} matches found`;

    }

    catch (error) {

        console.error(
            "Match API Error:",
            error
        );

        showError(error);

        statusText.textContent =
            "Unable to load matches";

    }

    finally {

        loader.style.display = "none";

        refreshBtn.disabled = false;
        refreshBtn.textContent = "↻ Refresh";
    }
}


// ========================================
// GET MATCH ARRAY
// ========================================

function getMatchesArray(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.matches)
    ) {
        return data.matches;
    }

    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data &&
        data.data &&
        Array.isArray(data.data.matches)
    ) {
        return data.data.matches;
    }

    return [];
}


// ========================================
// RENDER MATCHES
// ========================================

function renderMatches(matches) {

    matchesGrid.innerHTML = "";

    matches.forEach((match, index) => {

        const card =
            createMatchCard(match, index);

        matchesGrid.appendChild(card);
    });
}


// ========================================
// CREATE CARD
// ========================================

function createMatchCard(match, index) {

    const card =
        document.createElement("article");

    card.className = "match-card";


    const title = getValue(
        match,
        [
            "title",
            "name",
            "match_name",
            "match_title"
        ],
        "Cricket Match"
    );


    const tournament = getValue(
        match,
        [
            "tournament",
            "series",
            "league",
            "competition"
        ],
        "Cricket"
    );


    const status = String(
        getValue(
            match,
            [
                "status",
                "state"
            ],
            "LIVE"
        )
    ).toUpperCase();


    const image = getValue(
        match,
        [
            "image",
            "thumbnail",
            "poster",
            "logo"
        ],
        ""
    );


    const matchId = getValue(
        match,
        [
            "match_id",
            "id",
            "matchId"
        ],
        index
    );


    const isLive =
        status === "LIVE";


    card.innerHTML = `

        <div class="match-poster">

            ${
                image
                    ? `
                        <img
                            src="${escapeAttr(image)}"
                            alt="${escapeAttr(title)}"
                            loading="lazy"
                            onerror="this.parentElement.classList.add('no-image')"
                        >
                    `
                    : `
                        <div class="no-image">
                            <span>🏏</span>
                        </div>
                    `
            }

            <div class="status-badge ${isLive ? "live" : ""}">
                ${
                    isLive
                        ? '<span class="live-dot"></span>'
                        : ""
                }

                ${escapeHtml(status)}
            </div>

        </div>


        <div class="match-content">

            <h2 class="match-title">
                ${escapeHtml(title)}
            </h2>

            <p class="match-tournament">
                ${escapeHtml(tournament)}
            </p>


            <div class="match-bottom">

                <span class="match-id">
                    #${escapeHtml(String(matchId))}
                </span>

                <button
                    class="watch-btn"
                    type="button"
                >
                    Watch Now
                </button>

            </div>

        </div>
    `;


    const watchButton =
        card.querySelector(".watch-btn");


    watchButton.addEventListener(
        "click",
        () => {

            openMatch(
                match,
                index
            );

        }
    );


    return card;
}


// ========================================
// OPEN MATCH
// ========================================

function openMatch(match, index) {

    console.log(
        "SELECTED MATCH:",
        match
    );


    // Show complete object for debugging
    console.log(
        "MATCH JSON:",
        JSON.stringify(
            match,
            null,
            2
        )
    );


    const streamUrl =
        findStreamUrl(match);


    if (streamUrl) {

        window.open(
            streamUrl,
            "_blank"
        );

        return;
    }


    /*
     * No direct stream URL found.
     *
     * For now show the match data instead
     * of assuming an incorrect player URL.
     */

    const matchId =
        getValue(
            match,
            [
                "match_id",
                "id",
                "matchId"
            ],
            index
        );


    alert(
        `Match ID: ${matchId}\n\n` +
        "Direct stream URL is not available in this API object."
    );
}


// ========================================
// FIND STREAM URL
// ========================================

function findStreamUrl(match) {

    const streams =
        match?.streams || {};


    const possibleUrls = [

        match?.stream_url,

        match?.streamUrl,

        match?.stream,

        match?.url,

        streams?.primary,

        streams?.stream_url,

        streams?.stream,

        streams?.url,

        streams?.fancode_cdn,

        streams?.fancode_lk_cdn,

        streams?.fancode_np_cdn,

        streams?.fancode_bd_cdn

    ];


    for (const url of possibleUrls) {

        if (
            typeof url === "string" &&
            url.trim().length > 0
        ) {

            return url.trim();
        }
    }


    return null;
}


// ========================================
// GET VALUE
// ========================================

function getValue(
    object,
    keys,
    fallback = ""
) {

    if (!object) {
        return fallback;
    }


    for (const key of keys) {

        const value =
            object[key];


        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;
        }
    }


    return fallback;
}


// ========================================
// ERROR
// ========================================

function showError(error) {

    let message =
        error?.message ||
        "Unknown error";


    errorBox.innerHTML = `

        <div class="error-title">
            Matches load nahi ho paaye
        </div>

        <div class="error-message">
            ${escapeHtml(message)}
        </div>

        <div class="error-help">
            API response ko Console me check karo.
        </div>

    `;


    errorBox.style.display =
        "block";
}


// ========================================
// HTML ESCAPE
// ========================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttr(value) {

    return escapeHtml(value);
}


// ========================================
// REFRESH BUTTON
// ========================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadMatches
    );
}


// ========================================
// INITIAL LOAD
// ========================================

loadMatches();


// ========================================
// AUTO REFRESH
// Every 30 seconds
// ========================================

setInterval(
    loadMatches,
    30000
);
