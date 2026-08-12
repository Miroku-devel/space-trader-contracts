// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const TIME_SAVE_KEY = "stc_seconds_played";
let gameSessionStart = Date.now();
function getTotalSeconds() {
  const saved = parseInt(localStorage.getItem(TIME_SAVE_KEY) || "0", 10);
  const session = Math.floor((Date.now() - gameSessionStart) / 1000);
  return saved + session;
}
function savePlayTime() {
  const total = getTotalSeconds();
  localStorage.setItem(TIME_SAVE_KEY, String(total));
  gameSessionStart = Date.now();
}
function formatElapsedTime() {
  const total = getTotalSeconds();
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function getReputationLabel(score) {
  if (score >= 1500) return "Elite";
  if (score >= 600) return "Deadly";
  if (score >= 300) return "Dangerous";
  if (score >= 150) return "Competent";
  if (score >= 80) return "Above Average";
  if (score >= 40) return "Average";
  if (score >= 20) return "Poor";
  if (score >= 10) return "Mostly Harmless";
  return "Harmless";
}
function getPoliceRecordLabel(score) {
  if (score <= -100) return "Psycho";
  if (score <= -70) return "Villain";
  if (score <= -30) return "Criminal";
  if (score <= -10) return "Crook";
  if (score <= -5) return "Dubious";
  if (score >= 75) return "Hero";
  if (score >= 25) return "Liked";
  if (score >= 10) return "Trusted";
  if (score >= 5) return "Lawful";
  return "Clean";
}
let dashboardPageIdx = 0;
let dashboardAnimating = false;
let crewPageIdx = 0;
const CREW_PER_PAGE = 4;
const AVATAR_SAVE_KEY = "stc_avatar_assignments";
let avatarAssignments = null;
function getAvatarAssignments() {
  if (avatarAssignments) return avatarAssignments;
  if (typeof AVATARS === "undefined") return [];
  const saved = localStorage.getItem(AVATAR_SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 30) {
        avatarAssignments = parsed;
        return avatarAssignments;
      }
    } catch (e) {}
  }
  const indices = [...Array(30).keys()].sort(() => Math.random() - 0.5);
  avatarAssignments = indices;
  try {
    localStorage.setItem(AVATAR_SAVE_KEY, JSON.stringify(indices));
  } catch (e) {}
  return avatarAssignments;
}
let timeUpdateInterval = null;
function goToDashboardPage(targetIdx) {
  if (dashboardAnimating || targetIdx < 0 || targetIdx > 2) return;
  if (targetIdx === dashboardPageIdx) return;
  const dir = targetIdx > dashboardPageIdx ? 1 : -1;
  const steps = Math.abs(targetIdx - dashboardPageIdx);
  const slider = document.getElementById("dashboard-slider");
  if (!slider) return;
  const w = document.getElementById("dashboard-content").clientWidth;
  const outX = -dir * w * steps;
  dashboardAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    dashboardPageIdx = targetIdx;
    renderDashboardPages();
    const newSlider = document.getElementById("dashboard-slider");
    if (!newSlider) {
      dashboardAnimating = false;
      return;
    }
    const inX = -outX;
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${inX}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.25s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      dashboardAnimating = false;
    });
  });
}
function crewSlide(dir) {
  const maxPage = Math.ceil(window.CREW_NAMES.length / CREW_PER_PAGE) - 1;
  const target = crewPageIdx + dir;
  if (target < 0 || target > maxPage || dashboardAnimating) return;
  const slider = document.getElementById("dashboard-slider");
  if (!slider) return;
  const w = document.getElementById("dashboard-content").clientWidth;
  dashboardAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${-dir * w}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    crewPageIdx = target;
    renderDashboardPages();
    const newSlider = document.getElementById("dashboard-slider");
    if (!newSlider) {
      dashboardAnimating = false;
      return;
    }
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${dir * w}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.25s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      dashboardAnimating = false;
    });
  });
}
function crewGoToPage(target) {
  const maxPage = Math.ceil(window.CREW_NAMES.length / CREW_PER_PAGE) - 1;
  if (
    target < 0 ||
    target > maxPage ||
    dashboardAnimating ||
    target === crewPageIdx
  )
    return;
  const dir = target > crewPageIdx ? 1 : -1;
  const steps = Math.abs(target - crewPageIdx);
  const slider = document.getElementById("dashboard-slider");
  if (!slider) return;
  const w = document.getElementById("dashboard-content").clientWidth;
  dashboardAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${-dir * w * steps}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    crewPageIdx = target;
    renderDashboardPages();
    const newSlider = document.getElementById("dashboard-slider");
    if (!newSlider) {
      dashboardAnimating = false;
      return;
    }
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${dir * w * steps}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.25s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      dashboardAnimating = false;
    });
  });
}
function crewBonuses() {
  const base = window.commanderSkills || {
    pilot: 1,
    fighter: 1,
    trader: 1,
    engineer: 1,
  };
  const b = {
    Pilot: base.pilot,
    Fighter: base.fighter,
    Trader: base.trader,
    Engineer: base.engineer,
  };
  if (!window.CREW_NAMES)
    return { Pilot: 0, Fighter: 0, Trader: 0, Engineer: 0 };
  window.CREW_NAMES.forEach((c) => {
    if (c.hired) {
      if (c.pilot > b.Pilot) b.Pilot = c.pilot;
      if (c.fighter > b.Fighter) b.Fighter = c.fighter;
      if (c.trader > b.Trader) b.Trader = c.trader;
      if (c.engineer > b.Engineer) b.Engineer = c.engineer;
    }
  });
  return {
    Pilot: b.Pilot - base.pilot,
    Fighter: b.Fighter - base.fighter,
    Trader: b.Trader - base.trader,
    Engineer: b.Engineer - base.engineer,
  };
}
function renderDashboardPages() {
  let crewHtml = "";
  if (dashboardPageIdx === 2) {
    const start = crewPageIdx * CREW_PER_PAGE;
    const end = Math.min(start + CREW_PER_PAGE, window.CREW_NAMES.length);
    const sortedCrew = window.CREW_NAMES.slice().sort(function (a, b) {
      return (a.hired ? 0 : 1) - (b.hired ? 0 : 1);
    });
    const pageNames = sortedCrew.slice(start, end);
    const hiredCount = window.CREW_NAMES
      ? window.CREW_NAMES.filter((c) => c.hired).length
      : 0;
    const ridePassengers =
      typeof activeMissions !== "undefined"
        ? activeMissions.filter((m) => m.type === "ride").reduce((sum, m) => sum + (m.quartersRequired || 1), 0)
        : 0;
    const quarters =
      typeof playerShip !== "undefined" && typeof SHIP_STATS !== "undefined"
        ? SHIP_STATS[playerShip.name].quarters
        : 0;
    const quartersFull = hiredCount + ridePassengers >= quarters;
    crewHtml = pageNames
      .map((n, i) => {
        const assignments = getAvatarAssignments();
        const av = AVATARS[assignments[(start + i) % assignments.length]];
        const hired = n.hired ? " hired" : "";
        const canAfford =
          typeof playerCredits !== "undefined" && playerCredits >= n.cost;
        const cardDisabled =
          (!n.hired && !canAfford) || (!n.hired && quartersFull);
        const btnText = n.hired ? "Unhire" : quartersFull ? "Full" : `Hire`;
        const btnClass = n.hired ? "hire-btn unhire" : "hire-btn";
        return `<div class="pilot-card${hired}${cardDisabled ? " disabled" : ""}" data-name="${n.name}"><span class="crew-cost">${n.cost}cr / warp</span><div class="pilot-card-image">${av ? av.svg : ""}</div><div class="pilot-card-desc"><span class="pilot-name">${n.name}</span><br><span class="pilot-skill">Pilot: <span class="profile-val">${n.pilot}</span><br>Fighter: <span class="profile-val">${n.fighter}</span><br>Trader: <span class="profile-val">${n.trader}</span><br>Engineer: <span class="profile-val">${n.engineer}</span></span></div><button class="${btnClass}">${btnText}</button></div>`;
      })
      .join("");
    crewHtml = `<div id="pilot-list">${crewHtml}</div>`;
  }
  const pages = [
    (() => {
      const av =
        typeof AVATARS !== "undefined" &&
        AVATARS.length &&
        typeof window.commanderAvatarIdx === "number"
          ? AVATARS[window.commanderAvatarIdx % AVATARS.length]
          : null;
      const imgHtml = av
        ? av.svg
        : '<div class="avatar-placeholder">&#x1F6E1;</div>';
      const cb = crewBonuses();
      const eb =
        typeof equipSkillBonuses === "function"
          ? equipSkillBonuses()
          : { Pilot: 0, Fighter: 0, Trader: 0, Engineer: 0 };
      const bonus = (v, skill) => {
        let h = "";
        if (cb[skill]) h += ` <span class="skill-crew">+${cb[skill]}</span>`;
        if (eb[skill]) h += ` <span class="skill-equip">+${eb[skill]}</span>`;
        return h;
      };
      const baseSkill = window.commanderSkills || {
        pilot: 1,
        fighter: 1,
        trader: 1,
        engineer: 1,
      };
      const profileName = window.commanderName || "Jameson";
      const descHtml = `<div class="profile-name">${profileName}</div>
                <div>Pilot: <span class="profile-val">${baseSkill.pilot}</span>${bonus(cb, "Pilot")}</div>
                <div>Fighter: <span class="profile-val">${baseSkill.fighter}</span>${bonus(cb, "Fighter")}</div>
                <div>Trader: <span class="profile-val">${baseSkill.trader}</span>${bonus(cb, "Trader")}</div>
                <div>Engineer: <span class="profile-val">${baseSkill.engineer}</span>${bonus(cb, "Engineer")}</div>`;
      return `<div class="dashboard-page"><div id="pilot-preview"><div id="pilot-preview-image">${imgHtml}</div><div id="pilot-preview-desc">${descHtml}</div></div></div>`;
    })(),
    (() => {
      const creds = typeof playerCredits !== "undefined" ? playerCredits : 0;
      const debt = typeof loanDebt !== "undefined" ? loanDebt : 0;
      const nw = typeof netWorth === "function" ? netWorth() : creds;
      return `<div class="dashboard-page"><div class="dashboard-info-row-group"><div class="dashboard-info"><div class="dashboard-info-row"><span>Time Played:</span><span id="dashboard-time-played-value">${formatElapsedTime()}</span></div><div class="dashboard-info-row"><span>Warps:</span><span>${typeof turnCounter !== "undefined" ? turnCounter : 0}</span></div><div class="dashboard-info-row"><span>Kills:</span><span>${gameKills}</span></div><div class="dashboard-info-row"><span>Police Record:</span><span>${getPoliceRecordLabel(typeof policeRecordScore !== "undefined" ? policeRecordScore : 0)}</span></div><div class="dashboard-info-row"><span>Reputation:</span><span>${getReputationLabel(typeof gameReputationScore !== "undefined" ? gameReputationScore : 0)}</span></div></div><div class="dashboard-info"><div class="dashboard-info-row"><span>Cash:</span><span>${creds.toLocaleString()} cr</span></div><div class="dashboard-info-row"><span>Debt:</span><span class="${debt > 0 ? "c-debt" : ""}">${debt.toLocaleString()} cr</span></div><div class="dashboard-info-row"><span>Net Worth:</span><span>${nw.toLocaleString()} cr</span></div><div class="dashboard-info-row"><span>Contracts Completed:</span><span>${typeof gameMissionsCompleted !== "undefined" ? gameMissionsCompleted : 0}</span></div><div class="dashboard-info-row"><span>Escapes:</span><span>${typeof gameEscapes !== "undefined" ? gameEscapes : 0}</span></div></div></div></div>`;
    })(),
    `<div class="dashboard-page">${crewHtml}</div>`,
  ];
  document.getElementById("dashboard-slider").innerHTML =
    pages[dashboardPageIdx];
  const titleEl = document.getElementById("dashboard-title");
  if (titleEl)
    titleEl.textContent =
      dashboardPageIdx === 0
        ? "Dashboard"
        : dashboardPageIdx === 1
          ? "Dashboard: Statistics"
          : "Dashboard: Crew";
  const statusEl = document.getElementById("dashboard-status");
  if (statusEl) {
    if (dashboardPageIdx === 2) {
      const hired = window.CREW_NAMES
        ? window.CREW_NAMES.filter((c) => c.hired).length
        : 0;
      const ridePassengers =
        typeof activeMissions !== "undefined"
          ? activeMissions.filter((m) => m.type === "ride").reduce((sum, m) => sum + (m.quartersRequired || 1), 0)
          : 0;
      const quarters =
        typeof playerShip !== "undefined" && typeof SHIP_STATS !== "undefined"
          ? SHIP_STATS[playerShip.name].quarters
          : 0;
      statusEl.textContent = `Crew Quarters: ${hired + ridePassengers}/${quarters}`;
    } else if (dashboardPageIdx === 1) {
      statusEl.textContent =
        typeof calculateScore === "function"
          ? `Score: ${calculateScore("retired")}`
          : "Score: 0.0%";
    } else {
      statusEl.textContent = "Welcome back, Commander";
    }
  }
  const prevBtn = document.getElementById("btn-dashboard-prev");
  const nextBtn = document.getElementById("btn-dashboard-next");
  if (prevBtn && nextBtn) {
    const show = dashboardPageIdx === 2;
    prevBtn.style.display = show ? "" : "none";
    nextBtn.style.display = show ? "" : "none";
    if (dashboardPageIdx === 2) {
      prevBtn.disabled = crewPageIdx === 0;
      nextBtn.disabled =
        crewPageIdx >= window.CREW_NAMES.length / CREW_PER_PAGE - 1;
    } else {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    }
  }
  const homeBtn = document.getElementById("btn-dashboard-home");
  const statsBtn = document.getElementById("btn-dashboard-stats");
  const crewBtn = document.getElementById("btn-dashboard-crew");
  if (homeBtn) homeBtn.disabled = dashboardPageIdx === 0;
  if (statsBtn) statsBtn.disabled = dashboardPageIdx === 1;
  if (crewBtn) crewBtn.disabled = dashboardPageIdx === 2;
  const pilotList = document.getElementById("pilot-list");
  if (pilotList) {
    pilotList.addEventListener("click", function onHire(e) {
      const btn = e.target.closest(".hire-btn");
      if (btn) {
        const card = btn.closest(".pilot-card");
        if (!card) return;
        const name = card.dataset.name;
        if (btn.classList.contains("unhire")) {
          const crew = window.CREW_NAMES.find((c) => c.name === name);
          if (crew) crew.hired = false;
          saveCrewNames();
          renderDashboardPages();
        } else {
          const crew = window.CREW_NAMES.find((c) => c.name === name);
          if (
            crew &&
            typeof playerCredits !== "undefined" &&
            playerCredits >= crew.cost
          ) {
            playerCredits -= crew.cost;
            crew.hired = true;
            saveCrewNames();
            if (typeof saveTradeState === "function") saveTradeState();
            if (typeof updateGameDate === "function") updateGameDate();
            const sortedCrew = window.CREW_NAMES.slice().sort(function (a, b) {
              return (a.hired ? 0 : 1) - (b.hired ? 0 : 1);
            });
            const idx = sortedCrew.findIndex((c) => c.name === crew.name);
            const targetPage = Math.max(0, Math.floor(idx / CREW_PER_PAGE));
            if (!dashboardAnimating && targetPage !== crewPageIdx) {
              crewGoToPage(targetPage);
            } else {
              renderDashboardPages();
            }
          }
        }
      }
    });
  }
}
function renderDashboard() {
  document.getElementById("dashboard-sidebar").innerHTML =
    `<button id="btn-dashboard-home"></button><button id="btn-dashboard-stats"></button><button id="btn-dashboard-crew"></button>`;
  const dashboardHomeBtn = document.getElementById("btn-dashboard-home");
  if (dashboardHomeBtn) {
    dashboardHomeBtn.innerHTML = ICON_FACE;
    dashboardHomeBtn.addEventListener("click", () => goToDashboardPage(0));
  }
  const dashboardStatsBtn = document.getElementById("btn-dashboard-stats");
  if (dashboardStatsBtn) {
    dashboardStatsBtn.innerHTML = ICON_BAR_CHART;
    dashboardStatsBtn.addEventListener("click", () => goToDashboardPage(1));
  }
  const dashboardCrewBtn = document.getElementById("btn-dashboard-crew");
  if (dashboardCrewBtn) {
    dashboardCrewBtn.innerHTML = ICON_CREW;
    dashboardCrewBtn.addEventListener("click", () => {
      if (dashboardPageIdx === 2) {
        crewGoToPage(0);
      } else {
        crewPageIdx = 0;
        goToDashboardPage(2);
      }
    });
  }
  document.getElementById("dashboard-content").innerHTML = `
        <div id="dashboard-header">
            <div id="dashboard-header-left">
                <span id="dashboard-title">Dashboard</span>
                <span id="dashboard-status">Welcome back, Commander</span>
            </div>
            <div id="dashboard-header-right">
                <button id="btn-dashboard-prev"></button>
                <button id="btn-dashboard-next"></button>
                <button id="btn-dashboard-close"></button>
            </div>
        </div>
        <div id="dashboard-slider"></div>`;
  document.getElementById("btn-dashboard-close").innerHTML = ICON_CLOSE;
  document
    .getElementById("btn-dashboard-close")
    .addEventListener("click", hideDashboard);
  document.getElementById("btn-dashboard-prev").innerHTML = ICON_CHEVRON_LEFT;
  document.getElementById("btn-dashboard-next").innerHTML = ICON_CHEVRON_RIGHT;
  document
    .getElementById("btn-dashboard-prev")
    .addEventListener("click", () => crewSlide(-1));
  document
    .getElementById("btn-dashboard-next")
    .addEventListener("click", () => crewSlide(1));
  dashboardPageIdx = 0;
  renderDashboardPages();
}
function startDashboardTimer() {
  stopDashboardTimer();
  timeUpdateInterval = setInterval(() => {
    const el = document.getElementById("dashboard-time-played-value");
    if (el) el.textContent = formatElapsedTime();
  }, 1000);
}
function stopDashboardTimer() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}
function hideDashboard() {
  dashboardOverlay.classList.add("hidden");
  stopDashboardTimer();
  dashboardAnimating = false;
}
document.getElementById("btn-dashboard").addEventListener("click", () => {
  if (!dashboardOverlay.classList.contains("hidden")) {
    hideDashboard();
    return;
  }
  closeAllOverlays();
  renderDashboard();
  dashboardOverlay.classList.remove("hidden");
  startDashboardTimer();
});
dashboardOverlay.addEventListener("click", (e) => {
  if (e.target === dashboardOverlay) {
    hideDashboard();
  }
});
function dashboardSlideBack() {
  const slider = document.getElementById("dashboard-slider");
  if (!slider) return;
  slider.style.transition = "transform 0.2s ease";
  slider.style.transform = "translateX(0)";
  slider.addEventListener("transitionend", function onBack() {
    slider.removeEventListener("transitionend", onBack);
    slider.style.transition = "";
    slider.style.transform = "";
  });
}
let dashboardSwipeStartX = 0;
let dashboardSwipeActive = false;
const pp = document.getElementById("dashboard-panel");
function startDashboardDrag(clientX) {
  if (dashboardAnimating) return false;
  dashboardSwipeStartX = clientX;
  dashboardSwipeActive = true;
  const slider = document.getElementById("dashboard-slider");
  if (slider) {
    slider.style.transition = "none";
    slider.style.transform = "";
  }
  return true;
}
function moveDashboardDrag(clientX) {
  if (!dashboardSwipeActive) return;
  const slider = document.getElementById("dashboard-slider");
  if (!slider) return;
  const dx = clientX - dashboardSwipeStartX;
  slider.style.transform = `translateX(${dx}px)`;
}
function dashboardCanNavigate(dir) {
  if (dashboardPageIdx === 0 || dashboardPageIdx === 1) return false;
  if (dashboardPageIdx === 2) {
    const maxPage = Math.ceil(window.CREW_NAMES.length / CREW_PER_PAGE) - 1;
    const target = crewPageIdx + dir;
    return target >= 0 && target <= maxPage;
  }
  const target = dashboardPageIdx + dir;
  return target >= 0 && target <= 2;
}
function endDashboardDrag(clientX) {
  if (!dashboardSwipeActive) return;
  dashboardSwipeActive = false;
  const dx = clientX - dashboardSwipeStartX;
  const w = document.getElementById("dashboard-panel").clientWidth;
  if (Math.abs(dx) > w * 0.25) {
    const dir = dx > 0 ? -1 : 1;
    if (dashboardCanNavigate(dir)) {
      if (dashboardPageIdx === 2) {
        crewSlide(dir);
      } else {
        goToDashboardPage(dashboardPageIdx + dir);
      }
    } else {
      dashboardSlideBack();
    }
  } else {
    dashboardSlideBack();
  }
}
pp.addEventListener(
  "touchstart",
  (e) => {
    startDashboardDrag(e.touches[0].clientX);
  },
  { passive: true },
);
pp.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      dashboardSwipeActive = false;
      return;
    }
    moveDashboardDrag(e.touches[0].clientX);
  },
  { passive: true },
);
pp.addEventListener("touchend", (e) => {
  endDashboardDrag(e.changedTouches[0].clientX);
});
pp.addEventListener("touchcancel", () => {
  dashboardSwipeActive = false;
  dashboardSlideBack();
});
pp.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest("button")) return;
  startDashboardDrag(e.clientX);
});
document.addEventListener("mousemove", (e) => {
  moveDashboardDrag(e.clientX);
});
document.addEventListener("mouseup", (e) => {
  endDashboardDrag(e.clientX);
});
const CREW_SAVE_KEY = "stc_crew_names";
const CREW_PREFIXES = [
  "Al", "Ar", "Bel", "Bor", "Cal", "Cor", "Dal", "Dor", "El", "Eri",
  "Fen", "Gar", "Gor", "Hal", "Hen", "Jar", "Jen", "Jor", "Kal", "Kar",
  "Kel", "Kor", "Kri", "Lar", "Lor", "Ly", "Mal", "Mar", "Mor", "My",
  "Nal", "Nor", "Or", "Pan", "Per", "Qua", "Ran", "Ror", "Ry", "Sal",
  "Sar", "Sel", "Sor", "Tal", "Tar", "The", "Tor", "Val", "Var", "Xan",
  "Xen", "Yor", "Zal", "Zen", "Zor", "Cry", "Dra", "Ira", "Jer", "Mer",
  "Mil", "Mur", "Nan", "Ore", "Psi", "Sos", "U", "Wes", "Won", "Xia",
];
const CREW_SUFFIXES = [
  "a", "is", "on", "us", "en", "ix", "ar", "or", "an", "el",
  "os", "ax", "ius", "ian", "as", "ek", "ak", "in", "en", "is",
  "a", "us", "on", "el", "or", "ix", "an", "os", "ar", "ax",
];
function generateCrewNames() {
  const seen = new Set();
  const crew = [];
  while (crew.length < 30) {
    const p = CREW_PREFIXES[Math.floor(Math.random() * CREW_PREFIXES.length)];
    const s = CREW_SUFFIXES[Math.floor(Math.random() * CREW_SUFFIXES.length)];
    const name = p + s;
    if (!seen.has(name)) {
      seen.add(name);
      const randomSkill = () =>
        Math.floor(Math.random() * 5) + Math.floor(Math.random() * 6) + 1;
      const pilot = randomSkill();
      const fighter = randomSkill();
      const trader = randomSkill();
      const engineer = randomSkill();
      const cost = (pilot + fighter + trader + engineer) * 3;
      crew.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        pilot,
        fighter,
        trader,
        engineer,
        cost,
        hired: false,
      });
    }
  }
  return crew;
}
function saveCrewNames() {
  try {
    localStorage.setItem(CREW_SAVE_KEY, JSON.stringify(window.CREW_NAMES));
  } catch (e) {}
}
function loadCrewNames() {
  const raw = localStorage.getItem(CREW_SAVE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.length && typeof parsed[0] === "string") {
        window.CREW_NAMES = generateCrewNames();
      } else if (parsed.length && typeof parsed[0].skill === "string") {
        window.CREW_NAMES = parsed.map((c) => {
          const randomSkill = () =>
            Math.floor(Math.random() * 5) + Math.floor(Math.random() * 6) + 1;
          const pilot = randomSkill();
          const fighter = randomSkill();
          const trader = randomSkill();
          const engineer = randomSkill();
          const cost = (pilot + fighter + trader + engineer) * 3;
          return {
            name: c.name,
            pilot,
            fighter,
            trader,
            engineer,
            cost,
            hired: c.hired || false,
          };
        });
      } else {
        window.CREW_NAMES = parsed.map((c) => {
          if (typeof c.pilot === "undefined") {
            const randomSkill = () =>
              Math.floor(Math.random() * 5) + Math.floor(Math.random() * 6) + 1;
            c.pilot = randomSkill();
            c.fighter = randomSkill();
            c.trader = randomSkill();
            c.engineer = randomSkill();
            c.cost = (c.pilot + c.fighter + c.trader + c.engineer) * 3;
          }
          return c;
        });
      }
      return true;
    } catch (e) {}
  }
  return false;
}
if (!loadCrewNames()) {
  window.CREW_NAMES = generateCrewNames();
  saveCrewNames();
}
