"use strict";

/* =========================================
   CONFIG
========================================= */

const API_URL = "/api/matches";


/* =========================================
   DOM
========================================= */

const matchesGrid = document.getElementById("matchesGrid");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");

const refreshBtn = document.getElementById("refreshBtn");

const liveCount = document.getElementById("liveCount");
const upcomingCount = document.getElementById("upcomingCount");

const playerModal = document.getElementById("playerModal");
const closePlayer = document.getElementById("closePlayer");

const video = document.getElementById("video");
const playerMessage = document.getElementById("playerMessage");


/* =========================================
   SHAKA PLAYER
========================================= */

let shakaPlayer = null;


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadMatches);
    }

    if (closePlayer) {
        closePlayer.addEventListener("click", closeVideoPlayer);
    }

    if (playerModal) {
        playerModal.addEventListener("click", (event) => {

            if (event.target === playerModal) {
                closeVideoPlayer();
            }

        });
    }

    loadMatches();
});


/* =========================================
   LOAD API
========================================= */

async function loadMatches() {

    showLoader();
    hideError();

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("API RESPONSE:", data);

        const matches = getMatchesArray(data);

        console.log("MATCHES:", matches);

        updateStats(data, matches);

        renderMatches(matches);

    } catch (error) {

        console.error("LOAD MATCH ERROR:", error);

        showError(
            "Unable to load matches.<br><br>" +
            escapeHtml(error.message)
        );

    } finally {

        hideLoader();

    }
}


/* =========================================
   GET MATCH ARRAY
========================================= */

function getMatchesArray(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.Matches)) {
        return data.Matches;
    }

    if (Array.isArray(data?.matches)) {
        return data.matches;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
}


/* =========================================
   UPDATE STATS
========================================= */

function updateStats(data, matches) {

    const live =
        Number(data?.Stats?.LiveCount) ||
        matches.filter(
            match =>
                String(match?.status || "").toUpperCase() === "LIVE"
        ).length;

    const upcoming =
        Number(data?.Stats?.UpcomingCount) ||
        matches.filter(
            match =>
                String(match?.status || "").toUpperCase() !== "LIVE"
        ).length;

    liveCount.textContent = `LIVE ${live}`;
    upcomingCount.textContent = `UPCOMING ${upcoming}`;
}


/* =========================================
   RENDER MATCHES
========================================= */

function renderMatches(matches) {

    matchesGrid.innerHTML = "";

    if (!matches.length) {

        matchesGrid.innerHTML = `
            <div class="empty-box">
                No matches available.
            </div>
        `;

        return;
    }

    matches.forEach((match, index) => {

        const card = createMatchCard(match, index);

        matchesGrid.appendChild(card);

    });
}


/* =========================================
   CREATE MATCH CARD
========================================= */

function createMatchCard(match, index) {

    const card = document.createElement("article");

    card.className = "match-card";

    const image =
        getString(match?.cover_image) ||
        "https://via.placeholder.com/800x450?text=CricZone";

    const title =
        getString(match?.title) ||
        "Cricket Match";

    const synopsis =
        getString(match?.synopsis) ||
        "Live cricket coverage";

    const status =
        getString(match?.status) ||
        "UPCOMING";

    const time =
        getString(match?.time) ||
        "";

    const isLive =
        status.toUpperCase() === "LIVE";


    card.innerHTML = `

        <div class="match-image-wrapper">

            <img
                class="match-image"
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
            >

            <div class="match-status ${isLive ? "live" : ""}">

                ${
                    isLive
                    ? `<span class="live-dot"></span>`
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
                ${escapeHtml(synopsis)}
            </p>

            ${
                time
                ? `
                    <div class="match-info">
                        🕐 ${escapeHtml(time)}
                    </div>
                `
                : ""
            }


            <button
                class="watch-btn"
                data-index="${index}"
            >
                ${isLive ? "▶ Watch Now" : "View Match"}
            </button>

        </div>
    `;


    const button = card.querySelector(".watch-btn");

    button.addEventListener("click", () => {

        openMatch(match);

    });


    return card;
}


/* =========================================
   FIND STREAM URL
========================================= */

function getStreamUrl(match) {

    /*
       Your API has:

       stream_url_alpha: {
           "Fistly Server": "...",
           "Amazon Server": "...",
           "Akamai Server": "...",
           "Cloudfront Server 1": "...",
           "Cloudfront Server 2": "..."
       }

       Same structure for bravo.
    */


    const alpha = match?.stream_url_alpha || {};
    const bravo = match?.stream_url_bravo || {};


    const sources = [

        alpha["Fistly Server"],
        alpha["Amazon Server"],
        alpha["Akamai Server"],
        alpha["Cloudfront Server 1"],
        alpha["Cloudfront Server 2"],

        bravo["Fistly Server"],
        bravo["Amazon Server"],
        bravo["Akamai Server"],
        bravo["Cloudfront Server 1"],
        bravo["Cloudfront Server 2"]

    ];


    const validSource = sources.find(
        url =>
            typeof url === "string" &&
            url.trim() !== ""
    );


    return validSource || null;
}


