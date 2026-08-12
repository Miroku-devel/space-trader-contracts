// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const searchOverlay = document.getElementById("search-overlay");
const searchPanel = document.getElementById("search-panel");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchFavorites = document.getElementById("search-bookmarks");
let _bookmarksTimer = null;
let _blurTimer = null;
function renderBookmarks() {
  const favs = stars.filter((s) => s.bookmark);
  if (!favs.length && !searchFavorites.classList.contains("has-bookmarks"))
    return;
  if (favs.length) {
    searchFavorites.innerHTML = `<div class="search-section"><div class="search-section-title">Star Bookmarks (${favs.length}/${BOOKMARK_MAX})</div>${favs
      .map((star) => {
        return `<div class="result-item" data-name="${star.name}">
                <span class="result-name">${star.name}</span>
                <button class="result-route">${ICON_WAYPOINTS}</button>
                <button class="result-remove">${ICON_CLOSE}</button>
            </div>`;
      })
      .join("")}</div>`;
    searchFavorites.classList.add("has-bookmarks");
  } else {
    searchFavorites.classList.remove("has-bookmarks");
    const onEnd = () => {
      searchFavorites.removeEventListener("transitionend", onEnd);
      searchFavorites.innerHTML = "";
    };
    searchFavorites.addEventListener("transitionend", onEnd);
  }
}
function openSearch() {
  if (!searchOverlay.classList.contains("hidden")) {
    closeSearch();
    return;
  }
  closeAllOverlays();
  searchFavorites.classList.remove("has-bookmarks");
  searchFavorites.innerHTML = "";
  searchOverlay.classList.remove("hidden");
  searchPanel.classList.remove("blur-bg");
  searchInput.value = "";
  searchResults.innerHTML = "";
  setTimeout(() => searchInput.focus(), 50);
  clearTimeout(_bookmarksTimer);
  clearTimeout(_blurTimer);
  _bookmarksTimer = setTimeout(renderBookmarks, 200);
  _blurTimer = setTimeout(() => searchPanel.classList.add("blur-bg"), 350);
}
function closeSearch() {
  clearTimeout(_bookmarksTimer);
  clearTimeout(_blurTimer);
  searchPanel.classList.remove("blur-bg");
  if (searchFavorites.classList.contains("has-bookmarks")) {
    searchFavorites.classList.remove("has-bookmarks");
    const onEnd = () => {
      searchFavorites.removeEventListener("transitionend", onEnd);
      searchFavorites.innerHTML = "";
      searchOverlay.classList.add("hidden");
    };
    searchFavorites.addEventListener("transitionend", onEnd);
  } else {
    searchFavorites.innerHTML = "";
    searchOverlay.classList.add("hidden");
  }
}
function doSearch() {
  const q = searchInput.value.toLowerCase().trim();
  searchResults.innerHTML = "";
  if (!q) return;
  const matches = stars
    .filter((s) => s.name.toLowerCase().includes(q))
    .slice(0, 10);
  for (const star of matches) {
    const div = document.createElement("div");
    div.className = "result-item";
    const nameSpan = document.createElement("span");
    nameSpan.className = "result-name";
    nameSpan.textContent = star.name;
    const routeBtn = document.createElement("button");
    routeBtn.className = "result-route";
    routeBtn.innerHTML = ICON_WAYPOINTS;
    routeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedStar = star;
      showRoute(star);
      closeSearch();
    });
    div.appendChild(nameSpan);
    div.appendChild(routeBtn);
    div.addEventListener("click", () => {
      selectedStar = star;
      cameraTarget = { x: star.x, y: star.y, zoom: 15 };
      closeSearch();
    });
    searchResults.appendChild(div);
  }
}
function showRoute(star) {
  if (!currentStar) return;
  const path = findPath(currentStar, star);
  routePath = path;
  updateInfoClean();
  if (path.length > 1) {
    let cx = 0,
      cy = 0;
    for (const s of path) {
      cx += s.x;
      cy += s.y;
    }
    cx /= path.length;
    cy /= path.length;
    let maxD = 0;
    for (const s of path) {
      const d = Math.hypot(s.x - cx, s.y - cy);
      if (d > maxD) maxD = d;
    }
    const zoom = Math.min(15, Math.max(1, canvas.width / (maxD * 4)));
    cameraTarget = { x: cx, y: cy, zoom };
  } else {
    cameraTarget = { x: star.x, y: star.y, zoom: 15 };
  }
}
document.getElementById("btn-search").addEventListener("click", openSearch);
document
  .getElementById("search-row")
  .insertAdjacentHTML("beforeend", '<button id="btn-search-close"></button>');
document.getElementById("btn-search-close").innerHTML = ICON_CLOSE;
document
  .getElementById("btn-search-close")
  .addEventListener("click", closeSearch);
searchOverlay.addEventListener("click", (e) => {
  if (e.target === searchOverlay) {
    closeSearch();
  }
});
searchResults.addEventListener("click", (e) => {
  const item = e.target.closest(".result-item");
  if (!item) return;
  const name = item.dataset.name;
  if (!name) return;
  const star = stars.find((s) => s.name === name);
  if (!star) return;
  if (e.target.closest(".result-route")) {
    selectedStar = star;
    showRoute(star);
    closeSearch();
  } else {
    selectedStar = star;
    cameraTarget = { x: star.x, y: star.y, zoom: 15 };
    closeSearch();
  }
});
searchFavorites.addEventListener("click", (e) => {
  const item = e.target.closest(".result-item");
  if (!item) return;
  const name = item.dataset.name;
  if (!name) return;
  const star = stars.find((s) => s.name === name);
  if (!star) return;
  if (e.target.closest(".result-remove")) {
    star.bookmark = false;
    if (typeof saveState === "function") saveState();
    renderBookmarks();
    return;
  }
  if (e.target.closest(".result-route")) {
    selectedStar = star;
    showRoute(star);
    closeSearch();
  } else {
    selectedStar = star;
    cameraTarget = { x: star.x, y: star.y, zoom: 15 };
    closeSearch();
  }
});
searchInput.addEventListener("input", doSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
  if (e.key === "Escape") closeSearch();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !searchOverlay.classList.contains("hidden")) {
    closeSearch();
  }
});
