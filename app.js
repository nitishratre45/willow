const API_URL = "/api/matches";

const matchesGrid = document.getElementById("matchesGrid");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");
const emptyBox = document.getElementById("emptyBox");
const statusText = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");


// ======================================================
// LOAD MATCHES
// ======================================================

async function loadMatches() {

    if (loader) {
        loader.style.display = "flex";
    }

    if (errorBox) {
        errorBox.style.display = "none";
        errorBox.innerHTML = "";
    }

    if (emptyBox) {
        emptyBox.style.display = "none";
    }

    if (matchesGrid) {
        matchesGrid.innerHTML = "";
    }

    if (statusText) {
        statusText.textContent = "Loading matches...";
    }

    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "↻ Loading...";
    }


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


        // --------------------------------------------------
        // JSON RESPONSE
        // --------------------------------------------------

        if (contentType.includes("application/json")) {

            data = await response.json();

        } else {

            const text =
                await response.text();

            throw new Error(
                `Server returned ${response.status}: ${text}`
            );
        }


        console.log(
            "MATCH API RESPONSE:",
            data
        );


        // --------------------------------------------------
        // API ERROR
        // --------------------------------------------------

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


        // --------------------------------------------------
        // GET MATCHES
        // --------------------------------------------------

        const matches =
            getMatchesArray(data);


        console.log(
            "MATCHES:",
            matches
        );


        // --------------------------------------------------
        // NO MATCHES
        // --------------------------------------------------

        if (!matches.length) {

            if (emptyBox) {
                emptyBox.style.display = "block";
            }

            if (statusText) {
                statusText.textContent =
                    "No matches found";
            }

            return;
        }


        // --------------------------------------------------
        // RENDER
        // --------------------------------------------------

        renderMatches(matches);


        if (statusText) {
            statusText.textContent =
                `${matches.length} matches found`;
        }

    }


    catch (error) {

        console.error(
            "Match API Error:",
            error
        );

        showError(error);

        if (statusText) {
            statusText.textContent =
                "Unable to load matches";
        }

    }


    finally {

        if (loader) {
            loader.style.display = "none";
        }

        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = "↻ Refresh";
        }
    }
}


// ======================================================
// GET MATCH ARRAY
// ======================================================