/* =========================================
   OPEN MATCH
========================================= */

async function openMatch(match) {

    console.log("SELECTED MATCH:", match);

    const streamUrl = getStreamUrl(match);

    console.log("SELECTED STREAM:", streamUrl);


    if (!streamUrl) {

        alert(
            "Stream is not available for this match."
        );

        return;
    }


    /*
       Detect DRM-protected stream.

       Your supplied API contains:
       cenc.mpd
       + drm_key

       Therefore Shaka needs the authorized
       DRM license server configuration.
    */

    const hasDrm =
        Boolean(match?.drm_key) ||
        streamUrl.includes(".mpd");


    if (hasDrm) {

        openPlayer();

        showPlayerMessage(
            "This stream uses DRM protection. " +
            "An authorized DRM license-server configuration " +
            "is required for Shaka Player playback."
        );

        console.log(
            "DRM STREAM:",
            streamUrl
        );

        return;
    }


    /*
       Non-DRM stream
    */

    await playWithShaka(streamUrl);
}


/* =========================================
   SHAKA PLAY
========================================= */

async function playWithShaka(streamUrl) {

    openPlayer();

    clearPlayerMessage();


    if (!shaka.Player.isBrowserSupported()) {

        showPlayerMessage(
            "This browser does not support Shaka Player."
        );

        return;
    }


    try {

        if (shakaPlayer) {

            await shakaPlayer.destroy();

            shakaPlayer = null;
        }


        shakaPlayer = new shaka.Player(video);


        shakaPlayer.addEventListener(
            "error",
            onShakaError
        );


        /*
           IMPORTANT:

           If your stream is protected by DRM,
           put your AUTHORIZED license server here.

           Example:

           shakaPlayer.configure({
               drm: {
                   servers: {
                       "com.widevine.alpha":
                           "https://YOUR-LICENSE-SERVER"
                   }
               }
           });

           Do NOT put the raw drm_key here.
        */


        await shakaPlayer.load(streamUrl);


        console.log(
            "Shaka playback started:",
            streamUrl
        );

    } catch (error) {

        console.error(
            "SHAKA LOAD ERROR:",
            error
        );

        showPlayerMessage(
            "Unable to play this stream.<br><br>" +
            escapeHtml(
                error?.message || "Playback error"
            )
        );
    }
}


/* =========================================
   SHAKA ERROR
========================================= */

function onShakaError(event) {

    console.error(
        "Shaka Error:",
        event.detail
    );

    const error = event.detail;

    showPlayerMessage(
        "Player error: " +
        escapeHtml(
            error?.message || "Unknown playback error"
        )
    );
}


/* =========================================
   PLAYER OPEN
========================================= */

function openPlayer() {

    playerModal.classList.add("active");

    document.body.classList.add("player-open");
}


/* =========================================
   PLAYER CLOSE
========================================= */

async function closeVideoPlayer() {

    playerModal.classList.remove("active");

    document.body.classList.remove("player-open");


    try {

        video.pause();

        video.removeAttribute("src");

        video.load();

    } catch (error) {

        console.warn(error);

    }


    if (shakaPlayer) {

        try {

            await shakaPlayer.destroy();

        } catch (error) {

            console.warn(
                "Shaka destroy error:",
                error
            );

        }

        shakaPlayer = null;
    }


    clearPlayerMessage();
}


/* =========================================
   PLAYER MESSAGE
========================================= */

function showPlayerMessage(message) {

    playerMessage.innerHTML = message;

    playerMessage.style.display = "block";
}


function clearPlayerMessage() {

    playerMessage.innerHTML = "";

    playerMessage.style.display = "none";
}


/* =========================================
   LOADER
========================================= */

function showLoader() {

    loader.style.display = "flex";
}


function hideLoader() {

    loader.style.display = "none";
}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    errorBox.innerHTML = message;

    errorBox.style.display = "block";
}


function hideError() {

    errorBox.style.display = "none";

    errorBox.innerHTML = "";
}


/* =========================================
   HELPERS
========================================= */

function getString(value) {

    if (
        typeof value === "string" &&
        value.trim() !== ""
    ) {

        return value.trim();

    }

    return "";
}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHtml(value);
}
