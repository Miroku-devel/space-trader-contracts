// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function isMobile() {
  if (navigator.userAgentData) return navigator.userAgentData.mobile;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}
window._resolutionScale = isFinite(
  parseFloat(localStorage.getItem("RESOLUTION_SCALE")),
)
  ? parseFloat(localStorage.getItem("RESOLUTION_SCALE"))
  : 1.0;
window._encounterRate = isFinite(
  parseFloat(localStorage.getItem("ENCOUNTER_RATE")),
)
  ? parseFloat(localStorage.getItem("ENCOUNTER_RATE"))
  : 1.0;
var rotOverlay = document.getElementById("rotate-overlay");
function checkOrientation() {
  if (isMobile() && window.innerWidth > window.innerHeight) {
    rotOverlay.classList.remove("hidden");
    document.body.classList.add("orientation-locked");
    if (typeof pauseMap === "function") pauseMap();
  } else {
    rotOverlay.classList.add("hidden");
    document.body.classList.remove("orientation-locked");
    if (typeof resumeMap === "function") resumeMap();
  }
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);
checkOrientation();
document.getElementById("btn-route").innerHTML = ICON_WAYPOINTS;
document.getElementById("btn-travel").innerHTML = ICON_TRAVEL;
document.getElementById("btn-wormhole").innerHTML = ICON_WORMHOLE;
document.getElementById("btn-home").innerHTML = ICON_HOME;
document.getElementById("btn-trade").innerHTML = ICON_TRADE;
document.getElementById("btn-search").innerHTML = ICON_SEARCH;
document.getElementById("btn-dashboard").innerHTML = ICON_FACE;
document.getElementById("btn-ship").innerHTML = ICON_SHIP;
document.getElementById("btn-ship").disabled = false;
document.getElementById("btn-bank").innerHTML = ICON_LANDMARK;
document.getElementById("btn-bank").disabled = false;
document.getElementById("btn-mail").innerHTML = ICON_MAIL;
document.getElementById("btn-mail").disabled = false;
document.getElementById("btn-mission").innerHTML = ICON_MISSION;
document.getElementById("btn-mission").disabled = false;
document.getElementById("hud-btn-route").innerHTML = ICON_WAYPOINTS;
document.getElementById("hud-btn-travel").innerHTML = ICON_TRAVEL;
document.getElementById("hud-btn-wormhole").innerHTML = ICON_WORMHOLE;
document.getElementById("hud-btn-home").innerHTML = ICON_HOME;
document.getElementById("hud-btn-trade").innerHTML = ICON_TRADE;
document.getElementById("hud-btn-search").innerHTML = ICON_SEARCH;
document.getElementById("hud-btn-dashboard").innerHTML = ICON_FACE;
document.getElementById("hud-btn-ship").innerHTML = ICON_SHIP;
document.getElementById("hud-btn-ship").disabled = false;
document.getElementById("hud-btn-bank").innerHTML = ICON_LANDMARK;
document.getElementById("hud-btn-bank").disabled = false;
document.getElementById("hud-btn-mail").innerHTML = ICON_MAIL;
document.getElementById("hud-btn-mail").disabled = false;
document.getElementById("hud-btn-mission").innerHTML = ICON_MISSION;
document.getElementById("hud-btn-mission").disabled = false;
document.getElementById("hud-btn-options").innerHTML = ICON_SETTINGS;
document.getElementById("hud-footer").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const origId = btn.id.replace("hud-", "");
  const orig = document.getElementById(origId);
  if (orig) orig.click();
});
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
document.getElementById("btn-options").innerHTML = ICON_SETTINGS;
const optionsOverlay = document.getElementById("options-overlay");
if (localStorage.getItem("HIDE_BREAKING_NEWS") === "1") {
  document.documentElement.classList.add("hide-breaking-news");
}
function applyNoBlur() {
  document.documentElement.classList.toggle(
    "no-blur",
    localStorage.getItem("NO_BLUR") === "1",
  );
}
window.addEventListener("resize", applyNoBlur);
applyNoBlur();
if (
  localStorage.getItem("NO_SOUND") === "1" &&
  typeof SFX !== "undefined" &&
  typeof SFX.setMuted === "function"
) {
  SFX.setMuted(true);
}
function hideOptions() {
  optionsOverlay.classList.add("hidden");
}
function renderOptions() {
  document.getElementById("options-content").innerHTML = `
        <div id="options-header">
            <div id="options-header-left">
                <span id="options-title">Options</span>
                <span id="options-subtitle">Per aspera ad astra</span>
            </div>
            <div id="options-header-right">
                <button id="btn-options-close"></button>
            </div>
        </div>
        <div id="options-slider">
            <div class="options-actions">
                <label class="fs-check-label"><input type="checkbox" id="chk-auto-fullscreen"> Auto Fullscreen</label>
                <label class="fs-check-label"><input type="checkbox" id="chk-show-framerate"> Show Framerate</label>
                <label class="fs-check-label"><input type="checkbox" id="chk-hide-breaking-news"> Hide Breaking News</label>
                <label class="fs-check-label"><input type="checkbox" id="chk-auto-ignore-traders"> No Traders</label>
                <label class="fs-check-label"><input type="checkbox" id="chk-no-sound"> Disable Audio</label>
                <label class="fs-check-label"><input type="checkbox" id="chk-no-blur"> No Blur Effects</label>
            </div>
            <div class="options-slider-column">
                <span class="options-slider-label">Music Volume<span id="options-music-value">100%</span></span>
                <input type="range" id="options-music-input" min="0" max="100" value="50" />
                <span class="options-slider-label">Resolution Scaling<span id="options-slider-value">100%</span></span>
                <input type="range" id="options-slider-input" min="0" max="200" value="100" />
                <span class="options-slider-label">Encounter Rate<span id="options-encounter-value">100%</span></span>
                <input type="range" id="options-encounter-input" min="0" max="200" value="100" />
                <div class="options-btn-row">
                    <button id="options-btn-default">Default</button>
                    <button id="options-btn-newgame">New Game</button>
                    <button id="options-btn-danger"></button>
                </div>
                <div class="options-btn-row">
                    <button id="options-btn-reset" class="hidden">Reset</button>
                    <button id="options-btn-debug" class="hidden"></button>
                </div>
            </div>
        </div>`;
  document.getElementById("btn-options-close").innerHTML = ICON_CLOSE;
  document
    .getElementById("btn-options-close")
    .addEventListener("click", hideOptions);
  const chk = document.getElementById("chk-auto-fullscreen");
  chk.checked = localStorage.getItem("AUTO_FULLSCREEN") === "1";
  chk.addEventListener("change", () => {
    localStorage.setItem("AUTO_FULLSCREEN", chk.checked ? "1" : "0");
    toggleFullscreen();
  });
  const chkFramerate = document.getElementById("chk-show-framerate");
  chkFramerate.checked = localStorage.getItem("debugFps") === "1";
  chkFramerate.addEventListener("change", () => {
    localStorage.setItem("debugFps", chkFramerate.checked ? "1" : "");
    window.debugMode = chkFramerate.checked;
    if (chkFramerate.checked) {
      if (typeof showFps === "function") showFps();
    } else {
      const el = document.getElementById("debug-fps");
      if (el) el.remove();
    }
  });
  const chkHideBreakingNews = document.getElementById("chk-hide-breaking-news");
  chkHideBreakingNews.checked =
    localStorage.getItem("HIDE_BREAKING_NEWS") === "1";
  chkHideBreakingNews.addEventListener("change", () => {
    localStorage.setItem(
      "HIDE_BREAKING_NEWS",
      chkHideBreakingNews.checked ? "1" : "0",
    );
    document.documentElement.classList.toggle(
      "hide-breaking-news",
      chkHideBreakingNews.checked,
    );
  });
  const chkIgnoreTraders = document.getElementById("chk-auto-ignore-traders");
  chkIgnoreTraders.checked =
    localStorage.getItem("AUTO_IGNORE_TRADERS") === "1";
  chkIgnoreTraders.addEventListener("change", () => {
    localStorage.setItem(
      "AUTO_IGNORE_TRADERS",
      chkIgnoreTraders.checked ? "1" : "0",
    );
  });
  const chkNoSound = document.getElementById("chk-no-sound");
  chkNoSound.checked = localStorage.getItem("NO_SOUND") === "1";
  chkNoSound.addEventListener("change", () => {
    localStorage.setItem("NO_SOUND", chkNoSound.checked ? "1" : "0");
    if (typeof SFX !== "undefined" && typeof SFX.setMuted === "function")
      SFX.setMuted(chkNoSound.checked);
  });
  const chkNoBlur = document.getElementById("chk-no-blur");
  chkNoBlur.checked = localStorage.getItem("NO_BLUR") === "1";
  chkNoBlur.addEventListener("change", () => {
    localStorage.setItem("NO_BLUR", chkNoBlur.checked ? "1" : "0");
    applyNoBlur();
    if (typeof updateBgBlur === "function") updateBgBlur();
  });
  document.getElementById("options-btn-debug").innerHTML = "Console";
  document
    .getElementById("options-btn-debug")
    .addEventListener("click", openDebug);
  document.getElementById("options-btn-danger").innerHTML = ICON_TRIANGLE_ALERT;
  document
    .getElementById("options-btn-danger")
    .addEventListener("click", function () {
      document.getElementById("options-btn-reset").classList.toggle("hidden");
      document.getElementById("options-btn-debug").classList.toggle("hidden");
    });
  document
    .getElementById("options-btn-default")
    .addEventListener("click", function () {
      window._resolutionScale = 1.0;
      window._encounterRate = 1.0;
      localStorage.removeItem("RESOLUTION_SCALE");
      localStorage.removeItem("ENCOUNTER_RATE");
      localStorage.removeItem("MUSIC_VOLUME");
      localStorage.removeItem("AUTO_FULLSCREEN");
      localStorage.removeItem("debugFps");
      localStorage.removeItem("AUTO_IGNORE_TRADERS");
      localStorage.removeItem("HIDE_BREAKING_NEWS");
      localStorage.removeItem("NO_BLUR");
      localStorage.removeItem("NO_SOUND");
      document.documentElement.classList.remove("hide-breaking-news");
      applyNoBlur();
      if (typeof SFX !== "undefined" && typeof SFX.setMuted === "function")
        SFX.setMuted(false);
      if (typeof SFX !== "undefined") SFX._musicVolume = 0.5;
      window.debugMode = false;
      var fpsEl = document.getElementById("debug-fps");
      if (fpsEl) fpsEl.remove();
      if (document.fullscreenElement) document.exitFullscreen();
      window.dispatchEvent(new Event("resize"));
      renderOptions();
    });
  document
    .getElementById("options-btn-newgame")
    .addEventListener("click", function () {
      document.getElementById("confirm-msg").textContent =
        "Start a new game? This will erase all current progress.";
      var cancelBtn = document.getElementById("btn-confirm-cancel");
      cancelBtn.textContent = "No";
      cancelBtn.classList.add("btn-cancel-red");
      var okBtn = document.getElementById("btn-confirm-ok");
      okBtn.textContent = "Yes";
      okBtn.classList.remove("btn-red");
      okBtn.classList.add("btn-yes-green");
      window._confirmAction = "newgame";
      document.getElementById("confirm-overlay").classList.remove("hidden");
    });
  document
    .getElementById("options-btn-reset")
    .addEventListener("click", function () {
      document.getElementById("confirm-msg").textContent =
        "Reset all progress? This will also restore all settings.";
      var cancelBtn = document.getElementById("btn-confirm-cancel");
      cancelBtn.textContent = "No";
      cancelBtn.classList.add("btn-cancel-red");
      var okBtn = document.getElementById("btn-confirm-ok");
      okBtn.textContent = "Yes";
      okBtn.classList.remove("btn-red");
      okBtn.classList.add("btn-yes-green");
      window._confirmAction = "reset";
      document.getElementById("confirm-overlay").classList.remove("hidden");
    });
  var resSlider = document.getElementById("options-slider-input");
  var resValue = document.getElementById("options-slider-value");
  resSlider.value = Math.round(window._resolutionScale * 100);
  resValue.textContent = resSlider.value + "%";
  resSlider.addEventListener("input", function () {
    window._resolutionScale = this.value / 100;
    resValue.textContent = this.value + "%";
    localStorage.setItem("RESOLUTION_SCALE", window._resolutionScale);
    window.dispatchEvent(new Event("resize"));
  });
  var encSlider = document.getElementById("options-encounter-input");
  var encValue = document.getElementById("options-encounter-value");
  encSlider.value = Math.round(window._encounterRate * 100);
  encValue.textContent = encSlider.value + "%";
  encSlider.addEventListener("input", function () {
    window._encounterRate = this.value / 100;
    encValue.textContent = this.value + "%";
    localStorage.setItem("ENCOUNTER_RATE", window._encounterRate);
  });
  var musicSlider = document.getElementById("options-music-input");
  var musicValue = document.getElementById("options-music-value");
  var savedMusic = parseFloat(localStorage.getItem("MUSIC_VOLUME"));
  musicSlider.value = isNaN(savedMusic) ? 50 : Math.round(savedMusic * 100);
  musicValue.textContent = musicSlider.value + "%";
  musicSlider.addEventListener("input", function () {
    var vol = this.value / 100;
    musicValue.textContent = this.value + "%";
    localStorage.setItem("MUSIC_VOLUME", vol);
    if (typeof SFX !== "undefined" && SFX._masterGain) {
      SFX._musicVolume = vol;
    }
  });
}
document.getElementById("btn-options").addEventListener("click", () => {
  if (!optionsOverlay.classList.contains("hidden")) {
    hideOptions();
    return;
  }
  closeAllOverlays();
  renderOptions();
  optionsOverlay.classList.remove("hidden");
});
optionsOverlay.addEventListener("click", (e) => {
  if (e.target === optionsOverlay) {
    hideOptions();
  }
});
function openDebug() {
  if (typeof consoleEl === "undefined") return;
  consoleEl.overlay.classList.add("open");
  consoleEl.input.focus();
}
document.getElementById("btn-confirm-cancel").addEventListener("click", () => {
  document.getElementById("confirm-overlay").classList.add("hidden");
  var cb = window._confirmCancelCallback;
  window._confirmCancelCallback = null;
  if (typeof cb === "function") cb();
});
document.getElementById("btn-confirm-ok").addEventListener("click", () => {
  document.getElementById("confirm-overlay").classList.add("hidden");
  var cb = window._confirmCallback;
  window._confirmCallback = null;
  if (typeof cb === "function") {
    cb();
    return;
  }
  resetGame();
  if (typeof window.COMMANDER_SAVE_KEY !== "undefined")
    localStorage.removeItem(window.COMMANDER_SAVE_KEY);
  window.commanderName = "Jameson";
  window.commanderSkills = { pilot: 5, fighter: 5, trader: 5, engineer: 5 };
  if (window._confirmAction === "reset") {
    localStorage.removeItem("RESOLUTION_SCALE");
    localStorage.removeItem("ENCOUNTER_RATE");
    localStorage.removeItem("MUSIC_VOLUME");
    localStorage.removeItem("AUTO_FULLSCREEN");
    localStorage.removeItem("debugFps");
    localStorage.removeItem("AUTO_IGNORE_TRADERS");
    localStorage.removeItem("HIDE_BREAKING_NEWS");
    localStorage.removeItem("NO_BLUR");
    localStorage.removeItem("NO_SOUND");
    document.documentElement.classList.remove("hide-breaking-news");
    applyNoBlur();
    if (typeof SFX !== "undefined" && typeof SFX.setMuted === "function")
      SFX.setMuted(false);
    if (typeof SFX !== "undefined") SFX._musicVolume = 0.5;
    window._resolutionScale = 1.0;
    window._encounterRate = 1.0;
    if (document.fullscreenElement) document.exitFullscreen();
    window.debugMode = false;
    var fpsEl = document.getElementById("debug-fps");
    if (fpsEl) fpsEl.remove();
    window.dispatchEvent(new Event("resize"));
  }
  if (typeof showCommanderOverlay === "function") showCommanderOverlay();
});
document.getElementById("confirm-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("confirm-overlay")) {
    document.getElementById("confirm-overlay").classList.add("hidden");
  }
});
const loadingEl = document.getElementById("loading");
const startBtn = document.getElementById("start-btn");
function closeLoading() {
  loadingEl.classList.add("closing");
  setTimeout(() => {
    loadingEl.style.display = "none";
  }, 600);
}
startBtn.addEventListener("click", () => {
  if (SFX._ctx && SFX._ctx.state === "suspended") SFX._ctx.resume();
  closeLoading();
  if (localStorage.getItem("AUTO_FULLSCREEN") === "1") {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  if (!window._hasSaveData && typeof showCommanderOverlay === "function") {
    showCommanderOverlay();
  }
});
