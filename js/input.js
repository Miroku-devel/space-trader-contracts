// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function isOverlayActive() {
  return (
    !document.getElementById("search-overlay").classList.contains("hidden") ||
    !document.getElementById("trade-overlay").classList.contains("hidden") ||
    !document
      .getElementById("dashboard-overlay")
      .classList.contains("hidden") ||
    !document.getElementById("ship-overlay").classList.contains("hidden") ||
    !document.getElementById("bank-overlay").classList.contains("hidden") ||
    !document.getElementById("mail-overlay").classList.contains("hidden") ||
    !document.getElementById("mission-overlay").classList.contains("hidden") ||
    !document.getElementById("options-overlay").classList.contains("hidden") ||
    !document
      .getElementById("commander-overlay")
      .classList.contains("hidden") ||
    !document.getElementById("travel-overlay").classList.contains("hidden") ||
    !document.getElementById("wormhole-overlay").classList.contains("hidden")
  );
}
const canvas = document.getElementById("canvas");
const labelCanvas = document.getElementById("labels");
const labelCtx = labelCanvas.getContext("2d");
const starInfo = document.getElementById("star-info");
const btnInfoRoute = document.getElementById("btn-route");
const btnInfoTravel = document.getElementById("btn-travel");
const btnInfoWormhole = document.getElementById("btn-wormhole");
const hudBtnRoute = document.getElementById("hud-btn-route");
const hudBtnTravel = document.getElementById("hud-btn-travel");
const hudBtnWormhole = document.getElementById("hud-btn-wormhole");
const dashboardOverlay = document.getElementById("dashboard-overlay");
const shipOverlay = document.getElementById("ship-overlay");
const bankOverlay = document.getElementById("bank-overlay");
const mailOverlay = document.getElementById("mail-overlay");
const missionOverlay = document.getElementById("mission-overlay");
let clickTimer = null;
let _lastHitTest = 0;
function updateRouteButton() {
  var isActive = routePath.length > 1;
  btnInfoRoute.innerHTML = isActive ? ICON_CLOSE : ICON_WAYPOINTS;
  btnInfoRoute.classList.toggle("route-clean", isActive);
  if (hudBtnRoute) {
    hudBtnRoute.innerHTML = isActive ? ICON_CLOSE : ICON_WAYPOINTS;
    hudBtnRoute.classList.toggle("route-clean", isActive);
  }
}
function updateInfoClean() {
  updateRouteButton();
  updateInfoRoute();
  if (typeof updateFuelBlink === "function") updateFuelBlink();
}
function updateInfoRoute() {
  if (routePath.length > 1) {
    btnInfoRoute.disabled = false;
  } else {
    btnInfoRoute.disabled = !(
      selectedStar &&
      selectedStar !== currentStar &&
      selectedStar !== routePath[routePath.length - 1]
    );
  }
  if (hudBtnRoute) hudBtnRoute.disabled = btnInfoRoute.disabled;
  updateInfoTravel();
  updateInfoWormhole();
}
function travelDistance(from, to) {
  return Math.round(
    Math.hypot(from.x - to.x, from.y - to.y) *
      (typeof PARSEC_SCALE !== "undefined" ? PARSEC_SCALE : 1),
  );
}
function starsWithinRange() {
  var result = [];
  if (!currentStar || typeof playerFuel === "undefined") return result;
  var sqRange = (playerFuel / PARSEC_SCALE) ** 2;
  if (currentStar.bridge && currentStar.bridgeExit) {
    result.push(currentStar.bridgeExit);
  }
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    if (s === currentStar) continue;
    var dx = s.x - currentStar.x;
    var dy = s.y - currentStar.y;
    if (dx * dx + dy * dy <= sqRange && !(s === currentStar.bridgeExit)) {
      result.push(s);
    }
  }
  return result;
}
function updateInfoTravel() {
  var inRange =
    selectedStar &&
    currentStar &&
    starsWithinRange().includes(selectedStar) &&
    selectedStar !== currentStar &&
    !(
      currentStar &&
      currentStar.bridge &&
      currentStar.bridgeExit &&
      selectedStar === currentStar.bridgeExit
    );
  btnInfoTravel.disabled =
    cantAffordInsurance() || debtIsTooLarge() || !inRange;
  if (hudBtnTravel) hudBtnTravel.disabled = btnInfoTravel.disabled;
}
function updateInfoWormhole() {
  var tax = typeof fuelCostPerUnit === "function" ? fuelCostPerUnit() * 25 : 0;
  var canPayTax = typeof playerCredits === "undefined" || playerCredits >= tax;
  btnInfoWormhole.disabled =
    cantAffordInsurance() ||
    debtIsTooLarge() ||
    !canPayTax ||
    !(
      selectedStar &&
      selectedStar.bridge &&
      selectedStar.bridgeExit &&
      selectedStar === currentStar
    );
  if (hudBtnWormhole) hudBtnWormhole.disabled = btnInfoWormhole.disabled;
}
function checkArrivalAlerts() {
  if (typeof checkDebtWarning === "function") checkDebtWarning();
  if (
    typeof autoFuel !== "undefined" &&
    autoFuel &&
    typeof attemptPurchaseOfFuel === "function"
  ) {
    attemptPurchaseOfFuel(maxFuelCapacity());
  }
  if (
    typeof autoRepair !== "undefined" &&
    autoRepair &&
    typeof attemptHullRepair === "function"
  ) {
    attemptHullRepair(maxHull());
  }
  if (
    currentStar &&
    currentStar.planetClass === "Habitable Moon" &&
    !currentStar.owned &&
    !currentStar.moonMailSent &&
    typeof addMailMessage === "function"
  ) {
    currentStar.moonMailSent = true;
    addMailMessage("Moon for Sale", `Welcome to ${currentStar.name}, this habitable moon is now available for purchase! Visit the bank for details.`);
  }
}
function closeAllOverlays() {
  const overlays = [
    "search-overlay",
    "trade-overlay",
    "dashboard-overlay",
    "ship-overlay",
    "bank-overlay",
    "mail-overlay",
    "mission-overlay",
    "options-overlay",
    "travel-overlay",
    "wormhole-overlay",
  ];
  for (const id of overlays) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }
  document.getElementById("bank-repay-overlay").classList.add("hidden");
  stopDashboardTimer();
  if (typeof dashboardAnimating !== "undefined") dashboardAnimating = false;
  if (typeof shipAnimating !== "undefined") shipAnimating = false;
  if (typeof bankAnimating !== "undefined") bankAnimating = false;
  if (typeof mailAnimating !== "undefined") mailAnimating = false;
  if (typeof missionAnimating !== "undefined") missionAnimating = false;
  if (typeof tradeAnimating !== "undefined") tradeAnimating = false;
}
function hitTest(sx, sy) {
  const w = screenToWorld(sx, sy);
  let closest = null;
  let closestDist = 20 / camera.zoom;
  for (const star of stars) {
    const d = Math.hypot(star.x - w.x, star.y - w.y);
    const hitR = Math.max(1, star.size * 0.5);
    if (d < hitR + closestDist) {
      closestDist = d;
      closest = star;
    }
  }
  return closest;
}
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  if (isOverlayActive()) return;
  if (e.button === 2) {
    isDragging = true;
    cameraTarget = null;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    cameraStart.x = camera.x;
    cameraStart.y = camera.y;
    return;
  }
  if (e.button !== 0) return;
  const star = hitTest(e.clientX, e.clientY);
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
    if (star) {
      selectedStar = star;
      cameraTarget = { x: star.x, y: star.y, zoom: 15 };
    }
    return;
  }
  if (!star) {
    selectedStar = null;
    cameraTarget = null;
    return;
  }
  clickTimer = setTimeout(() => {
    clickTimer = null;
  }, 300);
  selectedStar = selectedStar === star ? null : star;
  cameraTarget = null;
});
canvas.addEventListener("mousemove", (e) => {
  if (isOverlayActive()) return;
  if (isDragging) {
    canvas.style.cursor = "grabbing";
    const tx = cameraStart.x - (e.clientX - dragStart.x) / camera.zoom;
    const ty = cameraStart.y - (e.clientY - dragStart.y) / camera.zoom;
    camera.x += (tx - camera.x) * 0.35;
    camera.y += (ty - camera.y) * 0.35;
    clampCamera();
  } else if (performance.now() - _lastHitTest > 50) {
    _lastHitTest = performance.now();
    const star = hitTest(e.clientX, e.clientY);
    canvas.style.cursor = star ? "pointer" : "grab";
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (isOverlayActive()) return;
  if (e.button === 2) isDragging = false;
});
canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});
let touchDragActive = false;
let touchStartPos = { x: 0, y: 0 };
let touchCamStart = { x: 0, y: 0 };
let pinchStart = { dist: 0, camX: 0, camY: 0, zoom: 1, anchorX: 0, anchorY: 0 };
let touchStartCount = 0;
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (isOverlayActive()) return;
    e.preventDefault();
    touchDragActive = false;
    touchStartCount = e.touches.length;
    if (e.touches.length === 2) {
      const t1 = e.touches[0],
        t2 = e.touches[1];
      pinchStart.dist = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY,
      );
      pinchStart.camX = camera.x;
      pinchStart.camY = camera.y;
      pinchStart.zoom = camera.zoom;
      if (selectedStar) {
        pinchStart.anchorX = selectedStar.x;
        pinchStart.anchorY = selectedStar.y;
      } else {
        const cx = (t1.clientX + t2.clientX) / 2;
        const cy = (t1.clientY + t2.clientY) / 2;
        const w = screenToWorld(cx, cy);
        pinchStart.anchorX = w.x;
        pinchStart.anchorY = w.y;
      }
    } else {
      const t = e.touches[0];
      touchStartPos.x = t.clientX;
      touchStartPos.y = t.clientY;
      touchCamStart.x = camera.x;
      touchCamStart.y = camera.y;
    }
  },
  { passive: false },
);
window.addEventListener(
  "touchmove",
  (e) => {
    if (isOverlayActive()) return;
    e.preventDefault();
    if (e.touches.length === 2) {
      const t1 = e.touches[0],
        t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (pinchStart.dist > 0) {
        cameraTarget = null;
        const f = dist / pinchStart.dist;
        let ax, ay;
        if (selectedStar) {
          ax = selectedStar.x;
          ay = selectedStar.y;
        } else {
          ax = pinchStart.anchorX;
          ay = pinchStart.anchorY;
        }
        camera.zoom = Math.min(50, Math.max(0.6, pinchStart.zoom * f));
        camera.x =
          ax +
          (pinchStart.camX - pinchStart.anchorX) *
            (pinchStart.zoom / camera.zoom);
        camera.y =
          ay +
          (pinchStart.camY - pinchStart.anchorY) *
            (pinchStart.zoom / camera.zoom);
        clampCamera();
      }
      return;
    }
    if (touchStartCount >= 2 && e.touches.length === 1) {
      const t = e.touches[0];
      touchStartPos.x = t.clientX;
      touchStartPos.y = t.clientY;
      touchCamStart.x = camera.x;
      touchCamStart.y = camera.y;
    }
    const t = e.touches[0];
    const dx = t.clientX - touchStartPos.x;
    const dy = t.clientY - touchStartPos.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      touchDragActive = true;
      cameraTarget = null;
      const ttx = touchCamStart.x - (t.clientX - touchStartPos.x) / camera.zoom;
      const tty = touchCamStart.y - (t.clientY - touchStartPos.y) / camera.zoom;
      camera.x += (ttx - camera.x) * 0.35;
      camera.y += (tty - camera.y) * 0.35;
      clampCamera();
    }
  },
  { passive: false },
);
window.addEventListener(
  "touchend",
  (e) => {
    if (isOverlayActive()) return;
    if (e.target && e.target !== canvas && !canvas.contains(e.target)) return;
    pinchStart.dist = 0;
    if (touchDragActive || touchStartCount >= 2 || e.touches.length > 0) {
      touchDragActive = false;
      return;
    }
    const t = e.changedTouches[0];
    const star = hitTest(t.clientX, t.clientY);
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      if (star) {
        selectedStar = star;
        cameraTarget = { x: star.x, y: star.y, zoom: 15 };
      }
      return;
    }
    if (!star) {
      selectedStar = null;
      cameraTarget = null;
      return;
    }
    clickTimer = setTimeout(() => {
      clickTimer = null;
    }, 300);
    selectedStar = selectedStar === star ? null : star;
    cameraTarget = null;
  },
  { passive: false },
);
window.addEventListener("touchcancel", () => {
  touchDragActive = false;
});
canvas.addEventListener(
  "wheel",
  (e) => {
    if (isOverlayActive() || isDragging) return;
    e.preventDefault();
    const src = cameraTarget || camera;
    const p = Math.abs(e.deltaY) / 120;
    const factor = Math.min(3, 1 + p * 0.2);
    const f = e.deltaY > 0 ? 1 / factor : factor;
    const newZoom = Math.min(50, Math.max(0.6, src.zoom * f));
    const wx = selectedStar
      ? selectedStar.x
      : screenToWorld(e.clientX, e.clientY).x;
    const wy = selectedStar
      ? selectedStar.y
      : screenToWorld(e.clientX, e.clientY).y;
    cameraTarget = {
      x: wx + (src.x - wx) * (src.zoom / newZoom),
      y: wy + (src.y - wy) * (src.zoom / newZoom),
      zoom: newZoom,
    };
    const halfW = canvas.width / 2 / cameraTarget.zoom;
    const halfH = canvas.height / 2 / cameraTarget.zoom;
    const limit = Math.max(0, GALAXY_RADIUS * 2 - Math.min(halfW, halfH));
    cameraTarget.x = Math.max(-limit, Math.min(limit, cameraTarget.x));
    cameraTarget.y = Math.max(-limit, Math.min(limit, cameraTarget.y));
  },
  { passive: false },
);
function focusStar() {
  if (isOverlayActive()) return;
  const star = selectedStar || currentStar;
  if (star) {
    selectedStar = star;
    cameraTarget = { x: star.x, y: star.y, zoom: 15 };
  }
}
starInfo.addEventListener("mousedown", (e) => {
  e.stopPropagation();
  if (e.target.closest(".btn-fav")) return;
  focusStar();
});
document.getElementById("hud-star-text").addEventListener("mousedown", (e) => {
  e.stopPropagation();
  if (e.target.closest(".btn-fav")) return;
  focusStar();
});
document.getElementById("btn-home").addEventListener("click", () => {
  closeAllOverlays();
  if (currentStar) {
    selectedStar = currentStar;
    cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: 15 };
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (
      !document.getElementById("travel-overlay").classList.contains("hidden")
    ) {
      return;
    }
    if (
      !document.getElementById("wormhole-overlay").classList.contains("hidden")
    ) {
      return;
    }
    if (
      !document
        .getElementById("bank-repay-overlay")
        .classList.contains("hidden")
    ) {
      document.getElementById("bank-repay-overlay").classList.add("hidden");
      return;
    }
    if (!dashboardOverlay.classList.contains("hidden")) {
      hideDashboard();
    }
    if (!shipOverlay.classList.contains("hidden")) {
      shipOverlay.classList.add("hidden");
      shipAnimating = false;
    }
    if (!bankOverlay.classList.contains("hidden")) {
      hideBank();
    }
    if (!mailOverlay.classList.contains("hidden")) {
      mailOverlay.classList.add("hidden");
      mailAnimating = false;
    }
    if (!missionOverlay.classList.contains("hidden")) {
      missionOverlay.classList.add("hidden");
      missionAnimating = false;
    }
  }
});
window.addEventListener("beforeunload", () => {
  const co = document.getElementById("commander-overlay");
  const go = document.getElementById("gameover-overlay");
  if (
    (co && !co.classList.contains("hidden")) ||
    (go && !go.classList.contains("hidden"))
  ) {
    if (typeof window.SAVE_KEY !== "undefined")
      localStorage.removeItem(window.SAVE_KEY);
    return;
  }
  saveState();
});
(function () {
  const overlays = [
    "search-overlay",
    "trade-overlay",
    "dashboard-overlay",
    "ship-overlay",
    "bank-overlay",
    "mail-overlay",
    "mission-overlay",
    "options-overlay",
    "surrender-overlay",
    "trader-npc-overlay",
    "board-npc-overlay",
    "wormhole-overlay",
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  function updateBgBlur() {
    const wormhole = document.getElementById("wormhole-overlay");
    const anyOpen = overlays.some(
      (el) =>
        el !== wormhole &&
        el.id !== "trade-overlay" &&
        el.id !== "search-overlay" &&
        el.id !== "dashboard-overlay" &&
        el.id !== "ship-overlay" &&
        el.id !== "bank-overlay" &&
        el.id !== "mail-overlay" &&
        el.id !== "mission-overlay" &&
        el.id !== "options-overlay" &&
        el.id !== "trader-npc-overlay" &&
        el.id !== "surrender-overlay" &&
        el.id !== "board-npc-overlay" &&
        !el.classList.contains("hidden"),
    );
    const noBlur = document.documentElement.classList.contains("no-blur");
    const canvas = document.getElementById("canvas");
    const labels = document.getElementById("labels");
    const travelScene = document.getElementById("travel-scene");
    if (!noBlur) {
      if (canvas) canvas.classList.toggle("blur-bg", anyOpen);
      if (labels) labels.classList.toggle("blur-bg", anyOpen);
      if (travelScene) travelScene.classList.toggle("blur-bg", anyOpen);
    }
    const tradeOverlay = document.getElementById("trade-overlay");
    const tradeOpen = tradeOverlay && !tradeOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("trade-overlay", "trade-panel", tradeOpen);
    const searchOverlay = document.getElementById("search-overlay");
    const searchOpen = searchOverlay && !searchOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("search-overlay", "search-panel", searchOpen);
    const dashboardOverlay = document.getElementById("dashboard-overlay");
    const dashboardOpen = dashboardOverlay && !dashboardOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("dashboard-overlay", "dashboard-panel", dashboardOpen);
    const shipOverlay = document.getElementById("ship-overlay");
    const shipOpen = shipOverlay && !shipOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("ship-overlay", "ship-panel", shipOpen);
    const bankOverlay = document.getElementById("bank-overlay");
    const bankOpen = bankOverlay && !bankOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("bank-overlay", "bank-panel", bankOpen);
    const mailOverlay = document.getElementById("mail-overlay");
    const mailOpen = mailOverlay && !mailOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("mail-overlay", "mail-panel", mailOpen);
    const missionOverlay = document.getElementById("mission-overlay");
    const missionOpen = missionOverlay && !missionOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("mission-overlay", "mission-panel", missionOpen);
    const optionsOverlay = document.getElementById("options-overlay");
    const optionsOpen = optionsOverlay && !optionsOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("options-overlay", "options-panel", optionsOpen);
    const traderNpcOverlay = document.getElementById("trader-npc-overlay");
    const traderNpcOpen = traderNpcOverlay && !traderNpcOverlay.classList.contains("hidden");
    const traderNpcSky = document.querySelector("#travel-scene .combat-sky");
    if (window.updatePanelBlur) window.updatePanelBlur("trader-npc-overlay", "trader-npc-panel", traderNpcOpen, traderNpcSky);
    const surrenderOverlay = document.getElementById("surrender-overlay");
    const surrenderOpen = surrenderOverlay && !surrenderOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("surrender-overlay", "surrender-panel", surrenderOpen, traderNpcSky);
    const boardNpcOverlay = document.getElementById("board-npc-overlay");
    const boardNpcOpen = boardNpcOverlay && !boardNpcOverlay.classList.contains("hidden");
    if (window.updatePanelBlur) window.updatePanelBlur("board-npc-overlay", "board-npc-panel", boardNpcOpen, traderNpcSky);
  }
  window.updateBgBlur = updateBgBlur;
  overlays.forEach((el) => {
    new MutationObserver(updateBgBlur).observe(el, {
      attributes: true,
      attributeFilter: ["class"],
    });
  });
})();
const starText = document.getElementById("hud-star-text");
const syncStar = () => {
  starText.innerHTML = starInfo.innerHTML;
};
syncStar();
new MutationObserver(syncStar).observe(starInfo, {
  childList: true,
  subtree: true,
  characterData: true,
});
starText.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-fav");
  if (!btn) return;
  e.stopPropagation();
  const name = btn.dataset.name;
  const star = stars.find((s) => s.name === name);
  if (!star) return;
  const wasBookmarked = star.bookmark;
  if (typeof toggleBookmark === "function") toggleBookmark(star, btn);
  if (star.bookmark !== wasBookmarked) {
    btn.innerHTML = star.bookmark ? ICON_STAR_FILLED : ICON_STAR;
    const origFav = document.querySelector("#star-info .btn-fav");
    if (origFav) origFav.innerHTML = btn.innerHTML;
  }
});
