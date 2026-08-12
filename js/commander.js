// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const MAX_SKILL_LEVEL = 10;
window.COMMANDER_SAVE_KEY = "stc_commander";
window.commanderName = "Jameson";
window.commanderSkills = { pilot: 1, fighter: 1, trader: 1, engineer: 1 };
window.commanderAvatarIdx = 0;
function saveCommanderState() {
  try {
    localStorage.setItem(
      window.COMMANDER_SAVE_KEY,
      JSON.stringify({
        name: window.commanderName,
        pilot: window.commanderSkills.pilot,
        fighter: window.commanderSkills.fighter,
        trader: window.commanderSkills.trader,
        engineer: window.commanderSkills.engineer,
        avatarIdx: window.commanderAvatarIdx,
      }),
    );
  } catch (e) {}
}
function loadCommanderState() {
  const raw = localStorage.getItem(window.COMMANDER_SAVE_KEY);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      window.commanderName = d.name || "Jameson";
      window.commanderSkills = {
        pilot: typeof d.pilot === "number" ? d.pilot : 1,
        fighter: typeof d.fighter === "number" ? d.fighter : 1,
        trader: typeof d.trader === "number" ? d.trader : 1,
        engineer: typeof d.engineer === "number" ? d.engineer : 1,
      };
      window.commanderAvatarIdx =
        typeof d.avatarIdx === "number" ? d.avatarIdx : 0;
      return true;
    } catch (e) {}
  }
  return false;
}
function updateCommanderNameDisplay() {
  document.querySelectorAll(".pilot-label").forEach((el) => {
    el.textContent = window.commanderName || "Jameson";
  });
}
function setSidebarBg(svg) {
  const encoded = "data:image/svg+xml," + encodeURIComponent(svg);
  const url = `url("${encoded}")`;
  [
    document.getElementById("info-sidebar"),
    document.getElementById("hud-info-sidebar"),
  ].forEach((el) => {
    if (el) el.style.setProperty("--sidebar-bg", url);
  });
  try {
    localStorage.setItem("stc_sidebar_bg", encoded);
  } catch (e) {}
}
function restoreSidebarBg() {
  const saved = localStorage.getItem("stc_sidebar_bg");
  if (!saved) return;
  const url = `url("${saved}")`;
  [
    document.getElementById("info-sidebar"),
    document.getElementById("hud-info-sidebar"),
  ].forEach((el) => {
    if (el) el.style.setProperty("--sidebar-bg", url);
  });
}
function renderCommanderAvatar() {
  const container = document.getElementById("commander-avatar-img");
  if (!container) return;
  if (
    typeof AVATARS !== "undefined" &&
    AVATARS.length &&
    AVATARS[window.commanderAvatarIdx]
  ) {
    const svg = AVATARS[window.commanderAvatarIdx].svg;
    if (typeof svg === "string" && svg.startsWith("<svg")) {
      container.innerHTML = svg;
      setSidebarBg(svg);
    } else {
      container.innerHTML = '<div class="c-cyan-dim">...</div>';
    }
  } else {
    container.innerHTML = "";
  }
}
window.onAvatarsReady = function () {
  renderCommanderAvatar();
};
function showCommanderOverlay() {
  const existing = document.getElementById("commander-overlay");
  if (!existing) return;
  if (typeof window.SAVE_KEY !== "undefined")
    localStorage.removeItem(window.SAVE_KEY);
  if (typeof AVATARS !== "undefined" && AVATARS.length) {
    window.commanderAvatarIdx = Math.floor(Math.random() * AVATARS.length);
  }
  const content = document.getElementById("commander-content");
  if (!content) return;
  if (typeof SFX !== "undefined") {
    if (typeof SFX.playNewGameTheme === "function") {
      SFX.playNewGameTheme();
    } else if (typeof SFX.startLoop === "function") {
      SFX.startLoop("ng_loop", "ng", 0, 0, function () {
        return 1;
      });
    } else if (typeof SFX.play === "function") {
      SFX.play("ng");
    }
    if (typeof SFX.stopLoop === "function") SFX.stopLoop("bg_loop");
    if (window._bgRequested !== undefined) window._bgRequested = false;
  }
  const skillDefs = [
    { id: "pilot", name: "Pilot" },
    { id: "fighter", name: "Fighter" },
    { id: "trader", name: "Trader" },
    { id: "engineer", name: "Engineer" },
  ];
  const defaultVal = 1;
  const rows = skillDefs
    .map(
      (s) => `
        <tr>
            <td class="skill-label">${s.name}</td>
            <td class="skill-slider-cell"><input type="range" id="${s.id}" min="1" max="${MAX_SKILL_LEVEL}" value="${defaultVal}"></td>
            <td><span class="skill-value" id="${s.id}Val">${defaultVal}</span></td>
        </tr>
    `,
    )
    .join("");
  content.innerHTML = `
        <h2 id="commander-title" class="commander-gradient-text" data-text="SPACE TRADER">SPACE TRADER</h2>
        <div id="commander-subtitle" class="commander-gradient-text" data-text="CONTRACTS">CONTRACTS</div>
        <input type="text" id="commander-name" value="${window.commanderName}" placeholder="Commander name">
        <div id="commander-avatar-row">
            <button id="btn-avatar-prev" class="avatar-arrow"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <div id="commander-avatar-img"></div>
            <button id="btn-avatar-next" class="avatar-arrow"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 4l8 8-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <table id="commander-skills">${rows}</table>
        <div id="commander-points">Skill Points Remaining: <span id="pointsRemaining">${MAX_SKILL_LEVEL * 2 - 4 * defaultVal}</span> of ${MAX_SKILL_LEVEL * 2}</div>
        <div id="commander-buttons">
            <button id="btn-random-skills">Random</button>
            <button id="btn-start-game" disabled>Start Game</button>
        </div>
    `;
  skillDefs.forEach((s) => {
    const slider = document.getElementById(s.id);
    if (slider) {
      slider.addEventListener("input", () => updateCommanderPoints(s.id));
    }
  });
  document
    .getElementById("btn-random-skills")
    .addEventListener("click", randomizeCommanderSkills);
  renderCommanderAvatar();
  document.getElementById("btn-avatar-prev").addEventListener("click", () => {
    if (typeof AVATARS !== "undefined" && AVATARS.length) {
      window.commanderAvatarIdx =
        (window.commanderAvatarIdx - 1 + AVATARS.length) % AVATARS.length;
      renderCommanderAvatar();
    }
  });
  document.getElementById("btn-avatar-next").addEventListener("click", () => {
    if (typeof AVATARS !== "undefined" && AVATARS.length) {
      window.commanderAvatarIdx =
        (window.commanderAvatarIdx + 1) % AVATARS.length;
      renderCommanderAvatar();
    }
  });
  const startBtn = document.getElementById("btn-start-game");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.commanderName =
        document.getElementById("commander-name").value.trim() || "Jameson";
      window.commanderSkills = {
        engineer: parseInt(document.getElementById("engineer").value, 10),
        pilot: parseInt(document.getElementById("pilot").value, 10),
        fighter: parseInt(document.getElementById("fighter").value, 10),
        trader: parseInt(document.getElementById("trader").value, 10),
      };
      saveCommanderState();
      updateCommanderNameDisplay();
      document.getElementById("commander-overlay").classList.add("hidden");
      if (
        typeof SFX !== "undefined" &&
        typeof SFX.stopNewGameTheme === "function"
      ) {
        SFX.stopNewGameTheme();
      }
      if (typeof saveState === "function") saveState();
      if (localStorage.getItem("AUTO_FULLSCREEN") === "1") {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    });
  }
  existing.classList.remove("hidden");
}
function updateCommanderPoints(changedId) {
  const skillDefs = [
    { id: "pilot", name: "Pilot" },
    { id: "fighter", name: "Fighter" },
    { id: "trader", name: "Trader" },
    { id: "engineer", name: "Engineer" },
  ];
  const sorted = [...skillDefs].sort((a, b) => {
    if (a.id === changedId) return -1;
    if (b.id === changedId) return 1;
    const aVal = parseInt(document.getElementById(a.id).value, 10);
    const bVal = parseInt(document.getElementById(b.id).value, 10);
    if (aVal !== bVal) return aVal - bVal;
    return a.id.localeCompare(b.id);
  });
  const maxPoints = MAX_SKILL_LEVEL * 2;
  let total = 0;
  sorted.forEach((s) => {
    const slider = document.getElementById(s.id);
    let value = parseInt(slider.value, 10);
    const remaining = maxPoints - (total + value);
    if (remaining < 0) {
      const overage = -remaining;
      value -= Math.min(value, overage);
      slider.value = value;
    }
    total += value;
  });
  document.getElementById("pointsRemaining").textContent = maxPoints - total;
  skillDefs.forEach((s) => {
    const val = parseInt(document.getElementById(s.id).value, 10);
    document.getElementById(`${s.id}Val`).textContent = val;
  });
  toggleStartButton(maxPoints - total);
}
function toggleStartButton(remaining) {
  const btn = document.getElementById("btn-start-game");
  if (btn) btn.disabled = remaining !== 0;
}
function randomizeCommanderSkills() {
  const ids = ["engineer", "pilot", "fighter", "trader"];
  const minVal = 1;
  const maxVal = MAX_SKILL_LEVEL;
  let vals = ids.map(() => minVal);
  let pool = MAX_SKILL_LEVEL * 2 - minVal * ids.length;
  while (pool > 0) {
    for (let i = 0; i < vals.length && pool > 0; i++) {
      const room = maxVal - vals[i];
      if (room <= 0) continue;
      const add = Math.min(
        room,
        pool,
        1 + Math.floor(Math.random() * Math.min(3, pool)),
      );
      vals[i] += add;
      pool -= add;
    }
  }
  const total = vals.reduce((a, b) => a + b, 0);
  ids.forEach((id, i) => {
    const slider = document.getElementById(id);
    slider.value = vals[i];
    const valEl = document.getElementById(id + "Val");
    if (valEl) valEl.textContent = vals[i];
  });
  const remEl = document.getElementById("pointsRemaining");
  if (remEl) remEl.textContent = MAX_SKILL_LEVEL * 2 - total;
  toggleStartButton(MAX_SKILL_LEVEL * 2 - total);
}
