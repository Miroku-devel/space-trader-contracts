// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

var enemyEl = document.getElementById("travel-enemy");
var encounterBtns = document.getElementById("travel-encounter-buttons");
var bottomBtns = document.getElementById("travel-bottom-buttons");
var encBtns = {};
document.querySelectorAll(".enc-btn").forEach(function (el) {
  encBtns[el.dataset.action] = el;
});
function showConfirmDialog(title, msg, confirmText, cancelText, onConfirm, onCancel) {
  document.getElementById("confirm-msg").innerHTML = title ? title + "<br>" + msg : msg;
  var cancelBtn = document.getElementById("btn-confirm-cancel");
  cancelBtn.textContent = cancelText || "Decline";
  cancelBtn.classList.add("btn-cancel-red");
  var okBtn = document.getElementById("btn-confirm-ok");
  okBtn.textContent = confirmText || "Proceed";
  okBtn.classList.remove("btn-red");
  okBtn.classList.add("btn-yes-green");
  window._confirmCallback = onConfirm;
  window._confirmCancelCallback = onCancel || null;
  document.getElementById("confirm-overlay").classList.remove("hidden");
}
var _encEpoch = 0;
var _encounterPct = 0;
function _isPoliceShip() {
  return typeof playerShip !== "undefined" && playerShip.name === "Police";
}
function _policeCannotAttack() {
  if (window._enemyResistsArrest) return false;
  if (!_isPoliceShip()) return false;
  if (window._isManhuntEnemy) return false;
  var t = window._enemyType;
  return t === "trader" || t === "police";
}
function _policeCannotTrade() {
  return _isPoliceShip() && window._enemyType === "trader";
}
function showActions(list) {
  document.querySelectorAll(".enc-btn").forEach(function (el) {
    el.classList.add("hidden");
  });
  if (encBtns.auto && !window._autoMode && window._hasAttacked) encBtns.auto.classList.remove("hidden");
  list
    .filter(function (a) {
      if (a === "trade") return !_policeCannotTrade();
      if (a !== "attack") return true;
      return !_policeCannotAttack();
    })
    .forEach(function (a) {
      if (encBtns[a]) encBtns[a].classList.remove("hidden");
    });
  list.forEach(function (a) {
    if (encBtns[a] && encBtns[a].parentNode) {
      encBtns[a].parentNode.appendChild(encBtns[a]);
    }
  });
}
var _travelMsgTimeout = null;
function showTravelMsg(msg, immediate) {
  var el = document.getElementById("travel-msg-label");
  if (!el) return;
  if (_travelMsgTimeout) clearTimeout(_travelMsgTimeout);
  if (immediate) {
    el.classList.remove("hidden");
    el.innerHTML = "";
    var span = document.createElement("span");
    span.textContent = msg;
    el.appendChild(span);
    return;
  }
  el.classList.add("hidden");
  _travelMsgTimeout = setTimeout(function () {
    el.innerHTML = "";
    var span = document.createElement("span");
    span.textContent = msg;
    el.appendChild(span);
    el.classList.remove("hidden");
    _travelMsgTimeout = null;
  }, 300);
}
window.showTravelMsg = showTravelMsg;
function _enemyLabel() {
  if (window._isManhuntEnemy) return "The suspect";
  if (window._isHeroEnemy)
    return "The " + (window._enemyShipName || "alien");
  if (window._isSmuggler) return "The smuggler";
  return "The " + (window._enemyType || "enemy");
}
function clearTravelMsg() {
  var el = document.getElementById("travel-msg-label");
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("has-bounty");
  if (_travelMsgTimeout) clearTimeout(_travelMsgTimeout);
  _travelMsgTimeout = null;
  var bounty = document.getElementById("travel-msg-bounty");
  if (bounty) bounty.classList.add("hidden");
}
function _flashStatDelta(kind, delta) {
  if (!delta) return;
  var el = document.getElementById("travel-stats-label");
  if (!el) return;
  var span = el.querySelector("." + kind);
  if (!span) return;
  var prev = span.querySelector(".stat-delta");
  if (prev) prev.remove();
  var d = document.createElement("span");
  d.className = "stat-delta " + (delta > 0 ? "pos" : "neg");
  d.textContent = (delta > 0 ? "+" : "") + delta;
  span.appendChild(d);
  void d.offsetHeight;
  d.classList.add("show");
  setTimeout(function () {
    d.classList.remove("show");
    setTimeout(function () {
      if (d.parentNode) d.parentNode.removeChild(d);
    }, 400);
  }, 1000);
}
function showTravelBounty(amount) {
  var el = document.getElementById("travel-msg-bounty");
  if (!el) return;
  el.textContent = "Bounty: +" + amount.toLocaleString() + " cr!";
  el.classList.remove("hidden");
  var label = document.getElementById("travel-msg-label");
  if (label) label.classList.add("has-bounty");
}
function _showRewardBounty(reward, bounty) {
  var el = document.getElementById("travel-msg-bounty");
  if (!el) return;
  el.textContent =
    "Reward: " +
    reward.toLocaleString() +
    " cr + Bounty: " +
    bounty.toLocaleString() +
    " cr";
  el.classList.remove("hidden");
  var label = document.getElementById("travel-msg-label");
  if (label) label.classList.add("has-bounty");
}
function _updateEncounterBtns() {
  var disabled =
    !!window._enemyOutcomeDecided ||
    window._enemyHull <= 0 ||
    !!window._isEnemyFleeing ||
    !!window._isEscaping ||
    !!window._actionInProgress;
  if (encBtns.flee) encBtns.flee.disabled = disabled;
  if (encBtns.submit) encBtns.submit.disabled = disabled;
  if (encBtns.surrender) encBtns.surrender.disabled = disabled;
  if (encBtns.bribe) encBtns.bribe.disabled = disabled;
  if (encBtns.trade)
    encBtns.trade.disabled =
      disabled || (window._enemyType === "trader" && window._attackStarted);
  if (encBtns.ignore) encBtns.ignore.disabled = window._enemyHull <= 0;
  if (encBtns.inspect) encBtns.inspect.disabled = disabled;
  if (encBtns.decloak) encBtns.decloak.disabled = !!window._decloaked;
}
window._updateAttackBtn = function () {
  if (!encBtns.attack) return;
  var hasWeps =
    typeof playerShip !== "undefined" &&
    playerShip.weapons &&
    playerShip.weapons.length > 0;
  encBtns.attack.disabled =
    !hasWeps ||
    !!window._actionInProgress ||
    !!window._enemyOutcomeDecided ||
    window._enemyHull <= 0 ||
    _policeCannotAttack() ||
    !!window._isEscaping;
  if (encBtns.auto && window._hasAttacked && !window._autoMode) {
    encBtns.auto.disabled = encBtns.attack.disabled;
  }
  _updateEncounterBtns();
};
var _shipPool = [
  { name: "Flea", freq: 2, pirate: false, trader: true },
  { name: "Gnat", freq: 28, pirate: true, trader: true },
  { name: "Firefly", freq: 20, pirate: true, trader: true },
  { name: "Mosquito", freq: 20, pirate: true, trader: true },
  { name: "Bumblebee", freq: 15, pirate: true, trader: true },
  { name: "Beetle", freq: 3, pirate: false, trader: true },
  { name: "Hornet", freq: 6, pirate: true, trader: true },
  { name: "Grasshopper", freq: 2, pirate: true, trader: true },
  { name: "Termite", freq: 2, pirate: true, trader: true },
  { name: "Wasp", freq: 2, pirate: true, trader: true },
];
var SPECIAL_PIRATE_CHANCE = 0.01;
var SPECIAL_PIRATE_SHIPS = ["Dragonfly", "Mantis", "Scarab", "Scorp"];
function _encounterChance(system) {
  var r =
    typeof POLITICS_TRADE_RULES !== "undefined"
      ? POLITICS_TRADE_RULES[system]
      : null;
  if (!r) return { pirates: 2, police: 3, traders: 5 };
  return {
    pirates: r.occurrencePirates,
    police: r.occurrencePolice,
    traders: r.occurrenceTraders,
  };
}
var WEAPON_DMG = {
  "Pulse laser": 15,
  "Beam laser": 25,
  "Military laser": 35,
  "Morgan's laser": 85,
};
window.WEAPON_DMG = WEAPON_DMG;
function _shieldPower(name) {
  if (name.indexOf("Lightning") !== -1) return 350;
  if (name.indexOf("Reflective") !== -1) return 200;
  if (name.indexOf("Energy") !== -1) return 100;
  return 100;
}
function _totalShieldPower(list) {
  if (!list || list.length === 0) return 0;
  var t = 0;
  for (var i = 0; i < list.length; i++) t += _shieldPower(list[i]);
  return t;
}
window._totalShieldPower = _totalShieldPower;
var _weaponPool = [
  { v: "Pulse laser", w: 48 },
  { v: "Beam laser", w: 33 },
  { v: "Military laser", w: 15 },
  { v: "Morgan's laser", w: 4 },
];
var _shieldPool = [
  { v: "Energy shield", w: 70 },
  { v: "Reflective shield", w: 30 },
  { v: "Lightning shield", w: 10 },
];
var _gadgetPool = [
  { v: "5 extra cargo bays", w: 35 },
  { v: "Auto-repair system", w: 20 },
  { v: "Navigation system", w: 20 },
  { v: "Targeting system", w: 25 },
];
function _bestRoll(tries, max) {
  var best = 0;
  for (var i = 0; i < tries; i++) {
    best = Math.max(best, Math.floor(Math.random() * max));
  }
  return best;
}
function _pickFromPool(items, total, roll) {
  for (var i = 0; i < items.length; i++) {
    roll -= items[i].w;
    if (roll <= 0) return items[i].v;
  }
  return items[items.length - 1].v;
}
function _rollEnemyLoadout(shipName, tries) {
  var stats = SHIP_STATS[shipName];
  var ws = [],
    ss = [],
    gs = [];
  if (!stats)
    return { ws: ws, ss: ss, gs: gs, fighter: 1, pilot: 1, engineer: 1 };
  var wn = stats.weapons,
    sn = stats.shields;
  var special = shipName === "Dragonfly" || shipName === "Scarab";
  if (wn > 0) {
    var n = special ? wn : 1 + Math.floor(Math.random() * wn);
    if (tries > 4) n += 1;
    if (tries > 3) n += Math.floor(Math.random() * 2);
    for (var i = 0; i < n; i++) {
      var roll = _bestRoll(tries, 100);
      ws.push(_pickFromPool(_weaponPool, 100, roll));
    }
  }
  if (sn > 0) {
    var n = special ? sn : Math.floor(Math.random() * (sn + 1));
    if (tries > 3) n += Math.floor(Math.random() * 2);
    if (tries > 1) n += Math.floor(Math.random() * 2);
    for (var i = 0; i < n; i++) {
      var roll = _bestRoll(tries, 100);
      ss.push(_pickFromPool(_shieldPool, 110, roll));
    }
  }
  var gn = stats.gadgets;
  if (gn > 0) {
    var n = Math.floor(Math.random() * (gn + 1));
    if (n < gn) {
      if (tries > 4) {
        n++;
      } else if (tries > 2) {
        n += Math.floor(Math.random() * 2);
      }
    }
    for (var i = 0; i < n; i++) {
      var roll = _bestRoll(tries, 100);
      var picked = _pickFromPool(_gadgetPool, 100, roll);
      if (picked !== "5 extra cargo bays" && gs.indexOf(picked) !== -1) {
        gs.push("5 extra cargo bays");
      } else {
        gs.push(picked);
      }
    }
  }
  var fighter = 1 + Math.floor(Math.random() * 10);
  var pilot = 1 + Math.floor(Math.random() * 10);
  var engineer = 1 + Math.floor(Math.random() * 10);
  if (gs.indexOf("Targeting system") !== -1) fighter += 3;
  if (gs.indexOf("Navigation system") !== -1) pilot += 3;
  if (gs.indexOf("Auto-repair system") !== -1) engineer += 3;
  return {
    ws: ws,
    ss: ss,
    gs: gs,
    fighter: fighter,
    pilot: pilot,
    engineer: engineer,
  };
}
window._rollEnemyLoadout = _rollEnemyLoadout;
function _equipEnemyShip(shipName, tries, loadout) {
  var stats = SHIP_STATS[shipName];
  if (!stats) {
    window._enemyWeapons = [];
    window._enemyShields = [];
    window._enemyGadgets = [];
    return;
  }
  var ws, ss, gs, baseFighter, basePilot, baseEngineer;
  if (loadout) {
    ws = loadout.weapons || [];
    ss = loadout.shields || [];
    gs = loadout.gadgets || [];
    baseFighter = loadout.fighter;
    basePilot = loadout.pilot;
    baseEngineer = loadout.engineer;
  } else {
    var rolled = _rollEnemyLoadout(shipName, tries);
    ws = rolled.ws;
    ss = rolled.ss;
    gs = rolled.gs;
    baseFighter = rolled.fighter;
    basePilot = rolled.pilot;
    baseEngineer = rolled.engineer;
  }
  window._enemyShipName = shipName;
  window._enemyWeapons = ws;
  window._enemyShields = ss;
  window._enemyGadgets = gs;
  window._enemyFighter = baseFighter;
  window._enemyPilot = basePilot;
  window._enemyEngineer = baseEngineer;
  window._enemyShieldMax = _totalShieldPower(ss);
  window._enemyCargo = {};
  if (
    typeof TRADE_ITEMS !== "undefined" &&
    (window._enemyType === "pirate" || window._enemyType === "trader")
  ) {
    var cargoCount = 1 + Math.floor(Math.random() * 3);
    for (var ci = 0; ci < cargoCount; ci++) {
      var itemIdx = Math.floor(Math.random() * TRADE_ITEMS.length);
      var qty =
        window._enemyType === "trader"
          ? 3 + Math.floor(Math.random() * 15)
          : 1 + Math.floor(Math.random() * 8);
      window._enemyCargo[itemIdx] = (window._enemyCargo[itemIdx] || 0) + qty;
    }
  }
  window._enemyShieldHp = window._enemyShieldMax;
  if (ss.length > 0) {
    var rolled = 0;
    for (var i = 0; i < ss.length; i++) {
      rolled += _bestRoll(5, _shieldPower(ss[i])) + 1;
    }
    window._enemyShieldHp = Math.min(window._enemyShieldMax, rolled);
  }
  window._enemyMaxHull = stats ? stats.hull : 100;
  window._enemyHull = window._enemyMaxHull;
  if (ss.length > 0 && Math.floor(Math.random() * 10) <= 7) {
  } else {
    var hullStrength = _bestRoll(5, window._enemyMaxHull);
    window._enemyHull = hullStrength;
  }
}
function _afterEnemyExit() {
  window._warpPaused = false;
  _start = performance.now() - _encounterPct * _duration;
}
function resumeTravel() {
  window._autoMode = null;
  clearTravelMsg();
  _encEpoch++;
  window._actionInProgress = false;
  if (typeof SFX !== "undefined" && typeof SFX.stopFightTheme === "function")
    SFX.stopFightTheme();
  window._policeEncounterSubtype = undefined;
  window._policeAttackPenaltyApplied = false;
  window._encounterSystem = null;
  window._isEscaping = false;
  window._isManhuntEnemy = false;
  window._isHeroEnemy = false;
  window._enemyWeapons = [];
  window._enemyShields = [];
  window._enemyGadgets = [];
  window._enemyCargo = {};
  window._isEnemyFleeing = false;
  window._enemyOutcomeDecided = false;
  window._hasAttacked = false;
  window._enemyResistsArrest = false;
  window._isSmuggler = false;
  var playerShipEl = document.getElementById("travel-ship");
  if (playerShipEl) playerShipEl.classList.remove("cloak-active");
  if (encBtns.interrupt) encBtns.interrupt.classList.add('hidden');
  encounterBtns.classList.add("hidden");
  for (var k in encBtns) {
    if (encBtns[k]) encBtns[k].disabled = true;
  }
  bottomBtns.classList.add("hidden");
  var statsLabel = document.getElementById("travel-stats-label");
  if (statsLabel) statsLabel.classList.add("hidden");
  enemyEl.classList.remove("show");
  document.getElementById("travel-hull-enemy").classList.remove("visible");
  document.getElementById("travel-shield-enemy").classList.remove("visible");
  document.getElementById("travel-hull-player").classList.remove("visible");
  document.getElementById("travel-shield-player").classList.remove("visible");
  var en = document.getElementById("travel-name-enemy");
  if (en) en.classList.add("hidden");
  var pn = document.getElementById("travel-name-player");
  if (pn) pn.classList.add("hidden");
  var wd = document.querySelector("#travel-scene .warp-drive");
  if (wd) wd.style.opacity = "1";
  setTimeout(_afterEnemyExit, 800);
}
window._resumeTravel = resumeTravel;
document
  .querySelectorAll('.enc-btn[data-action="ignore"]')
  .forEach(function (el) {
    el.addEventListener("click", resumeTravel);
  });
