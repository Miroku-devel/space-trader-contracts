// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function calculateScore(endStatus) {
  const MILLION = 1000000;
  const worth = typeof netWorth === "function" ? netWorth() : 0;
  const adjustedWorth =
    worth < MILLION ? worth : Math.floor(MILLION + (worth - MILLION) / 10);
  const days = typeof turnCounter !== "undefined" ? turnCounter : 0;
  const difficulty = 0;
  let score;
  if (endStatus === "killed") {
    score = (difficulty + 1) * ((adjustedWorth * 90) / 50000);
  } else {
    const dayFactor = Math.max(0, (difficulty + 1) * 100 - days);
    score = (difficulty + 1) * ((adjustedWorth + dayFactor * 1000) / 500);
  }
  score = Math.floor(score);
  const whole = Math.floor(score / 50);
  const dec = Math.floor((score % 50) / 5);
  return `${whole}.${dec}%`;
}
function showRetirement() {
  const creds = typeof playerCredits !== "undefined" ? playerCredits : 0;
  const debt = typeof loanDebt !== "undefined" ? loanDebt : 0;
  const nw = typeof netWorth === "function" ? netWorth() : creds - debt;
  const days = typeof turnCounter !== "undefined" ? turnCounter : 0;
  const kills = typeof gameKills !== "undefined" ? gameKills : 0;
  const rep = typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  const repLabel =
    typeof getPoliceRecordLabel === "function"
      ? getPoliceRecordLabel(rep)
      : "Clean";
  const repScore =
    typeof gameReputationScore !== "undefined" ? gameReputationScore : 0;
  const repLabel2 =
    typeof getReputationLabel === "function"
      ? getReputationLabel(repScore)
      : "Harmless";
  const missions =
    typeof gameMissionsCompleted !== "undefined" ? gameMissionsCompleted : 0;
  const escapes = typeof gameEscapes !== "undefined" ? gameEscapes : 0;
  const timePlayed =
    typeof formatElapsedTime === "function" ? formatElapsedTime() : "00:00:00";
  const scorePct = calculateScore("retired");
  resetGame();
  if (typeof SFX !== "undefined" && typeof SFX.playNewGameTheme === "function")
    SFX.playNewGameTheme();
  const el = document.getElementById("gameover-overlay");
  const content = document.getElementById("gameover-content");
  content.innerHTML = `
        <h1 class="retired">RETIRED</h1>
        <div class="subtitle">You retired in comfort.</div>
        <div class="go-score"><span>Score:</span> <span class="go-score-value">${scorePct}</span></div>
        <div class="go-stats">
            <div class="go-stat-col">
                <div class="go-stat-row"><span>Time Played:</span><span>${timePlayed}</span></div>
                <div class="go-stat-row"><span>Warps:</span><span>${days}</span></div>
                <div class="go-stat-row"><span>Kills:</span><span>${kills}</span></div>
                <div class="go-stat-row"><span>Police Record:</span><span>${repLabel}</span></div>
                <div class="go-stat-row"><span>Reputation:</span><span>${repLabel2}</span></div>
            </div>
            <div class="go-stat-col">
                <div class="go-stat-row"><span>Cash:</span><span>${creds.toLocaleString()} cr</span></div>
                <div class="go-stat-row"><span>Debt:</span><span class="${debt > 0 ? "c-debt" : ""}">${debt.toLocaleString()} cr</span></div>
                <div class="go-stat-row"><span>Net Worth:</span><span>${nw.toLocaleString()} cr</span></div>
                <div class="go-stat-row"><span>Missions:</span><span>${missions}</span></div>
                <div class="go-stat-row"><span>Escapes:</span><span>${escapes}</span></div>
            </div>
        </div>
        <div class="gameover-buttons">
            <button class="btn-gameover btn-new-game">New Game</button>
        </div>
    `;
  el.classList.remove("hidden");
  content.querySelector(".btn-new-game").addEventListener("click", () => {
    el.classList.add("hidden");
    if (typeof window.COMMANDER_SAVE_KEY !== "undefined")
      localStorage.removeItem(window.COMMANDER_SAVE_KEY);
    window.commanderName = "Jameson";
    window.commanderSkills = { pilot: 1, fighter: 1, trader: 1, engineer: 1 };
    if (typeof showCommanderOverlay === "function") showCommanderOverlay();
  });
}
function showGameOver() {
  const creds = typeof playerCredits !== "undefined" ? playerCredits : 0;
  const debt = typeof loanDebt !== "undefined" ? loanDebt : 0;
  const nw = typeof netWorth === "function" ? netWorth() : creds - debt;
  const days = typeof turnCounter !== "undefined" ? turnCounter : 0;
  const kills = typeof gameKills !== "undefined" ? gameKills : 0;
  const rep = typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  const repLabel =
    typeof getPoliceRecordLabel === "function"
      ? getPoliceRecordLabel(rep)
      : "Clean";
  const repScore =
    typeof gameReputationScore !== "undefined" ? gameReputationScore : 0;
  const repLabel2 =
    typeof getReputationLabel === "function"
      ? getReputationLabel(repScore)
      : "Harmless";
  const missions =
    typeof gameMissionsCompleted !== "undefined" ? gameMissionsCompleted : 0;
  const escapes = typeof gameEscapes !== "undefined" ? gameEscapes : 0;
  const timePlayed =
    typeof formatElapsedTime === "function" ? formatElapsedTime() : "00:00:00";
  const scorePct = calculateScore("killed");
  resetGame();
  if (typeof SFX !== "undefined" && typeof SFX.playNewGameTheme === "function")
    SFX.playNewGameTheme();
  const el = document.getElementById("gameover-overlay");
  const content = document.getElementById("gameover-content");
  content.innerHTML = `
        <h1>GAME OVER</h1>
        <div class="subtitle">You have been killed.</div>
        <div class="go-score"><span>Score:</span> <span class="go-score-value">${scorePct}</span></div>
        <div class="go-stats">
            <div class="go-stat-col">
                <div class="go-stat-row"><span>Time Played:</span><span>${timePlayed}</span></div>
                <div class="go-stat-row"><span>Warps:</span><span>${days}</span></div>
                <div class="go-stat-row"><span>Kills:</span><span>${kills}</span></div>
                <div class="go-stat-row"><span>Police Record:</span><span>${repLabel}</span></div>
                <div class="go-stat-row"><span>Reputation:</span><span>${repLabel2}</span></div>
            </div>
            <div class="go-stat-col">
                <div class="go-stat-row"><span>Cash:</span><span>${creds.toLocaleString()} cr</span></div>
                <div class="go-stat-row"><span>Debt:</span><span class="${debt > 0 ? "c-debt" : ""}">${debt.toLocaleString()} cr</span></div>
                <div class="go-stat-row"><span>Net Worth:</span><span>${nw.toLocaleString()} cr</span></div>
                <div class="go-stat-row"><span>Missions:</span><span>${missions}</span></div>
                <div class="go-stat-row"><span>Escapes:</span><span>${escapes}</span></div>
            </div>
        </div>
        <div class="gameover-buttons">
            <button class="btn-gameover btn-new-game">New Game</button>
        </div>
    `;
  el.classList.remove("hidden");
  content.querySelector(".btn-new-game").addEventListener("click", () => {
    el.classList.add("hidden");
    if (typeof window.COMMANDER_SAVE_KEY !== "undefined")
      localStorage.removeItem(window.COMMANDER_SAVE_KEY);
    window.commanderName = "Jameson";
    window.commanderSkills = { pilot: 1, fighter: 1, trader: 1, engineer: 1 };
    if (typeof showCommanderOverlay === "function") showCommanderOverlay();
  });
}
(function () {
  var canvas = document.createElement("canvas");
  canvas.className = "overlay-sky";
  var gl = null;
  var prog = null;
  var vao = null;
  var buf = null;
  var u = {};
  var visible = false;
  var animId = null;
  var activeOverlay = null;
  function initGL() {
    gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) return false;
    prog = createProgram(gl, bgVS, bgFS);
    if (!prog) return false;
    u.pos = gl.getAttribLocation(prog, "a_pos");
    u.uTime = gl.getUniformLocation(prog, "u_time");
    u.uRes = gl.getUniformLocation(prog, "u_res");
    u.uFreqs = gl.getUniformLocation(prog, "u_freqs");
    u.uCam = gl.getUniformLocation(prog, "u_cam");
    u.uZoom = gl.getUniformLocation(prog, "u_zoom");
    u.uSeed = gl.getUniformLocation(prog, "u_seed");
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(u.pos);
    gl.vertexAttribPointer(u.pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return true;
  }
  function resize() {
    var s = window._resolutionScale || 1.0;
    var pw = Math.round(canvas.clientWidth * s);
    var ph = Math.round(canvas.clientHeight * s);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }
  function render(time) {
    if (!visible) return;
    resize();
    var w = canvas.width;
    var h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.uniform1f(u.uTime, (time / 1000) * 0.1);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform2f(u.uCam, 0, 0);
    gl.uniform1f(u.uZoom, 1);
    gl.uniform1f(u.uSeed, window._nebulaSeed || 0);
    gl.uniform4f(
      u.uFreqs,
      0.5 + 0.1 * Math.sin((time / 1000) * 0.03),
      0.5 + 0.1 * Math.sin((time / 1000) * 0.05 + 1.0),
      0.5 + 0.1 * Math.sin((time / 1000) * 0.07 + 2.0),
      0.5 + 0.1 * Math.sin((time / 1000) * 0.09 + 3.0),
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    animId = requestAnimationFrame(render);
  }
  function start(overlay) {
    if (visible && activeOverlay === overlay) return;
    if (activeOverlay && activeOverlay !== overlay) {
      canvas.remove();
    }
    activeOverlay = overlay;
    overlay.insertBefore(canvas, overlay.firstChild);
    visible = true;
    if (typeof window.pauseMap === "function") window.pauseMap();
    if (!gl) initGL();
    resize();
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(render);
  }
  function stop() {
    visible = false;
    activeOverlay = null;
    canvas.remove();
    if (typeof window.resumeMap === "function") window.resumeMap();
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }
  function watch(overlay) {
    var obs = new MutationObserver(function () {
      if (overlay.classList.contains("hidden")) {
        if (activeOverlay === overlay) stop();
      } else {
        start(overlay);
      }
    });
    obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
    if (!overlay.classList.contains("hidden")) {
      start(overlay);
    }
  }
  ["gameover-overlay", "commander-overlay"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) watch(el);
  });
})();
function die() {
  window._autoMode = null;
  window._hasAttacked = false;
  var hasPod = hasEscapePod;
  var hasIns = typeof playerHasInsurance !== "undefined" && playerHasInsurance;
  var payout = hasPod && hasIns ? shipValuationForInsurance(true) : 0;
  if (hasPod && typeof addMailMessage === "function") {
    addMailMessage("Ship Destroyed", `Your ship has been destroyed. Just before the final demise of your ship, your escape pod gets activated and ejects you. After a few days, the Space Corps picks you up and drops you off at a nearby space port.${hasIns ? " Since your ship was insured, the bank pays you " + payout.toLocaleString() + " cr, the total value of the destroyed ship." : ""} In 3 days and with 500 cr, you manage to convert your pod into a Flea.`);
  }
  if (hasIns) {
    playerHasInsurance = false;
    noClaim = 0;
    if (hasPod) {
      playerCredits += payout;
    }
  }
  if (window.CREW_NAMES) {
    window.CREW_NAMES.forEach(function (c) {
      c.hired = false;
    });
    saveCrewNames();
  }
  if (typeof playerCargo !== "undefined") {
    for (var key in playerCargo) delete playerCargo[key];
  }
  if (typeof playerCargoBuyPrice !== "undefined") {
    for (var key in playerCargoBuyPrice) delete playerCargoBuyPrice[key];
  }
  if (hasPod) {
    playerShip = {
      name: "Flea",
      gadgets: [],
      weapons: [],
      shields: [],
      specials: [],
    };
    playerFuel = SHIP_STATS.Flea.fuel;
    var cost = 500;
    if (playerCredits >= cost) {
      playerCredits -= cost;
    } else {
      if (typeof loanDebt !== "undefined") {
        loanDebt += cost - playerCredits;
      }
      playerCredits = 0;
    }
    savePlayerShip();
    saveFuelState();
    if (typeof clearMissionsOnDeath === "function") clearMissionsOnDeath(true);
    if (
      typeof renderShipPages === "function" &&
      typeof shipOverlay !== "undefined" &&
      !shipOverlay.classList.contains("hidden")
    )
      renderShipPages();
  } else {
    if (typeof showGameOver === "function") showGameOver();
  }
  if (typeof hideShip === "function") hideShip();
  var travelOverlay = document.getElementById("travel-overlay");
  if (travelOverlay && !travelOverlay.classList.contains("hidden")) {
    travelOverlay.classList.add("hidden");
  }
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof saveState === "function") saveState();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (typeof updateFuelBlink === "function") updateFuelBlink();
}
