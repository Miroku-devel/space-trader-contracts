// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

var turnCounter = 0;
var gameKills = 0;
var policeRecordScore = 0;
var gameReputationScore = 0;
var gameMissionsCompleted = 0;
var gameEscapes = 0;
window.SAVE_KEY = "stc_state";
function resetGame() {
  closeAllOverlays();
  localStorage.removeItem(TIME_SAVE_KEY);
  gameSessionStart = Date.now();
  gameKills = 0;
  policeRecordScore = 0;
  window._deathHandled = false;
  gameReputationScore = 0;
  gameMissionsCompleted = 0;
  gameEscapes = 0;
  if (typeof window.SAVE_KEY !== "undefined")
    localStorage.removeItem(window.SAVE_KEY);
  if (typeof resetMissionState === "function") resetMissionState();
  if (typeof playerShip !== "undefined")
    playerShip = {
      name: "Flea",
      gadgets: [],
      weapons: [],
      shields: [],
      specials: [],
    };
  resetTradeState();
  nameIndex = 0;
  generateStars();
  buildConstellation();
  currentStar = stars[0];
  currentStar.visited = true;
  selectedStar = currentStar;
  if (typeof updateNewsLabel === "function") updateNewsLabel();
  camera.x = currentStar.x;
  camera.y = currentStar.y;
  camera.zoom = 1;
  cameraTarget = null;
  routePath = [];
  ptDataNeedsUpdate = true;
  mailMessages = [];
  localStorage.removeItem(MAIL_SAVE_KEY);
  localStorage.removeItem("stc_equip");
  localStorage.removeItem("stc_fuel");
  if (typeof playerFuel !== "undefined") playerFuel = maxFuelCapacity();
  updateMailButton();
  updateInfoClean();
  if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
  if (typeof updateFuelBlink === "function") updateFuelBlink();
  window.CREW_NAMES = generateCrewNames();
  saveCrewNames();
  avatarAssignments = null;
  localStorage.removeItem(AVATAR_SAVE_KEY);
  if (typeof generateProcMissions === "function")
    generateProcMissions(currentStar);
}
function saveState() {
  savePlayTime();
  if (typeof saveFuelState === "function") saveFuelState();
  const data = {
    stars: stars.map((s) => ({
      x: s.x,
      y: s.y,
      size: s.size,
      brightness: s.brightness,
      spectral: s.spectral,
      color: s.color,
      name: s.name,
      mass: s.mass,
      twinklePhase: s.twinklePhase,
      twinkleSpeed: s.twinkleSpeed,
      bridge: s.bridge || false,
      bridgeExitName: s.bridgeExit ? s.bridgeExit.name : null,
      system: s.system,
      status: s.status != null ? s.status : 0,
      visited: s.visited || false,
      resource: s.resource,
      planetClass: s.planetClass || null,
      owned: s.owned || false,
      bookmark: s.bookmark || false,
      moonMailSent: s.moonMailSent || false,
      inventory: s.inventory,
      priceOffsets: s.priceOffsets,
      replenishCountdown:
        s.replenishCountdown != null ? s.replenishCountdown : 0,
      techLevel: s.techLevel,
      planetColor: s.planetColor,
    })),
    currentStarName: currentStar ? currentStar.name : null,
    nameIndex: nameIndex,
    routeNames: routePath.length > 1 ? routePath.map((s) => s.name) : null,
    nebulaSeed: window._nebulaSeed,
    turnCounter: turnCounter,
    gameKills: gameKills,
    gameEscapes: gameEscapes,
    gameMissionsCompleted: gameMissionsCompleted,
    policeRecordScore: policeRecordScore,
    gameReputationScore: gameReputationScore,
  };
  localStorage.setItem(window.SAVE_KEY, JSON.stringify(data));
}
function loadState() {
  const raw = localStorage.getItem(window.SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (!data.stars || !data.stars.length) return false;
    stars = data.stars.map((s) => ({
      ...s,
      mass: s.mass != null ? s.mass : Math.random(),
      bridgeExit: null,
      system:
        s.system ||
        POLITICAL_SYSTEMS[Math.floor(Math.random() * POLITICAL_SYSTEMS.length)],
    }));
    const nameMap = new Map(stars.map((s) => [s.name, s]));
    for (const s of stars) {
      if (s.bridgeExitName) {
        s.bridgeExit = nameMap.get(s.bridgeExitName) || null;
      }
      if (s.planetClass === "Habitable Moon" && s.visited && !s.owned) {
        s.moonMailSent = true;
      }
    }
    nameIndex = data.nameIndex || stars.length;
    if (data.currentStarName && nameMap.has(data.currentStarName)) {
      currentStar = nameMap.get(data.currentStarName);
    } else {
      currentStar = stars[0];
    }
    currentStar.visited = true;
    selectedStar = currentStar;
    if (typeof updateNewsLabel === "function") updateNewsLabel();
    window._nebulaSeed =
      data.nebulaSeed != null ? data.nebulaSeed : (Math.random() - 0.5) * 4.0;
    if (data.routeNames && data.routeNames.length > 1) {
      routePath = data.routeNames.map((n) => nameMap.get(n)).filter(Boolean);
      updateInfoClean();
    }
    if (data.turnCounter != null) turnCounter = data.turnCounter;
    if (data.gameKills != null) gameKills = data.gameKills;
    if (data.gameEscapes != null) gameEscapes = data.gameEscapes;
    if (data.gameMissionsCompleted != null)
      gameMissionsCompleted = data.gameMissionsCompleted;
    if (data.policeRecordScore != null)
      policeRecordScore = data.policeRecordScore;
    if (data.gameReputationScore != null)
      gameReputationScore = data.gameReputationScore;
    return true;
  } catch {
    return false;
  }
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
const PROGRESS_CIRCUMFERENCE = 276.46;
function setProgress(pct) {
  const ring = document.getElementById("progress-ring");
  if (!ring) return;
  const offset = PROGRESS_CIRCUMFERENCE - (pct / 100) * PROGRESS_CIRCUMFERENCE;
  ring.style.strokeDashoffset = offset;
  if (pct >= 100) {
    document.getElementById("loading-ring")?.classList.add("closed");
  }
}
async function initGame() {
  if (window._glUnsupported) return;
  setProgress(15);
  await sleep(0);
  resize();
  window.addEventListener("resize", resize);
  loadCommanderState();
  if (typeof updateCommanderNameDisplay === "function")
    updateCommanderNameDisplay();
  if (typeof restoreSidebarBg === "function") restoreSidebarBg();
  setProgress(30);
  await sleep(0);
  window._hasSaveData = loadState();
  if (!window._hasSaveData) {
    setProgress(45);
    await sleep(0);
    generateStars();
    currentStar = stars[0];
    currentStar.visited = true;
    selectedStar = currentStar;
    if (typeof updateNewsLabel === "function") updateNewsLabel();
    if (typeof resetMissionState === "function") resetMissionState();
    if (typeof generateProcMissions === "function")
      generateProcMissions(currentStar);
  } else {
    if (typeof loadMissionState === "function") {
      if (!loadMissionState()) {
        generateProcMissions(currentStar);
      }
    }
  }
  if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
  setProgress(70);
  await sleep(0);
  if (typeof initPlayerShip === "function") initPlayerShip();
  rebuildSortedIndices();
  camera.x = currentStar.x;
  camera.y = currentStar.y;
  setProgress(85);
  await sleep(0);
  buildConstellation();
  ptDataNeedsUpdate = true;
  updateInfoClean();
  if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
  setProgress(90);
  await sleep(0);
  var shipPromises = [];
  if (typeof shipSvgFor === "function") {
    var shipKeys = Object.keys(typeof Z !== "undefined" ? Z : {});
    if (typeof ZS !== "undefined") shipKeys = shipKeys.concat(Object.keys(ZS));
    shipKeys.forEach(function (name) {
      shipPromises.push(shipSvgFor(name));
    });
  }
  if (shipPromises.length > 0) await Promise.all(shipPromises);
  setProgress(95);
  await sleep(0);
  if (typeof SFX !== "undefined" && typeof SFX.preloadAll === "function") {
    await SFX.preloadAll();
  }
  setProgress(100);
  await sleep(0);
  var startBtn = document.getElementById("start-btn");
  if (startBtn) startBtn.classList.add("visible");
  animate(0);
}
initGame().catch(function (err) {
  console.error("Init failed:", err);
  document.getElementById("progress-ring")?.classList.add("closed");
});
