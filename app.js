const API_URL =
  "https://skmkc.freeshow.fun/api/matches";


const matchesGrid =
  document.getElementById("matchesGrid");

const loader =
  document.getElementById("loader");

const errorBox =
  document.getElementById("errorBox");

const emptyBox =
  document.getElementById("emptyBox");

const statusText =
  document.getElementById("status");

const refreshBtn =
  document.getElementById("refreshBtn");


// ------------------------------------
// Load matches
// ------------------------------------

async function loadMatches() {

  showLoader();

  try {

    const response = await fetch(API_URL, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("API RESPONSE:", data);

    const matches = normalizeMatches(data);

    renderMatches(matches);

    statusText.textContent =
      `${matches.length} matches found`;

  } catch (error) {

    console.error("Match API Error:", error);

    showError(
      "Matches load nahi ho paaye.<br><br>" +
      `<strong>${escapeHtml(error.message)}</strong><br><br>` +
      "Agar browser CORS block kar raha hai, API ko same-origin " +
      "backend/proxy ke through load karna hoga."
    );

  } finally {

    loader.style.display = "none";

  }
}


// ------------------------------------
// Normalize API response
// ------------------------------------

function normalizeMatches(data) {

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

  return [];
}


// ------------------------------------
// Render matches
// ------------------------------------

function renderMatches(matches) {

  matchesGrid.innerHTML = "";

  if (!matches.length) {

    emptyBox.style.display = "block";

    return;
  }

  emptyBox.style.display = "none";

  matches.forEach((match, index) => {

    const card =
      createMatchCard(match, index);

    matchesGrid.appendChild(card);

  });
}


// ------------------------------------
// Create match card
// ------------------------------------

function createMatchCard(match, index) {

  const card =
    document.createElement("article");

  card.className = "match-card";


  const title =
    getValue(
      match,
      [
        "title",
        "name",
        "match_name",
        "match_title"
      ],
      "Live Match"
    );


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


  const status =
    String(
      getValue(
        match,
        [
          "status",
          "state"
        ],
        "LIVE"
      )
    ).toUpperCase();


  const image =
    getValue(
      match,
      [
        "image",
        "thumbnail",
        "poster",
        "logo"
      ],
      ""
    );


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


  card.innerHTML = `

    ${
      image
        ? `
          <img
            class="match-image"
            src="${escapeAttribute(image)}"
            alt="${escapeAttribute(title)}"
            loading="lazy"
            onerror="this.style.display='none'"
          >
        `
        : `
          <div class="match-image"></div>
        `
    }

    <div class="match-content">

      <div class="match-status">

        ${
          status === "LIVE"
            ? `<span class="live-dot"></span>`
            : ""
        }

        ${escapeHtml(status)}

      </div>

      <div class="match-title">
        ${escapeHtml(title)}
      </div>

      <div class="match-tournament">
        ${escapeHtml(tournament)}
      </div>

      <div class="match-info">

        <span class="match-id">
          ID: ${escapeHtml(String(matchId))}
        </span>

        <button
          class="watch-btn"
          type="button"
        >
          Watch
        </button>

      </div>

    </div>
  `;


  const watchBtn =
    card.querySelector(".watch-btn");


  watchBtn.addEventListener(
    "click",
    () => {

      console.log(
        "Selected match:",
        match
      );

      openMatch(match);

    }
  );


  return card;
}


// ------------------------------------
// Open match
// ------------------------------------

function openMatch(match) {

  console.log(
    "FULL MATCH DATA:",
    match
  );

  /*
    Abhi API ke exact player URL ko assume
    nahi kar rahe hain.

    Pehle console me complete match object
    dekho.

    Agar stream URL milta hai to yahan use
    kar sakte ho.
  */

  const streamUrl =
    findStreamUrl(match);


  if (streamUrl) {

    window.open(
      streamUrl,
      "_blank"
    );

    return;
  }


  alert(
    "Is match object me direct stream URL nahi mila.\n\n" +
    "Console me FULL MATCH DATA check karo."
  );
}


// ------------------------------------
// Find stream URL
// ------------------------------------

function findStreamUrl(match) {

  const streams =
    match?.streams || {};


  const possibleUrls = [

    match?.stream_url,
    match?.streamUrl,
    match?.url,

    streams?.primary,
    streams?.stream_url,
    streams?.url,

    streams?.fancode_cdn,
    streams?.fancode_lk_cdn,
    streams?.fancode_np_cdn,
    streams?.fancode_bd_cdn

  ];


  return possibleUrls.find(
    url =>
      typeof url === "string" &&
      url.trim() !== ""
  ) || null;
}


// ------------------------------------
// Get value
// ------------------------------------

function getValue(
  object,
  keys,
  fallback = ""
) {

  for (const key of keys) {

    if (
      object &&
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {

      return object[key];

    }

  }

  return fallback;
}


// ------------------------------------
// Loading
// ------------------------------------

function showLoader() {

  loader.style.display = "flex";

  errorBox.style.display = "none";

  emptyBox.style.display = "none";

  matchesGrid.innerHTML = "";

  statusText.textContent =
    "Loading matches...";

}


// ------------------------------------
// Error
// ------------------------------------

function showError(message) {

  errorBox.innerHTML = message;

  errorBox.style.display = "block";

  matchesGrid.innerHTML = "";

}


// ------------------------------------
// HTML escaping
// ------------------------------------

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


// ------------------------------------
// Refresh
// ------------------------------------

refreshBtn.addEventListener(
  "click",
  loadMatches
);


// ------------------------------------
// Initial load
// ------------------------------------

loadMatches();


// ------------------------------------
// Auto refresh every 30 seconds
// ------------------------------------

setInterval(
  loadMatches,
  30000
);