function getMatchesArray(data) {

    // Exact structure from your API
    if (
        data &&
        Array.isArray(data.Matches)
    ) {

        return data.Matches;
    }


    // Lowercase fallback
    if (
        data &&
        Array.isArray(data.matches)
    ) {

        return data.matches;
    }


    // Direct array fallback
    if (Array.isArray(data)) {

        return data;
    }


    // Other possible API structures
    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;
    }


    if (
        data &&
        data.data &&
        Array.isArray(data.data.Matches)
    ) {

        return data.data.Matches;
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


// ======================================================
// RENDER MATCHES
// ======================================================

function renderMatches(matches) {

    if (!matchesGrid) {
        return;
    }


    matchesGrid.innerHTML = "";


    matches.forEach(
        (match, index) => {

            const card =
                createMatchCard(
                    match,
                    index
                );

            matchesGrid.appendChild(card);
        }
    );
}


// ======================================================
// CREATE MATCH CARD
// ======================================================

function createMatchCard(
    match,
    index
) {

    const card =
        document.createElement("article");


    card.className =
        "match-card";


    // --------------------------------------------------
    // TITLE
    // --------------------------------------------------

    const title =
        getValue(
            match,
            [
                "title",
                "name",
                "match_name",
                "match_title"
            ],
            "Cricket Match"
        );


    // --------------------------------------------------
    // TOURNAMENT
    // --------------------------------------------------

    const tournament =
        getValue(
            match,
            [
                "tournament",
                "series",
                "league",
                "competition"
            ],
            "Cricket"
        );


    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    const status =
        String(
            getValue(
                match,
                [
                    "status",
                    "state"
                ],
                "UPCOMING"
            )
        )
        .toUpperCase();


    // --------------------------------------------------
    // IMAGE
    // IMPORTANT: API USES cover_image
    // --------------------------------------------------

    const image =
        getValue(
            match,
            [
                "cover_image",
                "image",
                "thumbnail",
                "poster",
                "logo"
            ],
            ""
        );


    // --------------------------------------------------
    // MATCH ID
    // --------------------------------------------------

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


    // --------------------------------------------------
    // TIME
    // --------------------------------------------------

    const matchTime =
        getValue(
            match,
            [
                "time",
                "match_time",
                "start_time",
                "startTime"
            ],
            ""
        );


    // --------------------------------------------------
    // SYNOPSIS
    // --------------------------------------------------

    const synopsis =
        getValue(
            match,
            [
                "synopsis"
            ],
            ""
        );


    const isLive =
        status === "LIVE";


    const isCompleted =
        status === "COMPLETED";


    // --------------------------------------------------
    // IMAGE HTML
    // --------------------------------------------------

    let imageHTML;


    if (image) {

        imageHTML = `
            <img
                class="match-image"
                src="${escapeAttr(image)}"
                alt="${escapeAttr(title)}"
                loading="lazy"
                onerror="this.style.display='none'; this.parentElement.classList.add('no-image')"
            >
        `;

    } else {

        imageHTML = `
            <div class="no-image">
                <span>🏏</span>
            </div>
        `;
    }


    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    let statusHTML = "";


    if (isLive) {

        statusHTML = `
            <div class="status-badge live">
                <span class="live-dot"></span>
                LIVE
            </div>
        `;

    } else if (isCompleted) {

        statusHTML = `
            <div class="status-badge completed">
                COMPLETED
            </div>
        `;

    } else {

        statusHTML = `
            <div class="status-badge upcoming">
                UPCOMING
            </div>
        `;
    }


    // --------------------------------------------------
    // TIME HTML
    // --------------------------------------------------

    const timeHTML =
        matchTime
            ? `
                <div class="match-time">
                    🕒 ${escapeHtml(matchTime)}
                </div>
              `
            : "";


    // --------------------------------------------------
    // SYNOPSIS HTML
    // --------------------------------------------------

    const synopsisHTML =
        synopsis
            ? `
                <div class="match-synopsis">
                    ${escapeHtml(synopsis)}
                </div>
              `
            : "";


    // --------------------------------------------------
    // CARD
    // --------------------------------------------------

    card.innerHTML = `

        <div class="match-poster">

            ${imageHTML}

            ${statusHTML}

        </div>


        <div class="match-content">

            <h2 class="match-title">
                ${escapeHtml(title)}
            </h2>


            <p class="match-tournament">
                ${escapeHtml(tournament)}
            </p>


            ${timeHTML}


            ${synopsisHTML}


            <div class="match-bottom">

                <span class="match-id">
                    #${escapeHtml(String(matchId))}
                </span>


                <button
                    class="watch-btn"
                    type="button"
                >
                    ${isLive ? "Watch Now" : "View Match"}
                </button>

            </div>

        </div>
    `;


    // --------------------------------------------------
    // WATCH BUTTON
    // --------------------------------------------------

    const watchButton =
        card.querySelector(
            ".watch-btn"
        );


    if (watchButton) {

        watchButton.addEventListener(
            "click",
            () => {

                openMatch(
                    match,
                    index
                );
            }
        );
    }


    return card;
}


// ======================================================
// OPEN MATCH
// ======================================================

function openMatch(
    match,
    index
) {

    console.log(
        "SELECTED MATCH:",
        match
    );


    console.log(
        "MATCH JSON:",
        JSON.stringify(
            match,
            null,
            2
        )
    );


    // --------------------------------------------------
    // OFFICIAL MATCH URL
    // --------------------------------------------------

    const matchUrl =
        match?.match_url;


    if (
        typeof matchUrl === "string" &&
        matchUrl.trim() !== ""
    ) {

        window.open(
            matchUrl.trim(),
            "_blank",
            "noopener,noreferrer"
        );

        return;
    }


    // --------------------------------------------------
    // FALLBACK
    // --------------------------------------------------

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
        "Official match URL is not available."
    );
}


// ======================================================
// GET VALUE
// ======================================================

function getValue(
    object,
    keys,
    fallback = ""
) {

    if (!object) {
        return fallback;
    }


    for (
        const key of keys
    ) {

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


// ======================================================
// SHOW ERROR
// ======================================================

function showError(error) {

    if (!errorBox) {
        return;
    }


    const message =
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


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttr(value) {

    return escapeHtml(value);
}


// ======================================================
// REFRESH BUTTON
// ======================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadMatches
    );
}


// ======================================================
// INITIAL LOAD
// ======================================================

loadMatches();


// ======================================================
// AUTO REFRESH
// Every 30 seconds
// ======================================================

setInterval(
    loadMatches,
    30000
);