var _burstTimers = [];
function _enemyResponse(callback) {
  var n = Math.max(1, (window._enemyFighter || 2) - 1);
  var epoch = _encEpoch;
  for (var i = 0; i < n; i++) {
    (function (i) {
      setTimeout(function () {
        if (epoch !== _encEpoch) return;
        if (
          !window._isEnemyFleeing &&
          (!window._isEscaping || Math.random() >= 0.9)
        ) {
          if (i === 0 && typeof window._enemyStrike === "function")
            window._enemyStrike();
          if (
            typeof window._triggerEnemyLaser === "function" &&
            window._enemyShipName
          )
            window._triggerEnemyLaser(window._enemyShipName.toLowerCase());
        }
        if (i === n - 1 && typeof callback === "function") callback();
      }, i * 150);
    })(i);
  }
}
function attackBurst() {
  if (window._enemyOutcomeDecided || window._enemyHull <= 0) return;
  if (_policeCannotAttack()) return;
  if (
    !window._enemyNoWeaponResponded &&
    (window._enemyWeapons || []).length === 0
  ) {
    window._enemyNoWeaponResponded = true;
  }
  _burstTimers.forEach(function (t) {
    clearTimeout(t);
  });
  _burstTimers = [];
  var b = typeof fighterSkillTotal === "function" ? fighterSkillTotal() : 1;
  var count = 1 + Math.floor(b / 3);
  var delay = 120;
  if (typeof playerShip === "undefined") return;
  if (
    window._enemyType === "police" &&
    window._policeEncounterSubtype === "inspection"
  ) {
    window._policeEncounterSubtype = "attack";
    if (!window._autoMode) showActions(["attack", "flee", "surrender"]);
  }
  if (!window._attackMsgShown && window._enemyType) {
    window._attackMsgShown = true;
    window._attackStarted = true;
    if (typeof SFX !== "undefined" && typeof SFX.playFightTheme === "function")
      SFX.playFightTheme();
    var attackTarget = window._isSmuggler
      ? "smuggler"
      : window._isHeroEnemy
        ? window._enemyShipName || window._enemyType
        : window._enemyType;
    showTravelMsg("You attack the " + attackTarget + "!");
    var recBefore =
      typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
    if (window._enemyType === "trader" && !window._enemyResistsArrest) {
      if (!window._autoMode) showActions(["attack", "flee", "surrender"]);
      if (typeof policeRecordScore !== "undefined") {
        if (policeRecordScore >= 0) {
          policeRecordScore = -5;
        } else {
          policeRecordScore = policeRecordScore - 2;
        }
      }
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
    }
    if (
      window._enemyType === "police" &&
      typeof policeRecordScore !== "undefined" &&
      !window._policeAttackPenaltyApplied
    ) {
      window._policeAttackPenaltyApplied = true;
      if (policeRecordScore > -30) {
        policeRecordScore = -30;
      }
      policeRecordScore = policeRecordScore - 3;
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
    }
    if (recBefore !== null && policeRecordScore !== recBefore) {
      _flashStatDelta("pilot-record", policeRecordScore - recBefore);
      if (typeof saveState === "function") saveState();
    }
  }
  window._actionInProgress = true;
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
  if (typeof window._playerStrike === "function") window._playerStrike();
  var epoch = _encEpoch;
  for (var i = 0; i < count; i++) {
    (function (i) {
      _burstTimers.push(
        setTimeout(function () {
          if (epoch !== _encEpoch) return;
          if (typeof window._triggerLaser === "function")
            window._triggerLaser(playerShip.name.toLowerCase());
          if (i === count - 1) {
            setTimeout(function () {
              if (epoch !== _encEpoch) return;
              _afterBurst();
            }, 200);
          }
        }, i * delay),
      );
    })(i);
  }
}
function _afterBurst() {
  if (window._enemyHull <= 0) {
    window._actionInProgress = false;
    if (encBtns.auto) encBtns.auto.classList.add("hidden");
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    showTravelMsg(
      window._isManhuntEnemy ||
        (typeof playerShip !== "undefined" && playerShip.name === "Police")
        ? _enemyLabel() + " has been neutralized"
        : _enemyLabel() + " has been destroyed",
    );
    if (typeof window._triggerExplosion === "function")
      window._triggerExplosion(document.getElementById("travel-enemy"));
    if (typeof window._onEnemyKilled === "function") {
      setTimeout(window._onEnemyKilled, 300);
    }
    return;
  }
  if (window._enemyNoWeaponResponded) {
    window._actionInProgress = false;
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    if (Math.random() < 0.5) {
      _enemyFlee();
    } else {
      _enemySurrender();
    }
    return;
  }
  _enemyResponse(function () {
    if (typeof window._checkEnemySurrender === "function")
      window._checkEnemySurrender();
    if (window._enemyHull <= 0) {
      window._actionInProgress = false;
      if (encBtns.auto) encBtns.auto.classList.add("hidden");
      if (typeof window._updateAttackBtn === "function")
        window._updateAttackBtn();
      showTravelMsg(
        window._isManhuntEnemy ||
          (typeof playerShip !== "undefined" && playerShip.name === "Police")
          ? _enemyLabel() + " has been neutralized"
          : _enemyLabel() + " has been destroyed",
      );
      if (typeof window._triggerExplosion === "function")
        window._triggerExplosion(document.getElementById("travel-enemy"));
      if (typeof window._onEnemyKilled === "function") {
        setTimeout(window._onEnemyKilled, 300);
      }
      return;
    }
    window._actionInProgress = false;
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    if (window._autoMode && !window._enemyOutcomeDecided) {
      setTimeout(_autoDecide, 800);
    } else if (!window._autoMode && !window._enemyOutcomeDecided && encBtns.auto) {
      window._hasAttacked = true;
      encBtns.auto.disabled = false;
      encBtns.auto.classList.remove('hidden');
    }
  });
}
function fleeAction() {
  window._isEscaping = true;
  if (encBtns.flee) encBtns.flee.disabled = true;
  if (encBtns.submit) encBtns.submit.disabled = true;
  if (encBtns.surrender) encBtns.surrender.disabled = true;
  if (encBtns.attack) encBtns.attack.disabled = true;
  if (encBtns.auto) encBtns.auto.disabled = true;
  var fleeStart = Date.now();
  var epoch = _encEpoch;
  _enemyResponse(function () {
    var wait = Math.max(0, 700 - (Date.now() - fleeStart));
    setTimeout(function () {
      if (epoch !== _encEpoch) return;
      window._isEscaping = false;
      var recBeforeFlee =
        typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
      if (
        window._enemyType === "police" &&
        window._policeEncounterSubtype === "inspection" &&
        typeof policeRecordScore !== "undefined"
      ) {
        window._policeEncounterSubtype = "attack";
        if (policeRecordScore > -5) {
          policeRecordScore = -6;
        } else {
          policeRecordScore = policeRecordScore - 2;
        }
      }
      var pPilot =
        typeof pilotSkillTotal === "function" ? pilotSkillTotal() : 5;
      var ePilot = window._enemyPilot || 1;
      var escapeRoll =
        2 * (Math.floor(Math.random() * 7) + Math.floor(pPilot / 3));
      var pursuitRoll = Math.floor(Math.random() * (ePilot * 4));
      if (escapeRoll >= pursuitRoll) {
        if (typeof gameEscapes !== "undefined") gameEscapes++;
        if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
        if (recBeforeFlee !== null && policeRecordScore !== recBeforeFlee) {
          _flashStatDelta("pilot-record", policeRecordScore - recBeforeFlee);
          if (typeof saveState === "function") saveState();
          setTimeout(resumeTravel, 1500);
        } else {
          resumeTravel();
        }
      } else {
        if (
          typeof SFX !== "undefined" &&
          typeof SFX.playFightTheme === "function"
        )
          SFX.playFightTheme();
        if (encBtns.flee) encBtns.flee.disabled = false;
        if (encBtns.submit) encBtns.submit.disabled = false;
        if (typeof window._updateAttackBtn === "function")
          window._updateAttackBtn();
        showTravelMsg("Escape failed!");
        if (window._autoMode && !window._enemyOutcomeDecided) {
          setTimeout(_autoDecide, 800);
        }
      }
    }, wait);
  });
}
function surrenderAction() {
  for (var k in encBtns) {
    if (encBtns[k]) encBtns[k].disabled = true;
  }
  if (window._enemyType === "police") {
    if (typeof policeRecordScore !== "undefined" && policeRecordScore <= -100) {
      showTravelMsg("Surrender? You die today!");
      if (encBtns.attack) encBtns.attack.disabled = false;
      if (encBtns.flee) encBtns.flee.disabled = false;
      if (encBtns.surrender) encBtns.surrender.disabled = false;
      if (encBtns.auto && window._hasAttacked) encBtns.auto.disabled = false;
      return;
    }
    if (typeof window.openSurrender === "function") {
      window.openSurrender();
    }
    return;
  } else if (window._enemyType === "pirate" || window._enemyType === "trader") {
    if (
      typeof TRADE_ITEMS === "undefined" ||
      typeof playerCargo === "undefined"
    ) {
      resumeTravel();
      return;
    }
    if (typeof window.openPirateSurrender === "function") {
      window.openPirateSurrender();
    }
  }
}
function submitAction() {
  window._inspected = true;
  var recBefore =
    typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
  var hasIllegal = false;
  if (
    typeof playerCargo !== "undefined" &&
    typeof TRADE_ITEMS !== "undefined"
  ) {
    for (var key in playerCargo) {
      var ti = TRADE_ITEMS.find(function (t) {
        return t.id == key || t.name === key;
      });
      if (ti && ti.illegal && playerCargo[key] > 0) {
        hasIllegal = true;
        delete playerCargo[key];
        if (typeof playerCargoBuyPrice !== "undefined")
          delete playerCargoBuyPrice[key];
      }
    }
  }
  if (hasIllegal) {
    var nw =
      typeof netWorth === "function"
        ? netWorth()
        : typeof playerCredits !== "undefined"
          ? playerCredits
          : 0;
    var fine = Math.ceil(nw / 40 / 50) * 50;
    fine = Math.max(100, Math.min(fine, 10000));
    if (typeof playerCredits !== "undefined" && playerCredits >= fine) {
      playerCredits -= fine;
    } else {
      var remainder =
        fine - (typeof playerCredits !== "undefined" ? playerCredits : 0);
      playerCredits = 0;
      if (typeof loanDebt !== "undefined") {
        loanDebt += remainder;
        if (typeof addMailMessage === "function")
          addMailMessage("Debt Notice", "You have exceeded your credit limit. Your account is now in debt at 10% interest per warp. Outstanding balance: " + loanDebt.toLocaleString() + " cr. Reduce your debt or risk asset seizure.");
      }
    }
    if (typeof policeRecordScore !== "undefined")
      policeRecordScore = Math.max(-100, policeRecordScore - 1);
    if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
    if (recBefore !== null && policeRecordScore !== recBefore)
      _flashStatDelta("pilot-record", policeRecordScore - recBefore);
    if (typeof saveState === "function") saveState();
    showTravelMsg("Illegal goods confiscated! Fined " + fine.toLocaleString() + " cr");
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof updateInfoTravel === "function") updateInfoTravel();
    window._enemyOutcomeDecided = true;
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    _updateEncounterBtns();
    showActions(["ignore"]);
    if (encBtns.ignore) encBtns.ignore.disabled = false;
  } else {
    if (typeof policeRecordScore !== "undefined")
      policeRecordScore = Math.min(100, policeRecordScore + 1);
    if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
    if (recBefore !== null && policeRecordScore !== recBefore)
      _flashStatDelta("pilot-record", policeRecordScore - recBefore);
    if (typeof saveState === "function") saveState();
    showTravelMsg("Clean, you are free to go");
    if (typeof updateInfoTravel === "function") updateInfoTravel();
    window._enemyOutcomeDecided = true;
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    _updateEncounterBtns();
    showActions(["ignore"]);
    if (encBtns.ignore) encBtns.ignore.disabled = false;
  }
}
function _executeSurrenderCargo(freePirateBays) {
  var playerItemIds = TRADE_ITEMS.filter(function (t) {
    return (playerCargo[t.id] || 0) > 0;
  }).map(function (t) {
    return t.id;
  });
  while (freePirateBays > 0 && playerItemIds.length > 0) {
    var idx = Math.floor(Math.random() * playerItemIds.length);
    var pick = playerItemIds[idx];
    playerCargo[pick] = (playerCargo[pick] || 0) - 1;
    if (
      typeof playerCargoBuyPrice !== "undefined" &&
      playerCargoBuyPrice[pick] != null
    ) {
      var oldQty = playerCargo[pick] + 1;
      if (oldQty > 1) {
        playerCargoBuyPrice[pick] = Math.floor(
          (playerCargoBuyPrice[pick] * (oldQty - 1)) / oldQty,
        );
      } else {
        delete playerCargoBuyPrice[pick];
      }
    }
    if ((playerCargo[pick] || 0) <= 0) {
      delete playerCargo[pick];
      playerItemIds.splice(idx, 1);
    }
    freePirateBays--;
  }
  if (typeof beginMissionCancelBatch === "function") beginMissionCancelBatch();
  if (typeof checkDeliverCargoIntegrity === "function")
    checkDeliverCargoIntegrity("cargo seized");
  if (typeof sendMissionCancelBatchMail === "function") sendMissionCancelBatchMail();
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  showTravelMsg((window._enemyType === "trader" ? "The trader" : "The pirate") + " seizes as much cargo as he can carry");
  window._enemyOutcomeDecided = true;
  window._hasAttacked = false;
  _updateEncounterBtns();
  showActions(["ignore"]);
  if (encBtns.ignore) encBtns.ignore.disabled = false;
}
function _executeSurrenderRansom(blackmail) {
  if (typeof playerCredits !== "undefined") {
    if (playerCredits >= blackmail) {
      playerCredits -= blackmail;
    } else {
      var remainder = blackmail - playerCredits;
      playerCredits = 0;
      if (typeof loanDebt !== "undefined") {
        loanDebt += remainder;
        if (typeof addMailMessage === "function")
          addMailMessage("Debt Notice", "You have exceeded your credit limit. Your account is now in debt at 10% interest per warp. Outstanding balance: " + loanDebt.toLocaleString() + " cr. Reduce your debt or risk asset seizure.");
      }
    }
  }
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  showTravelMsg((window._enemyType === "trader" ? "The trader" : "The pirate") + " takes " + blackmail.toLocaleString() + " cr and lets you go");
  window._enemyOutcomeDecided = true;
  window._hasAttacked = false;
  _updateEncounterBtns();
  showActions(["ignore"]);
  if (encBtns.ignore) encBtns.ignore.disabled = false;
}
function hasIllegalCargo() {
  if (typeof playerCargo === "undefined" || typeof TRADE_ITEMS === "undefined")
    return false;
  for (var key in playerCargo) {
    if (playerCargo[key] <= 0) continue;
    var ti = TRADE_ITEMS.find(function (t) {
      return t.id == key || t.name === key;
    });
    if (ti && ti.illegal) return true;
  }
  return false;
}
function bribeAction() {
  if (typeof window._traderBribeAmount !== "undefined") {
    traderBribeAction();
  } else if (typeof window.openBribe === "function") {
    window.openBribe();
  }
}
function tradeAction() {
  if (_policeCannotTrade()) return;
  if (typeof window.openTraderTrade === "function") window.openTraderTrade();
}
function plunderAction() {
  if (typeof window.openBoardPlunder === "function") window.openBoardPlunder();
}
function catchAction() {
  if (typeof window.openCatchConfirm === "function") window.openCatchConfirm();
}
function inspectAction() {
  window._enemyOutcomeDecided = true;
  if (encBtns.inspect) encBtns.inspect.disabled = true;
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
  var cargo = window._enemyCargo || {};
  var hasIllegal = false;
  var illegalValue = 0;
  if (typeof TRADE_ITEMS !== "undefined") {
    for (var idx in cargo) {
      if (cargo[idx] <= 0) continue;
      var item = TRADE_ITEMS[idx];
      if (item && item.illegal) {
        hasIllegal = true;
        var encStar =
          typeof selectedStar !== "undefined" ? selectedStar : null;
        var p = 0;
        if (typeof getItemBasePrice === "function" && encStar)
          p = getItemBasePrice(item, encStar);
        if (!(p > 0)) p = item.base || 0;
        illegalValue += p * cargo[idx];
      }
    }
  }
  if (hasIllegal) {
    window._isSmuggler = true;
    if (typeof showTypeLabel === "function") showTypeLabel("trader");
    var will = typeof window.getBribeWillingness === "function" ? window.getBribeWillingness() : 1;
    if (Math.random() < 0.3) {
      var cargoVal = 0;
      for (var idx2 in cargo) {
        if (cargo[idx2] <= 0) continue;
        var it2 = TRADE_ITEMS[idx2];
        if (!it2) continue;
        var encStar2 = typeof selectedStar !== "undefined" ? selectedStar : null;
        var pr2 = 0;
        if (typeof getItemBasePrice === "function" && encStar2)
          pr2 = getItemBasePrice(it2, encStar2);
        if (!(pr2 > 0)) pr2 = it2.base || 0;
        cargoVal += pr2 * cargo[idx2];
      }
      var enemyWorth =
        (typeof _enemyShipValuation === "function" ? _enemyShipValuation() : 0) +
        cargoVal;
      var bribe = Math.ceil(enemyWorth / (10 * (will > 0 ? will : 1)) / 100) * 100;
      bribe = Math.max(100, Math.min(bribe, 10000));
      window._traderBribeAmount = bribe;
      showTravelMsg("Contraband found!");
      setTimeout(function () {
        var labelEl = document.getElementById("travel-msg-label");
        if (labelEl) labelEl.classList.add("has-bounty");
        var bountyEl = document.getElementById("travel-msg-bounty");
        if (bountyEl) {
          bountyEl.textContent = "The smuggler offers a bribe of " + bribe.toLocaleString() + " cr";
          bountyEl.classList.remove("hidden");
        }
      }, 300);
      showActions(["arrest", "ignore", "bribe"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      if (encBtns.arrest) encBtns.arrest.disabled = false;
      if (encBtns.bribe) encBtns.bribe.disabled = false;
    } else {
      showTravelMsg("Contraband found!");
      showActions(["ignore", "arrest"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      if (encBtns.arrest) encBtns.arrest.disabled = false;
    }
  } else {
    showTravelMsg("Clean, the trader is free to go");
    showActions(["ignore"]);
    if (encBtns.ignore) encBtns.ignore.disabled = false;
  }
}
function traderBribeAction() {
  window._enemyOutcomeDecided = true;
  if (encBtns.bribe) encBtns.bribe.disabled = true;
  if (encBtns.arrest) encBtns.arrest.disabled = true;
  var bribeAmt = window._traderBribeAmount || 0;
  window._traderBribeAmount = undefined;
  if (bribeAmt > 0 && typeof playerCredits !== "undefined") {
    playerCredits += bribeAmt;
  }
  var recBefore = typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  var repBefore = typeof gameReputationScore !== "undefined" ? gameReputationScore : 0;
  if (typeof policeRecordScore !== "undefined") {
    policeRecordScore = Math.max(-100, policeRecordScore - 1);
  }
  if (typeof gameReputationScore !== "undefined") {
    gameReputationScore = Math.max(-100, gameReputationScore - 1);
  }
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
  _flashStatDelta("pilot-record", policeRecordScore - recBefore);
  _flashStatDelta("pilot-rep", gameReputationScore - repBefore);
  if (typeof saveState === "function") saveState();
  clearTravelMsg();
  setTimeout(function () {
    var labelEl = document.getElementById("travel-msg-label");
    if (labelEl) {
      labelEl.innerHTML = "";
      var span = document.createElement("span");
      span.textContent = "You accept the bribe";
      labelEl.appendChild(span);
      labelEl.classList.add("has-bounty");
      labelEl.classList.remove("hidden");
    }
    var bountyEl = document.getElementById("travel-msg-bounty");
    if (bountyEl) {
      bountyEl.textContent = "Bounty: +" + bribeAmt.toLocaleString() + " cr!";
      bountyEl.classList.remove("hidden");
    }
  }, 300);
  showActions(["ignore"]);
  if (encBtns.ignore) encBtns.ignore.disabled = false;
}
var _actionMap = {
  attack: attackBurst,
  flee: fleeAction,
  surrender: surrenderAction,
  submit: submitAction,
  bribe: bribeAction,
  trade: tradeAction,
  plunder: plunderAction,
  catch: catchAction,
  arrest: arrestAction,
  inspect: inspectAction,
  decloak: decloakAction,
};
Object.keys(_actionMap).forEach(function (a) {
  var el = document.querySelector('.enc-btn[data-action="' + a + '"]');
  if (el) el.addEventListener("click", _actionMap[a]);
});

window._autoMode = null;
function _enterAutoMode() {
  window._autoMode = 'auto';
  document.querySelectorAll('.enc-btn').forEach(function(el) {
    el.classList.add('hidden');
  });
  if (encBtns.interrupt) { encBtns.interrupt.disabled = false; encBtns.interrupt.classList.remove('hidden'); }
  if (window._actionInProgress) {
    setTimeout(_autoDecide, 400);
  } else {
    _autoDecide();
  }
}
function _exitAutoMode() {
  window._autoMode = null;
  if (encBtns.interrupt) encBtns.interrupt.classList.add('hidden');
  var type = window._enemyType;
  if (window._hasAttacked) {
    if (window._enemyResistsArrest) {
      showActions(["attack", "flee", "surrender"]);
    } else if (type === "trader") {
      showActions(["attack", "flee", "surrender"]);
    } else if (type === "pirate") {
      showActions(["attack", "flee", "surrender"]);
    } else if (type === "police") {
      showActions(["attack", "flee", "surrender"]);
    } else {
      showActions(["attack", "flee"]);
    }
  } else {
    var policeActions =
      type === "police"
        ? window._policeEncounterSubtype === "attack"
          ? ["attack", "flee", "surrender"]
          : window._policeEncounterSubtype === "flee"
            ? ["ignore"]
            : hasIllegalCargo()
              ? ["attack", "flee", "submit", "bribe"]
              : ["attack", "flee", "submit"]
        : null;
    var traderPoliceActions =
      type === "trader" && _isPoliceShip() ? ["attack", "ignore", "inspect"] : null;
    showActions(
      traderPoliceActions ||
        policeActions ||
        _encounterActions[type] || ["attack", "flee"],
    );
  }
  if (window._hasAttacked && encBtns.auto) encBtns.auto.classList.remove('hidden');
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
}
function _autoDecide() {
  if (!window._autoMode || window._enemyOutcomeDecided) return;
  if (window._actionInProgress) return;
  var pHull = typeof playerShip !== "undefined" && playerShip.hull != null ? playerShip.hull : 100;
  var pMaxH = typeof maxHull === "function" ? maxHull() : 100;
  var pPct = pHull / pMaxH;
  var pShieldHp = window._playerShieldHp || 0;
  var eHull = window._enemyHull || 100;
  var eMaxH = window._enemyMaxHull || 100;
  var ePct = eHull / eMaxH;
  var canFlee = !!encBtns.flee;
  var hasShields = pShieldHp > 0;
  if (pPct < 0.2 && !hasShields && canFlee) {
    _doAutoAction("flee");
    return;
  }
  if (pPct < 0.5 && ePct > 0.6 && !hasShields && canFlee) {
    _doAutoAction("flee");
    return;
  }
  _doAutoAction("attack");
}
function _doAutoAction(action) {
  if (!window._autoMode) return;
  if (action === "attack") attackBurst();
  else if (action === "flee") fleeAction();
  else if (action === "surrender") surrenderAction();
  else if (action === "submit") submitAction();
}
if (encBtns.auto) {
  encBtns.auto.addEventListener("click", _enterAutoMode);
}
if (encBtns.interrupt) {
  encBtns.interrupt.addEventListener("click", _exitAutoMode);
}
var _encounterActions = {
  pirate: ["attack", "flee", "surrender"],
  police: ["attack", "flee", "surrender", "submit", "bribe"],
  trader: ["attack", "ignore", "trade"],
  plunder: ["plunder"],
};
function _hasCloak() {
  return (
    window._enemyType !== "trader" &&
    typeof playerShip !== "undefined" &&
    playerShip.gadgets &&
    playerShip.gadgets.indexOf("Cloaking device") !== -1 &&
    !window._decloaked &&
    (typeof window._enemyEngineer !== "number" ||
      engineerSkillTotal() > window._enemyEngineer)
  );
}
function _encounterActionList() {
  var type = window._enemyType;
  if (window._hasAttacked) {
    if (type === "trader") return ["attack", "flee", "surrender"];
    if (type === "pirate") return ["attack", "flee", "surrender"];
    if (type === "police") return ["attack", "flee", "surrender"];
    return ["attack", "flee"];
  }
  var policeActions =
    type === "police"
      ? window._policeEncounterSubtype === "attack"
        ? ["attack", "flee", "surrender"]
        : window._policeEncounterSubtype === "flee"
          ? ["ignore"]
          : hasIllegalCargo()
            ? ["attack", "flee", "submit", "bribe"]
            : ["attack", "flee", "submit"]
      : null;
  var traderPoliceActions =
    type === "trader" && _isPoliceShip() ? ["attack", "ignore", "inspect"] : null;
  return (
    traderPoliceActions ||
    policeActions ||
    _encounterActions[type] || ["attack", "flee"]
  );
}
function decloakAction() {
  window._decloaked = true;
  if (encBtns.decloak) encBtns.decloak.disabled = true;
  var playerShipEl = document.getElementById("travel-ship");
  if (playerShipEl) playerShipEl.classList.remove("cloak-active");
  showTravelMsg("You deactivate your cloaking device");
  showActions(_encounterActionList());
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
  _updateStatusBars();
}
function _enemyFlee() {
  showTravelMsg(_enemyLabel() + " is fleeing");
  window._isEnemyFleeing = true;
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
  var epoch = _encEpoch;
  window._fleeTimers = [];
  window._fleeTimers.push(
    setTimeout(function () {
      if (epoch !== _encEpoch) return;
      if (window._enemyHull != null && window._enemyHull <= 0) return;
      showTravelMsg(_enemyLabel() + " has managed to escape");
      window._isEnemyFleeing = false;
      window._enemyOutcomeDecided = true;
      if (typeof window._updateAttackBtn === "function")
        window._updateAttackBtn();
      window._fleeTimers.push(
        setTimeout(function () {
          if (epoch !== _encEpoch) return;
          resumeTravel();
        }, 2000),
      );
    }, 2000),
  );
}
function _enemySurrender() {
  showTravelMsg(_enemyLabel() + " surrenders");
  window._enemyOutcomeDecided = true;
  window._hasAttacked = false;
  var epoch = _encEpoch;
  setTimeout(function () {
    if (epoch !== _encEpoch) return;
    if (typeof playerShip !== "undefined" && playerShip.name === "Police") {
      showActions(["ignore", "arrest"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      if (encBtns.arrest) encBtns.arrest.disabled = false;
    } else {
      showActions(["plunder", "ignore", "catch"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      if (encBtns.plunder) encBtns.plunder.disabled = false;
      if (encBtns.catch) encBtns.catch.disabled = false;
    }
  }, 1400);
}
function arrestAction() {
  var resistWho = window._isSmuggler
    ? "smuggler"
    : window._isManhuntEnemy && window._manhuntStar
      ? "suspect"
      : window._isHeroEnemy
        ? window._enemyShipName || "alien"
        : "pirate";
  if (!window._enemyResistsArrest && Math.random() < 0.3) {
    window._enemyOutcomeDecided = false;
    window._enemyResistsArrest = true;
    window._hasAttacked = true;
    var bribeLine = document.getElementById("travel-msg-bounty");
    if (bribeLine) bribeLine.classList.add("hidden");
    var labelEl = document.getElementById("travel-msg-label");
    if (labelEl) labelEl.classList.remove("has-bounty");
    showTravelMsg("The " + resistWho + " resists arrest");
    showActions(["attack", "flee", "surrender"]);
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    return;
  }
  window._enemyOutcomeDecided = true;
  if (encBtns.arrest) encBtns.arrest.disabled = true;
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
  var recBefore =
    typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
  var repBefore =
    typeof gameReputationScore !== "undefined" ? gameReputationScore : null;
  if (typeof policeRecordScore !== "undefined")
    policeRecordScore = Math.min(100, policeRecordScore + 1);
  if (typeof gameReputationScore !== "undefined") gameReputationScore += 1;
  var getBounty =
    typeof policeRecordScore === "undefined" || policeRecordScore >= -5;
  var bountyAmt = 0;
  if (getBounty && typeof playerCredits !== "undefined") {
    bountyAmt = _bountyForEnemyShip();
    playerCredits += bountyAmt;
  }
  var msg = window._isSmuggler
    ? "The smuggler has been arrested"
    : "The pirate has been arrested";
  if (window._isManhuntEnemy && window._manhuntStar) {
    var manhuntStarName = window._manhuntStar;
    var manhuntMission =
      typeof getActiveManhuntMission === "function"
        ? getActiveManhuntMission(manhuntStarName)
        : null;
    var manhuntReward = manhuntMission ? manhuntMission.reward || 0 : 0;
    window._manhuntStar = undefined;
    window._isManhuntEnemy = false;
    msg = "The suspect has been arrested";
    showTravelMsg(msg);
    if (typeof completeManhuntMission === "function")
      completeManhuntMission(manhuntStarName);
    setTimeout(function () {
      _showRewardBounty(manhuntReward, bountyAmt);
    }, 300);
  } else if (bountyAmt > 0) {
    showTravelMsg(msg);
    setTimeout(function () {
      showTravelBounty(bountyAmt);
    }, 300);
  } else {
    showTravelMsg(msg);
  }
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (recBefore !== null && policeRecordScore !== recBefore)
    _flashStatDelta("pilot-record", policeRecordScore - recBefore);
  if (repBefore !== null && gameReputationScore !== repBefore)
    _flashStatDelta("pilot-rep", gameReputationScore - repBefore);
  if (
    (recBefore !== null && policeRecordScore !== recBefore) ||
    (repBefore !== null && gameReputationScore !== repBefore)
  ) {
    if (typeof saveState === "function") saveState();
  }
  showActions(["ignore"]);
  if (encBtns.ignore) encBtns.ignore.disabled = false;
}
window._checkEnemySurrender = function () {
  if (window._enemyHull == null || window._enemyMaxHull == null) return;
  if (window._enemyOutcomeDecided) return;
  if (window._isEnemyFleeing) return;
  var pct = window._enemyHull / window._enemyMaxHull;
  var eShieldHp = window._enemyShieldHp || 0;
  var hasShields = eShieldHp > 0;
  var type = window._enemyType;
  if (type === "police" && pct < 0.5 && !hasShields) {
    var playerMaxH = typeof maxHull === "function" ? maxHull() : 100;
    var playerCur =
      typeof playerShip !== "undefined" && playerShip.hull != null
        ? playerShip.hull
        : playerMaxH;
    var playerPct = playerCur / playerMaxH;
    if (playerPct < 0.5 && Math.random() < 0.6) {
      return;
    }
    _enemyFlee();
    return;
  }
  if (type === "pirate" && pct < 0.66 && !hasShields) {
    var playerMaxH = typeof maxHull === "function" ? maxHull() : 100;
    var playerCur =
      typeof playerShip !== "undefined" && playerShip.hull != null
        ? playerShip.hull
        : playerMaxH;
    var playerPct = playerCur / playerMaxH;
    if (playerPct < 0.66) {
      if (Math.random() < 0.6) {
        _enemyFlee();
      }
    } else {
      if (Math.random() < 0.1) {
        _enemySurrender();
      } else {
        _enemyFlee();
      }
    }
    return;
  }
  if (type === "trader") {
    if (pct < 0.66 && !hasShields) {
      if (Math.random() < 0.6) {
        _enemySurrender();
      } else {
        _enemyFlee();
      }
      return;
    }
    if (pct < 0.9 && !hasShields) {
      var playerMaxH = typeof maxHull === "function" ? maxHull() : 100;
      var playerCur =
        typeof playerShip !== "undefined" && playerShip.hull != null
          ? playerShip.hull
          : playerMaxH;
      var playerPct = playerCur / playerMaxH;
      if (playerPct < 0.66) {
        if (Math.random() < 0.2) {
          _enemyFlee();
        }
      } else if (playerPct < 0.9) {
        if (Math.random() < 0.6) {
          _enemyFlee();
        }
      } else {
        _enemyFlee();
      }
      return;
    }
  }
};
function _itemPrice(name) {
  if (typeof EQUIP_ITEMS === "undefined") return 0;
  var item = EQUIP_ITEMS.find(function (e) {
    return e.name === name;
  });
  return item ? item.price : 0;
}
function _enemyShipValuation() {
  var stats =
    typeof SHIP_STATS !== "undefined"
      ? SHIP_STATS[window._enemyShipName]
      : null;
  var val =
    stats && stats.price ? stats.price : (window._enemyMaxHull || 100) * 400;
  (window._enemyWeapons || []).forEach(function (w) {
    val += _itemPrice(w);
  });
  (window._enemyShields || []).forEach(function (s) {
    val += _itemPrice(s);
  });
  var pilot = window._enemyPilot;
  var engineer = window._enemyEngineer;
  var fighter = window._enemyFighter;
  val = (val * (2 * pilot + engineer + 3 * fighter)) / 60;
  return val;
}
function _bountyForEnemyShip() {
  var value = _enemyShipValuation();
  value = Math.floor(value / 5000) * 25;
  return Math.min(Math.max(value, 25), 2500);
}
window._onEnemyKilled = function () {
  window._hasAttacked = false;
  if (window._fleeTimers) {
    window._fleeTimers.forEach(function (t) {
      clearTimeout(t);
    });
    window._fleeTimers = [];
  }
  var repBefore =
    typeof gameReputationScore !== "undefined" ? gameReputationScore : null;
  var recBefore =
    typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
  var shipName = window._enemyShipName || "";
  var sizeVal =
    typeof _shipScale !== "undefined" ? _shipScale.sizeOf(shipName) : 2;
  var repGain = 1 + Math.floor(sizeVal / 2);
  if (typeof gameReputationScore !== "undefined") {
    gameReputationScore += repGain;
  }
  if (window._isHeroEnemy && window._heroStar) {
    var heroStarName = window._heroStar;
    var heroMission =
      typeof getActiveHeroMission === "function"
        ? getActiveHeroMission(heroStarName)
        : null;
    if (heroMission) {
      if (typeof gameKills !== "undefined") gameKills++;
      heroMission.heroDestroyed = (heroMission.heroDestroyed || 0) + 1;
      if (typeof saveMissionState === "function") saveMissionState();
      var heroDestroyedCount = heroMission.heroDestroyed || 0;
      var heroTotal =
        heroMission.heroCount ||
        (heroMission.heroLoadouts || []).length + heroDestroyedCount;
      var heroRemain = Math.max(0, heroTotal - heroDestroyedCount);
      if (heroRemain > 0) {
        window._heroClick = _currentClick + 2 + Math.floor(Math.random() * 3);
      } else {
        window._heroStar = undefined;
      }
      window._isHeroEnemy = false;
      showActions(["ignore"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      if (heroRemain > 0) {
        showTravelMsg(
          "Targets eliminated: " +
            heroDestroyedCount +
            "/" +
            Math.max(heroTotal, heroDestroyedCount),
          true,
        );
      } else {
        showTravelMsg(heroStarName + " has been liberated", true);
      }
      if (heroRemain <= 0 && typeof completeHeroMission === "function") {
        setTimeout(function () {
          completeHeroMission(heroStarName);
        }, 300);
      }
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
      if (typeof updateInfoTravel === "function") updateInfoTravel();
      if (repBefore !== null && gameReputationScore !== repBefore) {
        _flashStatDelta("pilot-rep", gameReputationScore - repBefore);
        if (typeof saveState === "function") saveState();
      }
      return;
    }
  }
  if (window._enemyType === "pirate" || window._enemyType === "trader") {
    if (typeof gameKills !== "undefined") gameKills++;
    if (window._enemyType === "pirate") {
      var getBounty = policeRecordScore >= -5;
      if (typeof policeRecordScore !== "undefined") {
        policeRecordScore = Math.min(100, policeRecordScore + 1);
      }
      var bountyAmt = 0;
      if (getBounty && typeof playerCredits !== "undefined") {
        bountyAmt = _bountyForEnemyShip();
        playerCredits += bountyAmt;
      }
      if (window._isManhuntEnemy && window._manhuntStar) {
        var manhuntStarName = window._manhuntStar;
        var manhuntMission =
          typeof getActiveManhuntMission === "function"
            ? getActiveManhuntMission(manhuntStarName)
            : null;
        var manhuntReward = manhuntMission ? manhuntMission.reward || 0 : 0;
        window._manhuntStar = undefined;
        window._isManhuntEnemy = false;
        _showRewardBounty(manhuntReward, bountyAmt);
        if (typeof completeManhuntMission === "function")
          completeManhuntMission(manhuntStarName);
      } else if (bountyAmt > 0) {
        showTravelBounty(bountyAmt);
      }
    } else if (window._enemyType === "trader") {
      if (typeof policeRecordScore !== "undefined") {
        policeRecordScore = Math.max(-100, policeRecordScore - 4);
      }
    }
    if (typeof playerShip !== "undefined" && playerShip.name === "Police") {
      showActions(["ignore"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
    } else {
      showActions(["ignore", "plunder"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      if (encBtns.plunder) encBtns.plunder.disabled = false;
    }
  } else {
    if (typeof gameKills !== "undefined") gameKills++;
    if (
      window._enemyType === "police" &&
      typeof policeRecordScore !== "undefined"
    ) {
      policeRecordScore = Math.max(-100, policeRecordScore - 6);
    }
    showActions(["ignore"]);
    if (encBtns.ignore) encBtns.ignore.disabled = false;
  }
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (repBefore !== null && gameReputationScore !== repBefore) {
    _flashStatDelta("pilot-rep", gameReputationScore - repBefore);
  }
  if (recBefore !== null && policeRecordScore !== recBefore) {
    _flashStatDelta("pilot-record", policeRecordScore - recBefore);
  }
  if (
    (recBefore !== null && policeRecordScore !== recBefore) ||
    (repBefore !== null && gameReputationScore !== repBefore)
  ) {
    if (typeof saveState === "function") saveState();
  }
};
function showTypeLabel(type) {
  var lbl = document.getElementById("travel-name-enemy");
  if (lbl) {
    var label = window._isSmuggler
      ? "Smuggler"
      : window._isManhuntEnemy
        ? "Suspect"
        : window._isHeroEnemy
          ? window._enemyShipName || "Mantis"
          : type.charAt(0).toUpperCase() + type.slice(1);
    window._enemyTypeLabel = label;
    lbl.textContent = label;
    lbl.classList.remove("hidden");
  }
}
function _policeMult() {
  if (typeof policeRecordScore === "undefined") return 1;
  if (policeRecordScore < -100) return 3;
  if (policeRecordScore < -70) return 2;
  return 1;
}
function _policeShipType() {
  var rules =
    typeof POLITICS_TRADE_RULES !== "undefined" && window._encounterSystem
      ? POLITICS_TRADE_RULES[window._encounterSystem]
      : null;
  var lvl = rules ? rules.occurrencePolice : 3;
  if (lvl < 2) return 1;
  if (lvl < 4) return 2;
  if (lvl < 6) return 3;
  return 4;
}
function _determinePoliceSubtype() {
  if (typeof policeRecordScore === "undefined") return "inspection";
  if (policeRecordScore >= -5 && policeRecordScore < 0) {
    if (window._inspected) return "ignore";
    return "inspection";
  }
  if (policeRecordScore >= 0 && policeRecordScore < 5) {
    if (!window._inspected && Math.floor(Math.random() * 10) < 1) {
      return "inspection";
    }
    return "ignore";
  }
  if (policeRecordScore >= 5) {
    if (!window._inspected && Math.floor(Math.random() * 40) === 0) {
      return "inspection";
    }
    return "ignore";
  }
  var policeHaveWeapons =
    window._enemyWeapons && window._enemyWeapons.length > 0;
  var repScore =
    typeof gameReputationScore !== "undefined" ? gameReputationScore : 0;
  var policeType = _policeShipType();
  var playerType = _shipScale.sizeOf(
    typeof playerShip !== "undefined" ? playerShip.name : "Flea",
  );
  var result;
  if (!policeHaveWeapons) {
    result = "flee";
  } else if (repScore < 40) {
    result = "attack";
  } else if (
    Math.floor(Math.random() * 1500) > Math.floor(repScore / (1 + policeType))
  ) {
    result = "attack";
  } else {
    result = "flee";
  }
  if (result === "flee" && policeType > playerType) {
    result = policeHaveWeapons ? "attack" : "inspection";
  }
  return result;
}
function _updateStatusBars() {
  var pHull = document.getElementById("travel-hull-player");
  var eHull = document.getElementById("travel-hull-enemy");
  var pShield = document.getElementById("travel-shield-player");
  var eShield = document.getElementById("travel-shield-enemy");
  var inEncounter = enemyEl.classList.contains("show");
  if (pHull) {
    if (inEncounter) pHull.classList.add("visible");
    var maxH = typeof maxHull === "function" ? maxHull() : 100;
    var cur =
      typeof playerShip !== "undefined" && playerShip.hull != null
        ? playerShip.hull
        : maxH;
    var pct = Math.round((cur / maxH) * 100);
    pHull.querySelector(".travel-hull-fill").style.width = pct + "%";
    pHull.querySelector(".travel-hull-text").textContent = pct + "%";
  }
  if (eHull) {
    var eMax = window._enemyMaxHull || 100;
    var eCur = window._enemyHull != null ? window._enemyHull : eMax;
    var ePct = Math.round((eCur / eMax) * 100);
    eHull.querySelector(".travel-hull-fill").style.width = ePct + "%";
    eHull.querySelector(".travel-hull-text").textContent = ePct + "%";
  }
  if (pShield) {
    var has =
      typeof playerShip !== "undefined" &&
      playerShip.shields &&
      playerShip.shields.length > 0;
    if (has && !_hasCloak()) {
      if (inEncounter) pShield.classList.add("visible");
      var maxSh = window._playerShieldMax || 1;
      var pct = Math.round(((window._playerShieldHp || 0) / maxSh) * 100);
      pShield.querySelector(".travel-shield-fill").style.width = pct + "%";
      pShield.querySelector(".travel-shield-text").textContent = pct + "%";
    } else {
      pShield.classList.remove("visible");
    }
  }
  if (eShield) {
    var has = window._enemyShields && window._enemyShields.length > 0;
    if (has) {
      if (inEncounter) eShield.classList.add("visible");
      var maxSh = window._enemyShieldMax || 1;
      var pct = Math.round(((window._enemyShieldHp || 0) / maxSh) * 100);
      eShield.querySelector(".travel-shield-fill").style.width = pct + "%";
      eShield.querySelector(".travel-shield-text").textContent = pct + "%";
    } else {
      eShield.classList.remove("visible");
    }
  }
}
window._updateStatusBars = _updateStatusBars;
function _pickEnemyShip(type) {
  if (window._manhuntSpawnNow) {
    window._manhuntSpawnNow = false;
    window._isManhuntEnemy = true;
    var suspectName = null;
    var manhuntLoadout = null;
    if (typeof getActiveManhuntMission === "function") {
      var pm = getActiveManhuntMission(window._manhuntStar);
      if (pm && pm.suspect) suspectName = pm.suspect;
      if (pm && pm.suspectWeapons) {
        manhuntLoadout = {
          weapons: pm.suspectWeapons || [],
          shields: pm.suspectShields || [],
          gadgets: pm.suspectGadgets || [],
          fighter: pm.suspectFighter,
          pilot: pm.suspectPilot,
          engineer: pm.suspectEngineer,
        };
      }
    }
    return { name: suspectName || "Gnat", tries: 1, loadout: manhuntLoadout };
  }
  if (window._heroSpawnNow) {
    window._heroSpawnNow = false;
    window._isHeroEnemy = true;
    var heroName = null;
    var heroLoadout = null;
    if (typeof getActiveHeroMission === "function") {
      var hm = getActiveHeroMission(window._heroStar);
      if (hm && hm.heroType) heroName = hm.heroType;
      if (hm && hm.heroLoadouts && hm.heroLoadouts.length > 0) {
        var killedCount = Math.min(
          hm.heroDestroyed || 0,
          hm.heroLoadouts.length - 1,
        );
        var idx = killedCount;
        var ld = hm.heroLoadouts[idx];
        heroLoadout = {
          weapons: ld.weapons || [],
          shields: ld.shields || [],
          gadgets: ld.gadgets || [],
          fighter: ld.fighter,
          pilot: ld.pilot,
          engineer: ld.engineer,
        };
      }
    }
    return { name: heroName || "Mantis", tries: 1, loadout: heroLoadout };
  }
  window._isManhuntEnemy = false;
  window._isHeroEnemy = false;
  if (type === "police") {
    var rec = typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
    var tries = 1;
    if (rec < -70) {
      tries = 3;
    }
    return { name: "Police", tries: tries };
  }
  var roleKey = type === "pirate" ? "pirate" : "trader";
  var tries;
  if (type === "pirate") {
    tries =
      1 +
      Math.floor(
        (typeof playerCredits !== "undefined" ? playerCredits : 0) / 100000,
      );
  } else {
    tries =
      1 +
      Math.floor(
        (typeof playerCredits !== "undefined" ? playerCredits : 0) / 200000,
      );
  }
  tries = Math.max(1, Math.min(tries, 8));
  if (type === "pirate" && Math.random() < SPECIAL_PIRATE_CHANCE) {
    return {
      name: SPECIAL_PIRATE_SHIPS[
        Math.floor(Math.random() * SPECIAL_PIRATE_SHIPS.length)
      ],
      tries: tries,
    };
  }
  var eligible = _shipPool.filter(function (s) {
    return s[roleKey] === true;
  });
  var totalFreq = 0;
  eligible.forEach(function (s) {
    totalFreq += s.freq;
  });
  var best = null;
  for (var t = 0; t < tries; t++) {
    var roll = Math.floor(Math.random() * totalFreq);
    var cum = 0;
    for (var i = 0; i < eligible.length; i++) {
      cum += eligible[i].freq;
      if (roll < cum) {
        var picked = eligible[i];
        if (
          !best ||
          (SHIP_STATS[picked.name] ? SHIP_STATS[picked.name].hull : 0) >
            (SHIP_STATS[best.name] ? SHIP_STATS[best.name].hull : 0)
        ) {
          best = picked;
        }
        break;
      }
    }
  }
  return { name: best ? best.name : "Gnat", tries: tries };
}
function spawnEncounter(type) {
  clearTravelMsg();
  _encEpoch++;
  window._actionInProgress = false;
  window._isEscaping = false;
  window._attackMsgShown = false;
  window._attackStarted = false;
  window._enemyType = type;
  window._encounterSystem = _destSystem;
  window._enemyOutcomeDecided = false;
  window._isEnemyFleeing = false;
  window._enemyNoWeaponResponded = false;
  window._decloaked = false;
  bottomBtns.classList.add("hidden");
  var picked = _pickEnemyShip(type);
  var shipName = picked.name;
  _equipEnemyShip(shipName, picked.tries, picked.loadout);
  if (
    type === "police" &&
    typeof window._policeEncounterSubtype === "undefined"
  ) {
    window._policeEncounterSubtype = _determinePoliceSubtype();
  } else if (type !== "police") {
    window._policeEncounterSubtype = undefined;
  }
  if (
    type === "police" &&
    (window._policeEncounterSubtype === "ignore" ||
      (window._policeEncounterSubtype === "inspection" && window._inspected))
  ) {
    window._policeEncounterSubtype = undefined;
    window._encounterSystem = null;
    window._enemyWeapons = [];
    window._enemyShields = [];
    window._enemyGadgets = [];
    window._enemyCargo = {};
    window._isEnemyFleeing = false;
    window._enemyOutcomeDecided = false;
    window._warpPaused = false;
    return;
  }
  var msg;
  var typeName = window._isManhuntEnemy ? "suspect" : window._isHeroEnemy ? "alien" : type === "pirate" ? "pirate" : type === "police" ? "police" : "trader";
  var cloakFailed =
    type !== "trader" &&
    typeof playerShip !== "undefined" &&
    playerShip.gadgets &&
    playerShip.gadgets.indexOf("Cloaking device") !== -1 &&
    !window._decloaked &&
    typeof window._enemyEngineer === "number" &&
    engineerSkillTotal() <= window._enemyEngineer;
  if (_hasCloak()) {
    msg = "The " + typeName + " ignores your presence";
  } else if (cloakFailed) {
    msg = "The " + typeName + " pierces your cloak";
  } else if (type === "police") {
    if (window._policeEncounterSubtype === "flee") {
      msg = "The police flee";
    } else {
      msg =
        window._policeEncounterSubtype === "attack"
          ? typeof policeRecordScore !== "undefined" && policeRecordScore > -30
            ? "The police hail you to surrender!"
            : "The police intercept you"
          : "The police stop you for an inspection";
    }
  } else {
    msg = window._isManhuntEnemy
      ? "The suspect ship has been spotted"
      : window._isHeroEnemy
        ? "An alien ship blocks your way!"
        : type === "pirate"
            ? "A pirate blocks your way!"
          : type === "trader"
            ? _isPoliceShip()
              ? "You hail the trader for an inspection"
              : "A trader has an offer for you"
            : "";
  }
  if (msg) showTravelMsg(msg, true);
  enemyEl.style.transition = "";
  enemyEl.style.transform = "";
  enemyEl.style.opacity = "";
  _updateStatusBars();
  var pn = document.getElementById("travel-name-player");
  if (pn) pn.classList.remove("hidden");
  document.getElementById("travel-hull-enemy").classList.add("visible");
  var wd = document.querySelector("#travel-scene .warp-drive");
  if (wd) wd.style.opacity = "0";
  var ep = _shipScale.px(shipName);
  enemyEl.style.width = ep + "px";
  enemyEl.style.height = ep + "px";
  if (type === "police" && window._policeEncounterSubtype === "inspection") {
    window._inspected = true;
  }
  if (typeof shipSvgFor === "function") {
    shipSvgFor(shipName).then(function (svg) {
      if (!svg) {
        return;
      }
      var existing = enemyEl.querySelector("svg");
      if (existing) existing.remove();
      enemyEl.insertAdjacentHTML("afterbegin", svg);
      enemyEl.classList.remove("hidden");
      enemyEl.style.opacity = "";
      enemyEl.style.transition = "";
      void enemyEl.offsetHeight;
      enemyEl.classList.add("show");
      _updateStatusBars();
      enemyEl.classList.toggle("police", type === "police");
      encounterBtns.classList.remove("hidden");
      showTypeLabel(type);
      bottomBtns.classList.remove("hidden");
      var statsLabel = document.getElementById("travel-stats-label");
      if (statsLabel) {
        var recIcon = ICON_RECORD.replace(/#00ff88/g, "#6cf");
        var repIcon = ICON_REP.replace(/#00ff88/g, "#6cf");
        statsLabel.innerHTML =
          recIcon +
          '<span class="pilot-record"></span>' +
          repIcon +
          '<span class="pilot-rep"></span>';
        statsLabel.classList.remove("hidden");
        if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
      }
      var policeActions =
        type === "police"
          ? window._policeEncounterSubtype === "attack"
            ? ["attack", "flee", "surrender"]
            : window._policeEncounterSubtype === "flee"
              ? ["ignore"]
              : hasIllegalCargo()
                ? ["attack", "flee", "submit", "bribe"]
                : ["attack", "flee", "submit"]
          : null;
      var traderPoliceActions =
        type === "trader" && _isPoliceShip() ? ["attack", "ignore", "inspect"] : null;
      showActions(
        _hasCloak()
          ? ["ignore", "decloak"]
          : traderPoliceActions ||
              policeActions ||
              _encounterActions[type] || ["attack", "flee"],
      );
      if (typeof window._updateAttackBtn === "function")
        window._updateAttackBtn();
      var playerShipEl = document.getElementById("travel-ship");
      if (playerShipEl) {
        if (_hasCloak()) playerShipEl.classList.add("cloak-active");
        else playerShipEl.classList.remove("cloak-active");
      }
    });
  }
}
