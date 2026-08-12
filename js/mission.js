// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

let missionPageIdx = 0;
let missionAnimating = false;
let missionProcPageIdx = 0;
let missionPolicePageIdx = 0;
let missionRidePageIdx = 0;
let missionHeroPageIdx = 0;
let missionDeliverPageIdx = 0;
const MISSION_PER_PAGE = 4;
const MISSION_SAVE_KEY = "stc_missions";
let procMissions = [];
let activeMissions = [];
function getMissionSectionType() {
  if (missionPageIdx === 1) return "manhunt";
  if (missionPageIdx === 2) return "hero";
  if (missionPageIdx === 3) return "ride";
  if (missionPageIdx === 4) return "deliver";
  return null;
}
function getMissionCards() {
  if (missionPageIdx === 0) return activeMissions.slice();
  const st = getMissionSectionType();
  return procMissions.filter(
    (m) =>
      !m.active &&
      !m.completed &&
      !m.cancelled &&
      m.pickupStarName === currentStar.name &&
      m.type === st,
  );
}
function getMissionPageIdx() {
  if (missionPageIdx === 1) return missionPolicePageIdx;
  if (missionPageIdx === 2) return missionHeroPageIdx;
  if (missionPageIdx === 3) return missionRidePageIdx;
  if (missionPageIdx === 4) return missionDeliverPageIdx;
  return missionProcPageIdx;
}
function setMissionPageIdx(idx) {
  if (missionPageIdx === 1) missionPolicePageIdx = idx;
  else if (missionPageIdx === 2) missionHeroPageIdx = idx;
  else if (missionPageIdx === 3) missionRidePageIdx = idx;
  else if (missionPageIdx === 4) missionDeliverPageIdx = idx;
  else missionProcPageIdx = idx;
}
function updateMissionSidebar() {
  const procBtn = document.getElementById("btn-mission-proc");
  const policeBtn = document.getElementById("btn-mission-police");
  const rideBtn = document.getElementById("btn-mission-ride");
  const heroBtn = document.getElementById("btn-mission-hero");
  const deliverBtn = document.getElementById("btn-mission-deliver");
  if (procBtn) procBtn.disabled = missionPageIdx === 0;
  if (policeBtn) policeBtn.disabled = missionPageIdx === 1;
  if (rideBtn) rideBtn.disabled = missionPageIdx === 3;
  if (heroBtn) heroBtn.disabled = missionPageIdx === 2;
  if (deliverBtn) deliverBtn.disabled = missionPageIdx === 4;
}
function getAvailableQuarters() {
  if (typeof SHIP_STATS === "undefined" || typeof playerShip === "undefined")
    return 0;
  const total = SHIP_STATS[playerShip.name].quarters;
  const hired =
    typeof window.CREW_NAMES !== "undefined"
      ? window.CREW_NAMES.filter((c) => c.hired).length
      : 0;
  const usedQuarters = activeMissions
    .filter((m) => m.type === "ride")
    .reduce((sum, m) => sum + (m.quartersRequired || 1), 0);
  return total - hired - usedQuarters;
}
function getAvailableCargoBays() {
  if (typeof SHIP_STATS === "undefined" || typeof playerShip === "undefined")
    return 0;
  const cap =
    SHIP_STATS[playerShip.name].cargo +
    (playerShip.gadgets || []).filter((g) => g === "5 extra cargo bays").length *
      5;
  let used = 0;
  if (
    typeof TRADE_ITEMS !== "undefined" &&
    typeof playerCargo !== "undefined"
  ) {
    TRADE_ITEMS.forEach((ti) => {
      used += playerCargo[ti.id] || 0;
    });
  }
  return cap - used;
}
function generateProcMissions(star) {
  if (!stars || stars.length < 10 || !star) return;
  if (typeof ensureStarInventory === "function") ensureStarInventory(star);
  const missions = [];
  const destStars = stars.filter((s) => s !== star);
  if (destStars.length === 0) return;
  const activeRide = procMissions.filter(
    (m) => m.active && m.type === "ride",
  ).length;
  const existingRide = procMissions.filter(
    (m) =>
      m.pickupStarName === star.name &&
      !m.active &&
      !m.completed &&
      !m.cancelled &&
      m.type === "ride",
  ).length;
  const maxRide = 1 + Math.floor(Math.random() * 15) - activeRide - existingRide;
  if (maxRide > 0 && typeof CREW_PREFIXES !== "undefined") {
    const rideCount = Math.min(maxRide, destStars.length);
    const crewSet = new Set((window.CREW_NAMES || []).map((c) => c.name));
    const usedNames = new Set();
    for (let i = 0; i < rideCount; i++) {
      let name;
      let nameAttempts = 0;
      do {
        const p =
          CREW_PREFIXES[Math.floor(Math.random() * CREW_PREFIXES.length)];
        const s =
          CREW_SUFFIXES[Math.floor(Math.random() * CREW_SUFFIXES.length)];
        name = (p + s).charAt(0).toUpperCase() + (p + s).slice(1);
        nameAttempts++;
      } while (
        (crewSet.has(name) || usedNames.has(name)) &&
        nameAttempts < 100
      );
      if (crewSet.has(name) || usedNames.has(name)) continue;
      usedNames.add(name);
      let toStar = destStars[Math.floor(Math.random() * destStars.length)];
      let starAttempts = 0;
      while (toStar === star && starAttempts < 20) {
        toStar = destStars[Math.floor(Math.random() * destStars.length)];
        starAttempts++;
      }
      if (toStar === star) continue;
      const dist = travelDistance(star, toStar);
      const quartersRequired = 1 + Math.floor(Math.random() * 2);
      const reward = Math.floor(
        dist * (quartersRequired * 35 + 40) * (1 + dist / 200),
      );
      const finalReward = Math.max(reward, 200);
      missions.push({
        id: "ride_" + i + "_" + Date.now(),
        type: "ride",
        title: "Ride " + name + " to " + toStar.name,
        description:
          "Transport " +
          name +
          " from " +
          star.name +
          " to " +
          toStar.name +
          ". Distance: " +
          dist +
          " pc.",
        pickupStarName: star.name,
        deliveryStarName: toStar.name,
        passengerName: name,
        reward: finalReward,
        distance: dist,
        cargoRequired: 0,
        quartersRequired: quartersRequired,
        requiredRecord:
          dist <= 50 ? -5 : dist <= 100 ? -4 : 5,
        active: false,
        hasItem: false,
        completed: false,
      });
    }
  }
  const activeManhunt = procMissions.filter(
    (m) => m.active && m.type === "manhunt",
  ).length;
  const existingManhunt = procMissions.filter(
    (m) =>
      m.pickupStarName === star.name &&
      !m.active &&
      !m.completed &&
      !m.cancelled &&
      m.type === "manhunt",
  ).length;
  const maxManhunt = 1 + Math.floor(Math.random() * 15) - activeManhunt - existingManhunt;
  for (let i = 0; i < maxManhunt; i++) {
    let toStar = destStars[Math.floor(Math.random() * destStars.length)];
    let attempts = 0;
    while (toStar === star && attempts < 20) {
      toStar = destStars[Math.floor(Math.random() * destStars.length)];
      attempts++;
    }
    if (toStar === star) continue;
    const dist = travelDistance(star, toStar);
    const suspect = _pickManhuntSuspect();
    const loadout = _rollManhuntLoadout(suspect, 1);
    const reward = Math.max(
      Math.floor(
        dist * 80 +
          (600 + 400 + (loadout ? loadout.difficulty * 3.5 : 0)) *
            (1 + dist / 80),
      ),
      1000,
    );
    missions.push({
      id: "manhunt_" + i + "_" + Date.now(),
      type: "manhunt",
      title: "Manhunt to " + toStar.name,
      description:
        "Manhunt to " +
        toStar.name +
        ". Intercept and neutralize the suspect ship prowling the system. Distance: " +
        dist +
        " pc.",
      pickupStarName: star.name,
      manhuntStarName: toStar.name,
      suspect: suspect,
      suspectWeapons: loadout ? loadout.weapons : [],
      suspectShields: loadout ? loadout.shields : [],
      suspectGadgets: loadout ? loadout.gadgets : [],
      suspectFighter: loadout ? loadout.fighter : 1,
      suspectPilot: loadout ? loadout.pilot : 1,
      suspectEngineer: loadout ? loadout.engineer : 1,
      reward: reward,
      distance: dist,
      cargoRequired: 0,
      quartersRequired: 0,
      requiredRecord: 0,
      active: false,
      hasItem: false,
      completed: false,
    });
  }
  const activeHero = procMissions.filter(
    (m) => m.active && m.type === "hero",
  ).length;
  const existingHero = procMissions.filter(
    (m) =>
      m.pickupStarName === star.name &&
      !m.active &&
      !m.completed &&
      !m.cancelled &&
      m.type === "hero",
  ).length;
  const maxHero = 1 + Math.floor(Math.random() * 15) - activeHero - existingHero;
  for (let i = 0; i < maxHero; i++) {
    let toStar = destStars[Math.floor(Math.random() * destStars.length)];
    let attempts = 0;
    while (toStar === star && attempts < 20) {
      toStar = destStars[Math.floor(Math.random() * destStars.length)];
      attempts++;
    }
    if (toStar === star) continue;
    const dist = travelDistance(star, toStar);
    const heroType = Math.random() < 0.5 ? "Mantis" : "Scorp";
    const heroCount = 1 + Math.floor(Math.random() * 30);
    const heroLoadouts = [];
    let totalDifficulty = 0;
    for (let k = 0; k < heroCount; k++) {
      const lo = _rollManhuntLoadout(heroType, 1);
      heroLoadouts.push({
        weapons: lo ? lo.weapons : [],
        shields: lo ? lo.shields : [],
        gadgets: lo ? lo.gadgets : [],
        fighter: lo ? lo.fighter : 1,
        pilot: lo ? lo.pilot : 1,
        engineer: lo ? lo.engineer : 1,
      });
      totalDifficulty += lo ? lo.difficulty : 0;
    }
    const reward = Math.max(
      Math.floor(
        dist * 80 +
          (600 + heroCount * 800 + totalDifficulty * 1.5) * (1 + dist / 80),
      ),
      1000,
    );
    missions.push({
      id: "hero_" + i + "_" + Date.now(),
      type: "hero",
      title: "Destroy " + heroCount + " " + heroType + " ships",
      description:
        "Liberation of " +
        toStar.name +
        ". Destroy all " +
        heroType +
        " alien ships in the system and liberate it from the swarm. Distance: " +
        dist +
        " pc.",
      pickupStarName: star.name,
      heroStarName: toStar.name,
      heroType: heroType,
      heroCount: heroCount,
      heroDestroyed: 0,
      heroLoadouts: heroLoadouts,
      reward: reward,
      distance: dist,
      cargoRequired: 0,
      quartersRequired: 0,
      requiredRecord:
        heroCount <= 10 ? 10 : heroCount <= 20 ? 25 : 75,
      active: false,
      hasItem: false,
      completed: false,
    });
  }
  const existingDeliver = procMissions.filter(
    (m) =>
      m.pickupStarName === star.name &&
      !m.active &&
      !m.completed &&
      !m.cancelled &&
      m.type === "deliver",
  ).length;
  const buyable = [];
  if (typeof TRADE_ITEMS !== "undefined" && star.inventory) {
    for (const item of TRADE_ITEMS) {
      if (!item.illegal && (star.inventory[item.id] || 0) > 0) {
        buyable.push(item);
      }
    }
  }
  const maxDeliver = 1 + Math.floor(Math.random() * 15) - existingDeliver;
  for (let i = 0; i < maxDeliver && buyable.length > 0; i++) {
    let toStar = destStars[Math.floor(Math.random() * destStars.length)];
    let attempts = 0;
    while (toStar === star && attempts < 20) {
      toStar = destStars[Math.floor(Math.random() * destStars.length)];
      attempts++;
    }
    if (toStar === star) continue;
    const dist = travelDistance(star, toStar);
    const item = buyable[Math.floor(Math.random() * buyable.length)];
    const units = 10 + Math.floor(Math.random() * 61);
    const requiredRecord =
      units <= 30 ? -5 : units <= 50 ? -4 : 5;
    const reward = Math.max(
      Math.floor(dist * (units * 3 + 20) * (1 + dist / 200)),
      200,
    );
    missions.push({
      id: "deliver_" + i + "_" + Date.now(),
      type: "deliver",
      title: "Deliver " + item.name + " to " + toStar.name,
      description:
        "Transport " +
        units +
        " units of " +
        item.name +
        " from " +
        star.name +
        " to " +
        toStar.name +
        ". Distance: " +
        dist +
        " pc.",
      pickupStarName: star.name,
      deliveryStarName: toStar.name,
      cargoItem: item.id,
      cargoUnits: units,
      reward: reward,
      distance: dist,
      cargoRequired: units,
      quartersRequired: 0,
      requiredRecord: requiredRecord,
      active: false,
      hasItem: false,
      completed: false,
    });
  }
  for (let i = missions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [missions[i], missions[j]] = [missions[j], missions[i]];
  }
  procMissions.push(...missions);
  saveMissionState();
}
function saveMissionState() {
  const data = {
    procMissions: procMissions
      .filter((m) => !m.completed)
      .map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        pickupStarName: m.pickupStarName,
        deliveryStarName: m.deliveryStarName,
        passengerName: m.passengerName,
        manhuntStarName: m.manhuntStarName,
        heroStarName: m.heroStarName,
        heroType: m.heroType,
        heroCount: m.heroCount,
        heroDestroyed: m.heroDestroyed,
        heroLoadouts: m.heroLoadouts,
        suspect: m.suspect,
        suspectWeapons: m.suspectWeapons,
        suspectShields: m.suspectShields,
        suspectGadgets: m.suspectGadgets,
        suspectFighter: m.suspectFighter,
        suspectPilot: m.suspectPilot,
        suspectEngineer: m.suspectEngineer,
        reward: m.reward,
        distance: m.distance,
        quartersRequired: m.quartersRequired,
        cargoRequired: m.cargoRequired,
        cargoItem: m.cargoItem,
        cargoUnits: m.cargoUnits,
        requiredRecord: m.requiredRecord,
        active: m.active || false,
        completed: m.completed || false,
        cancelled: m.cancelled || false,
      })),
  };
  localStorage.setItem(MISSION_SAVE_KEY, JSON.stringify(data));
}
function loadMissionState() {
  const raw = localStorage.getItem(MISSION_SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (data.procMissions) {
      procMissions = data.procMissions;
      procMissions.forEach(function (m) {
        if (m.type === "patrol") {
          m.type = "manhunt";
          if (m.patrolStarName && !m.manhuntStarName) {
            m.manhuntStarName = m.patrolStarName;
            delete m.patrolStarName;
          }
        }
      });
      procMissions.forEach(function (m) {
        if (m.type === "manhunt" && !m.suspect)
          m.suspect = _pickManhuntSuspect();
        if (m.type === "manhunt" && !m.suspectWeapons) {
          var lo = _rollManhuntLoadout(m.suspect || "Gnat", 1);
          m.suspectWeapons = lo.weapons;
          m.suspectShields = lo.shields;
          m.suspectGadgets = lo.gadgets;
          m.suspectFighter = lo.fighter;
          m.suspectPilot = lo.pilot;
          m.suspectEngineer = lo.engineer;
        }
        if (m.type !== "manhunt" && m.requiredRecord === 0)
          m.requiredRecord = -4;
        if (m.type === "hero") {
          if (!m.heroCount)
            m.heroCount = m.heroLoadouts ? m.heroLoadouts.length : 1;
          if (m.heroDestroyed == null) {
            if (m.heroRemaining != null) {
              m.heroDestroyed = Math.max(0, m.heroCount - m.heroRemaining);
              delete m.heroRemaining;
            } else {
              m.heroDestroyed = 0;
            }
          }
          if (m.requiredRecord == null) m.requiredRecord = 75;
          if (!m.heroLoadouts || m.heroLoadouts.length === 0) {
            m.heroLoadouts = [];
            for (var hk = 0; hk < m.heroCount; hk++) {
              var hlo = _rollManhuntLoadout(m.heroType || "Mantis", 1);
              m.heroLoadouts.push({
                weapons: hlo.weapons,
                shields: hlo.shields,
                gadgets: hlo.gadgets,
                fighter: hlo.fighter,
                pilot: hlo.pilot,
                engineer: hlo.engineer,
              });
            }
          }
        }
      });
    }
    activeMissions = procMissions.filter((m) => m.active);
    if (typeof lockedCargo !== "undefined") {
      lockedCargo = {};
      activeMissions.forEach(function (m) {
        if (m.type === "deliver" && m.cargoItem != null) {
          lockedCargo[m.cargoItem] =
            (lockedCargo[m.cargoItem] || 0) + (m.cargoUnits || 0);
        }
      });
    }
    return true;
  } catch {
    return false;
  }
}
function resetMissionState() {
  localStorage.removeItem(MISSION_SAVE_KEY);
  procMissions = [];
  activeMissions = [];
}
let _missionCancelBatch = null;
function beginMissionCancelBatch() {
  if (!_missionCancelBatch) _missionCancelBatch = [];
}
function sendMissionCancelBatchMail() {
  if (!_missionCancelBatch || _missionCancelBatch.length === 0) {
    _missionCancelBatch = null;
    return;
  }
  const items = _missionCancelBatch;
  _missionCancelBatch = null;
  if (typeof addMailMessage !== "function") return;
  const single = items.length === 1;
  const body =
    `<div class="mail-msg-intro">The following active contract${single ? "" : "s"} ${single ? "has" : "have"} been cancelled:</div>` +
    items
      .map((e) => `<div class="mail-msg-item">- ${e.title}${e.reason ? ` (${e.reason})` : ""}</div>`)
      .join("") +
    `<div class="mail-msg-note">Reputation penalty: <span class="c-red">-${items.length}</span></div>`;
  addMailMessage(single ? "Contract Cancelled" : "Contracts Cancelled", body);
}
function clearMissionsOnDeath(skipRepPenalty) {
  if (activeMissions.length > 0 && typeof addMailMessage === "function") {
    const single = activeMissions.length === 1;
    const body =
      `<div class="mail-msg-intro">All active contract${single ? "" : "s"} ${single ? "has" : "have"} been cancelled:</div>` +
      activeMissions
        .map((m) => `<div class="mail-msg-item">- ${m.title}</div>`)
        .join("");
    addMailMessage(single ? "Contract Cancelled" : "Contracts Cancelled", body);
  }
  const cancelCount = activeMissions.length;
  activeMissions.forEach(function (m) {
    m.active = false;
    m.hasItem = false;
    m.completed = false;
    m.cancelled = true;
  });
  if (!skipRepPenalty && typeof gameReputationScore !== "undefined")
    gameReputationScore = Math.max(-100, gameReputationScore - cancelCount);
  if (!skipRepPenalty && typeof updatePoliceDisplay === "function")
    updatePoliceDisplay();
  if (!skipRepPenalty) _flashStatDelta("pilot-rep", -cancelCount);
  if (typeof saveState === "function") saveState();
  activeMissions = [];
  if (typeof lockedCargo !== "undefined") {
    lockedCargo = {};
  }
  saveMissionState();
  if (typeof updateMissionLocation === "function") updateMissionLocation();
  if (
    typeof missionOverlay !== "undefined" &&
    !missionOverlay.classList.contains("hidden") &&
    typeof renderMissionPages === "function"
  )
    renderMissionPages();
}
function acceptMission(id) {
  const mission = procMissions.find((m) => m.id === id);
  if (!mission || mission.active || mission.completed) return;
  const recScore =
    typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  if (mission.type !== "manhunt" && recScore < (mission.requiredRecord || 0))
    return;
  if (mission.type === "ride") {
    if (getAvailableQuarters() < (mission.quartersRequired || 1)) return;
  } else if (mission.type === "deliver") {
    if (getAvailableCargoBays() < (mission.cargoRequired || 1)) return;
  } else if (mission.type === "manhunt") {
    if (typeof playerShip === "undefined" || playerShip.name !== "Police")
      return;
  }
  mission.active = true;
  mission.hasItem = true;
  activeMissions.push(mission);
  if (mission.type === "deliver") {
    playerCargo[mission.cargoItem] =
      (playerCargo[mission.cargoItem] || 0) + mission.cargoUnits;
    if (typeof lockedCargo !== "undefined") {
      lockedCargo[mission.cargoItem] =
        (lockedCargo[mission.cargoItem] || 0) + mission.cargoUnits;
    }
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof updateCargoDisplay === "function") updateCargoDisplay();
  }
  saveMissionState();
  missionPageIdx = 0;
  const targetPage = Math.max(
    0,
    Math.floor((activeMissions.length - 1) / MISSION_PER_PAGE),
  );
  if (
    typeof missionProcGoTo === "function" &&
    !missionAnimating &&
    targetPage !== getMissionPageIdx()
  ) {
    missionProcGoTo(targetPage);
  } else {
    setMissionPageIdx(targetPage);
    renderMissionPages();
  }
  updateMissionLocation();
}
function cancelExcessRideMissions(reason) {
  if (typeof SHIP_STATS === "undefined" || typeof playerShip === "undefined")
    return;
  const total = SHIP_STATS[playerShip.name].quarters;
  const hired =
    typeof window.CREW_NAMES !== "undefined"
      ? window.CREW_NAMES.filter((c) => c.hired).length
      : 0;
  let available = total - hired;
  const rideMissions = activeMissions.filter((m) => m.type === "ride");
  for (const m of rideMissions) {
    const needed = m.quartersRequired || 1;
    if (available >= needed) {
      available -= needed;
    } else {
      cancelActiveMission(m.id, reason);
    }
  }
}
function cancelExcessHeroMissions(reason) {
  if (typeof playerShip === "undefined") return;
  if (playerShip.weapons && playerShip.weapons.length > 0) return;
  for (let i = activeMissions.length - 1; i >= 0; i--) {
    const m = activeMissions[i];
    if (m.type === "hero") {
      cancelActiveMission(m.id, reason);
    }
  }
}
function cancelExcessManhuntMissions(reason) {
  if (typeof playerShip === "undefined") return;
  if (playerShip.name === "Police" && playerShip.weapons && playerShip.weapons.length > 0) return;
  for (let i = activeMissions.length - 1; i >= 0; i--) {
    const m = activeMissions[i];
    if (m.type === "manhunt") {
      cancelActiveMission(m.id, reason);
    }
  }
}
function cancelActiveMission(id, reason) {
  const idx = activeMissions.findIndex((m) => m.id === id);
  if (idx === -1) return;
  const mission = activeMissions[idx];
  if (mission.type === "deliver") {
    playerCargo[mission.cargoItem] =
      (playerCargo[mission.cargoItem] || 0) - mission.cargoUnits;
    if (playerCargo[mission.cargoItem] <= 0)
      delete playerCargo[mission.cargoItem];
    if (typeof lockedCargo !== "undefined") {
      lockedCargo[mission.cargoItem] =
        (lockedCargo[mission.cargoItem] || 0) - mission.cargoUnits;
      if (lockedCargo[mission.cargoItem] <= 0)
        delete lockedCargo[mission.cargoItem];
    }
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof updateCargoDisplay === "function") updateCargoDisplay();
  }
  mission.active = false;
  mission.hasItem = false;
  mission.completed = false;
  mission.cancelled = true;
  if (_missionCancelBatch && reason) {
    _missionCancelBatch.push({ title: mission.title, reason: reason });
  }
  activeMissions.splice(idx, 1);
  if (typeof gameReputationScore !== "undefined")
    gameReputationScore = Math.max(-100, gameReputationScore - 1);
  if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
  _flashStatDelta("pilot-rep", -1);
  if (typeof saveState === "function") saveState();
  saveMissionState();
  renderMissionPages();
  updateMissionLocation();
}
function checkMissionCompletion() {
  if (!currentStar || activeMissions.length === 0) return;
  if (typeof checkDeliverCargoIntegrity === "function")
    checkDeliverCargoIntegrity();
  for (let i = activeMissions.length - 1; i >= 0; i--) {
    const m = activeMissions[i];
    if (m.deliveryStarName === currentStar.name && m.hasItem) {
      m.hasItem = false;
      m.completed = true;
      m.active = false;
      playerCredits += m.reward;
      gameMissionsCompleted++;
      if (typeof gameReputationScore !== "undefined")
        gameReputationScore += 1;
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
      if (typeof saveState === "function") saveState();
      if (m.type === "deliver") {
        playerCargo[m.cargoItem] =
          (playerCargo[m.cargoItem] || 0) - m.cargoUnits;
        if (playerCargo[m.cargoItem] <= 0)
          delete playerCargo[m.cargoItem];
        if (typeof lockedCargo !== "undefined") {
          lockedCargo[m.cargoItem] =
            (lockedCargo[m.cargoItem] || 0) - m.cargoUnits;
          if (lockedCargo[m.cargoItem] <= 0)
            delete lockedCargo[m.cargoItem];
        }
      }
      activeMissions.splice(i, 1);
      saveMissionState();
      saveTradeState();
      if (typeof updateCargoDisplay === "function") updateCargoDisplay();
      updateMissionLocation();
      if (typeof addMailMessage === "function") {
        if (m.type === "ride") {
          addMailMessage(
            "Contract Completed",
            `${m.passengerName} has been dropped off at ${m.deliveryStarName}. Reward: ${m.reward.toLocaleString()} cr.`,
          );
        } else if (m.type === "deliver") {
          const itemName =
            typeof TRADE_ITEMS !== "undefined" &&
            TRADE_ITEMS[m.cargoItem] != null
              ? TRADE_ITEMS[m.cargoItem].name
              : "Cargo";
          addMailMessage(
            "Contract Completed",
            `Delivered ${m.cargoUnits || 1}x ${itemName} to ${m.deliveryStarName}. Reward: ${m.reward.toLocaleString()} cr.`,
          );
        }
      }
    }
  }
}
function checkDeliverCargoIntegrity(reason) {
  if (typeof playerCargo === "undefined" || typeof lockedCargo === "undefined")
    return;
  for (let i = activeMissions.length - 1; i >= 0; i--) {
    const m = activeMissions[i];
    if (m.type !== "deliver") continue;
    const held = playerCargo[m.cargoItem] || 0;
    const locked = lockedCargo[m.cargoItem] || 0;
    if (held < (m.cargoRequired || 1) || locked < (m.cargoRequired || 1)) {
      lockedCargo[m.cargoItem] = Math.max(
        0,
        locked - (m.cargoUnits || 0),
      );
      if (lockedCargo[m.cargoItem] <= 0) delete lockedCargo[m.cargoItem];
      const otherLock = lockedCargo[m.cargoItem] || 0;
      const keepQty = Math.min(held, otherLock);
      if (keepQty > 0) {
        playerCargo[m.cargoItem] = keepQty;
        if (
          typeof playerCargoBuyPrice !== "undefined" &&
          playerCargoBuyPrice[m.cargoItem] != null &&
          held > 0
        ) {
          playerCargoBuyPrice[m.cargoItem] = Math.floor(
            (playerCargoBuyPrice[m.cargoItem] * keepQty) / held,
          );
        }
      } else {
        delete playerCargo[m.cargoItem];
        if (typeof playerCargoBuyPrice !== "undefined")
          delete playerCargoBuyPrice[m.cargoItem];
      }
      if (_missionCancelBatch) {
        _missionCancelBatch.push({ title: m.title, reason: reason || "insufficient cargo" });
      }
      m.active = false;
      m.completed = false;
      m.cancelled = true;
      activeMissions.splice(i, 1);
      saveMissionState();
      saveTradeState();
      var repBeforeMission =
        typeof gameReputationScore !== "undefined" ? gameReputationScore : null;
      if (typeof gameReputationScore !== "undefined")
        gameReputationScore = Math.max(-100, gameReputationScore - 1);
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
      _flashStatDelta("pilot-rep", gameReputationScore - repBeforeMission);
      if (typeof saveState === "function") saveState();
      if (typeof updateMissionLocation === "function") updateMissionLocation();
      if (typeof updateCargoDisplay === "function") updateCargoDisplay();
    }
  }
}
const _manhuntSuspectPool = [
  "Flea", "Gnat", "Firefly", "Mosquito", "Bumblebee", "Beetle",
  "Hornet", "Grasshopper", "Termite", "Wasp", "Dragonfly", "Scarab",
].filter(function (n) {
  return SHIP_STATS[n] && SHIP_STATS[n].weapons > 0;
});
function _pickManhuntSuspect() {
  return _manhuntSuspectPool[
    Math.floor(Math.random() * _manhuntSuspectPool.length)
  ];
}
function _rollManhuntLoadout(shipName, tries) {
  var l =
    typeof window._rollEnemyLoadout === "function"
      ? window._rollEnemyLoadout(shipName, tries || 1)
      : { ws: [], ss: [], gs: [], fighter: 1, pilot: 1, engineer: 1 };
  var stats = SHIP_STATS[shipName];
  var weaponPower = 0;
  var shieldPower =
    typeof window._totalShieldPower === "function"
      ? window._totalShieldPower(l.ss)
      : 0;
  for (var i = 0; i < l.ws.length; i++)
    weaponPower += (window.WEAPON_DMG || {})[l.ws[i]] || 0;
  var difficulty =
    (stats ? stats.hull : 0) +
    weaponPower +
    shieldPower +
    l.fighter +
    l.pilot +
    l.engineer;
  return {
    weapons: l.ws,
    shields: l.ss,
    gadgets: l.gs,
    fighter: l.fighter,
    pilot: l.pilot,
    engineer: l.engineer,
    difficulty: difficulty,
  };
}
function getActiveManhuntStar(destName, originName) {
  const m = activeMissions.find(
    (mm) =>
      mm.type === "manhunt" &&
      (mm.manhuntStarName === destName || mm.manhuntStarName === originName),
  );
  return m ? m.manhuntStarName : null;
}
function getActiveManhuntMission(starName) {
  return (
    activeMissions.find(
      (m) => m.type === "manhunt" && m.manhuntStarName === starName,
    ) || null
  );
}
function getActiveHeroStar(destName, originName) {
  const m = activeMissions.find(
    (mm) =>
      mm.type === "hero" &&
      (mm.heroStarName === destName || mm.heroStarName === originName),
  );
  return m ? m.heroStarName : null;
}
function getActiveHeroMission(starName) {
  return (
    activeMissions.find(
      (m) => m.type === "hero" && m.heroStarName === starName,
    ) || null
  );
}
function completeHeroMission(starName) {
  const idx = activeMissions.findIndex(
    (m) => m.type === "hero" && m.heroStarName === starName,
  );
  if (idx === -1) return;
  const mission = activeMissions[idx];
  mission.active = false;
  mission.completed = true;
  mission.hasItem = false;
  playerCredits += mission.reward;
  gameMissionsCompleted++;
  activeMissions.splice(idx, 1);
  saveMissionState();
  saveTradeState();
  updateMissionLocation();
  if (typeof addMailMessage === "function") {
    addMailMessage("Contract Completed", `Liberation of ${starName} completed. Reward: ${mission.reward.toLocaleString()} cr.`);
  }
  if (typeof renderMissionPages === "function") renderMissionPages();
}
function completeManhuntMission(starName) {
  const idx = activeMissions.findIndex(
    (m) => m.type === "manhunt" && m.manhuntStarName === starName,
  );
  if (idx === -1) return;
  const mission = activeMissions[idx];
  mission.active = false;
  mission.completed = true;
  mission.hasItem = false;
  playerCredits += mission.reward;
  gameMissionsCompleted++;
  activeMissions.splice(idx, 1);
  saveMissionState();
  saveTradeState();
  updateMissionLocation();
  if (typeof addMailMessage === "function") {
    addMailMessage("Contract Completed", `Manhunt to ${starName} completed. Reward: ${mission.reward.toLocaleString()} cr.`);
  }
  if (typeof renderMissionPages === "function") renderMissionPages();
}
function updateMissionLocation() {
  const el = document.getElementById("mission-location");
  if (!el) return;
  el.style.display = "";
  el.textContent = "Active: " + activeMissions.length;
}
function missionProcGoTo(targetIdx) {
  const allCards = getMissionCards();
  const maxPage = Math.max(
    0,
    Math.ceil(allCards.length / MISSION_PER_PAGE) - 1,
  );
  targetIdx = Math.max(0, Math.min(targetIdx, maxPage));
  if (targetIdx === getMissionPageIdx() || missionAnimating) return;
  const dir = targetIdx > getMissionPageIdx() ? 1 : -1;
  const steps = Math.abs(targetIdx - getMissionPageIdx());
  const slider = document.getElementById("mission-slider");
  if (!slider) return;
  const w = document.getElementById("mission-content").clientWidth;
  missionAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${-dir * w * steps}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    setMissionPageIdx(targetIdx);
    renderMissionPages();
    const newSlider = document.getElementById("mission-slider");
    if (!newSlider) {
      missionAnimating = false;
      return;
    }
    const inX = -(-dir * w * steps);
    newSlider.style.transition = "none";
    newSlider.style.transform = `translateX(${inX}px)`;
    void newSlider.offsetHeight;
    newSlider.style.transition = "transform 0.25s ease";
    newSlider.style.transform = "translateX(0)";
    newSlider.addEventListener("transitionend", function onSlideIn() {
      newSlider.removeEventListener("transitionend", onSlideIn);
      newSlider.style.transition = "";
      newSlider.style.transform = "";
      missionAnimating = false;
    });
  });
}
function missionProcSlide(dir) {
  const allCards = getMissionCards();
  const maxPage = Math.max(
    0,
    Math.ceil(allCards.length / MISSION_PER_PAGE) - 1,
  );
  const target = getMissionPageIdx() + dir;
  if (target < 0 || target > maxPage || missionAnimating) return;
  const slider = document.getElementById("mission-slider");
  if (!slider) return;
  const w = document.getElementById("mission-content").clientWidth;
  missionAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${-dir * w}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    setMissionPageIdx(target);
    renderMissionPages();
    const newSlider = document.getElementById("mission-slider");
    if (!newSlider) {
      missionAnimating = false;
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
      missionAnimating = false;
    });
  });
}
function renderMissionPages() {
  const sectionPages = [
    null,
    (() => {
      if (!stars || stars.length === 0)
        return `<div class="mission-page">No star data available.</div>`;
      const allCards = getMissionCards();
      const maxPage = Math.max(
        0,
        Math.ceil(allCards.length / MISSION_PER_PAGE) - 1,
      );
      if (getMissionPageIdx() > maxPage) setMissionPageIdx(maxPage);
      const start = getMissionPageIdx() * MISSION_PER_PAGE;
      const end = Math.min(start + MISSION_PER_PAGE, allCards.length);
      const pageCards = allCards.slice(start, end);
      let html = `<div class="mission-page">`;
      if (pageCards.length > 0) {
        html += `<div class="mission-list">`;
        for (const m of pageCards) {
          const isActive = m.active;
          const recScore =
            typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
          const recLabel =
            typeof getPoliceRecordLabel === "function"
              ? getPoliceRecordLabel(m.requiredRecord || 0)
              : "Clean";
          const meetsRecord =
            m.type === "manhunt" ? true : recScore >= (m.requiredRecord || 0);
          let meetsReq = true;
          if (m.type === "ride") {
            meetsReq = getAvailableQuarters() >= (m.quartersRequired || 1);
          } else if (m.type === "deliver") {
            meetsReq = isActive
              ? (playerCargo[m.cargoItem] || 0) >= (m.cargoRequired || 1)
              : getAvailableCargoBays() >= (m.cargoRequired || 1);
          } else if (m.type === "manhunt") {
            meetsReq =
              typeof playerShip !== "undefined" &&
              playerShip.name === "Police" &&
              playerShip.weapons &&
              playerShip.weapons.length > 0;
          } else if (m.type === "hero") {
            meetsReq =
              typeof playerShip !== "undefined" &&
              playerShip.weapons &&
              playerShip.weapons.length > 0;
          }
          const canAccept = meetsRecord && meetsReq;
          let cls = "mission-card-compact";
          if (isActive) cls += " active";
          if (!isActive && !canAccept) cls += " disabled";
          const rewardStr = m.reward.toLocaleString() + " cr";
          const distStr = m.distance + " pc";
          const reqCls = "profile-val" + (meetsReq ? "" : " unmet");
          const recordCls = "profile-val" + (meetsRecord ? "" : " unmet");
          let reqStr = "";
          if (m.type === "ride") {
            reqStr =
              'Required Crew Quarters: <span class="' +
              reqCls +
              '">' +
              (m.quartersRequired || 1) +
              "</span>";
          } else if (m.type === "deliver") {
            reqStr =
              'Required Cargo: <span class="' +
              reqCls +
              '">' +
              (m.cargoRequired || 1) +
              "</span>";
          }
          const recordStr =
            m.type === "manhunt"
              ? 'Required Ship: <span class="' + reqCls + '">Police - Armed</span>'
              : 'Required Record: <span class="' +
                recordCls +
                '">' +
                recLabel +
                " +</span>";
          const suspectStr =
            m.type === "manhunt"
              ? 'Suspect Ship: <span>' +
                (m.suspect || "Unknown") +
                "</span>"
              : m.type === "hero"
                ? 'Required Ship: <span class="' + reqCls + '">Any - Armed</span>'
                : "";
          const distLine = "Distance: <span>" + distStr + "</span>";
          const btnHtml = isActive
            ? `<button class="mission-toggle-btn mission-toggle-cancel" data-mid="${m.id}">${ICON_CLOSE}</button>`
            : `<button class="mission-toggle-btn mission-toggle-accept" data-mid="${m.id}"${canAccept ? "" : " disabled"}>${ICON_CHECK}</button>`;
          const routeBtnHtml =
            m.deliveryStarName || m.manhuntStarName || m.heroStarName
              ? `<button class="mission-toggle-btn mission-toggle-route">${ICON_WAYPOINTS}</button>`
              : "";
          html += `<div class="${cls}" data-dest="${m.deliveryStarName || m.manhuntStarName || m.heroStarName || ""}">
                        <div class="mission-card-compact-title">${m.title}</div>
                        ${reqStr ? `<div class="mission-card-compact-info"><span>${reqStr}</span></div>` : ""}
                        <div class="mission-card-compact-info"><span>${recordStr}</span></div>
                        ${suspectStr ? `<div class="mission-card-compact-info"><span>${suspectStr}</span></div>` : ""}
                        <div class="mission-card-compact-info"><span>${distLine}</span></div>
                        <span class="c-gold mission-card-reward">${rewardStr}</span>
                        ${routeBtnHtml}${btnHtml}
                    </div>`;
        }
        html += `</div>`;
      } else {
        html += `<div class="mission-empty">${
          missionPageIdx === 0
            ? "No active contracts"
            : "No available contracts<br>Return to this system later"
        }</div>`;
      }
      html += `</div>`;
      return html;
    })(),
  ];
  const content = sectionPages[1];
  const missionSliderEl = document.getElementById("mission-slider");
  if (!missionSliderEl) return;
  missionSliderEl.innerHTML = content;
  const titleEl = document.getElementById("mission-title");
  const titles = ["Contracts", "Contracts: Police", "Contracts: Hero", "Contracts: Ride", "Contracts: Deliver"];
  if (titleEl)
    titleEl.textContent = titles[missionPageIdx] || titles[0];
  updateMissionLocation();
  updateMissionSidebar();
  const prevBtn = document.getElementById("btn-mission-prev");
  const nextBtn = document.getElementById("btn-mission-next");
  if (prevBtn && nextBtn) {
    const allCards = getMissionCards();
    const maxPage = Math.max(
      0,
      Math.ceil(allCards.length / MISSION_PER_PAGE) - 1,
    );
    prevBtn.disabled = getMissionPageIdx() === 0;
    nextBtn.disabled = getMissionPageIdx() >= maxPage;
    prevBtn.style.visibility = "";
    nextBtn.style.visibility = "";
  }
  document.querySelectorAll(".mission-toggle-accept").forEach((btn) => {
    btn.addEventListener("click", () => acceptMission(btn.dataset.mid));
  });
  document.querySelectorAll(".mission-toggle-cancel").forEach((btn) => {
    btn.addEventListener("click", () => cancelActiveMission(btn.dataset.mid));
  });
  document.querySelectorAll(".mission-toggle-route").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".mission-card-compact");
      const destName = card ? card.dataset.dest : "";
      if (!destName || !stars) return;
      const star = stars.find((s) => s.name === destName);
      if (!star) return;
      selectedStar = star;
      if (typeof showRoute === "function") showRoute(star);
      hideMission();
    });
  });
  var missionCardDownX = 0,
    missionCardDownY = 0;
  document.querySelectorAll(".mission-card-compact").forEach((card) => {
    card.addEventListener("mousedown", (e) => {
      missionCardDownX = e.clientX;
      missionCardDownY = e.clientY;
    });
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      if (
        Math.hypot(e.clientX - missionCardDownX, e.clientY - missionCardDownY) >
        6
      )
        return;
      const destName = card.dataset.dest;
      if (!destName || !stars) return;
      const star = stars.find((s) => s.name === destName);
      if (!star) return;
      selectedStar = star;
      cameraTarget = { x: star.x, y: star.y, zoom: 15 };
      hideMission();
    });
  });
}
function goToMissionPage(targetIdx) {
  if (missionAnimating || targetIdx < 0 || targetIdx > 4 || targetIdx === missionPageIdx) return;
  const dir = targetIdx > missionPageIdx ? 1 : -1;
  const steps = Math.abs(targetIdx - missionPageIdx);
  const slider = document.getElementById("mission-slider");
  if (!slider) return;
  const w = document.getElementById("mission-content").clientWidth;
  const outX = -dir * w * steps;
  missionAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    missionPageIdx = targetIdx;
    renderMissionPages();
    const newSlider = document.getElementById("mission-slider");
    if (!newSlider) {
      missionAnimating = false;
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
      missionAnimating = false;
    });
  });
}
function renderMission() {
  document.getElementById("mission-sidebar").innerHTML =
    `<button id="btn-mission-proc"></button><button id="btn-mission-police"></button><button id="btn-mission-hero"></button><button id="btn-mission-ride"></button><button id="btn-mission-deliver"></button>`;
  const missionProcBtn = document.getElementById("btn-mission-proc");
  if (missionProcBtn) {
    missionProcBtn.innerHTML = ICON_MISSION;
    missionProcBtn.addEventListener("click", () => goToMissionPage(0));
  }
  const missionPoliceBtn = document.getElementById("btn-mission-police");
  if (missionPoliceBtn) {
    missionPoliceBtn.innerHTML = ICON_RECORD.replace(/#00ff88/g, "#00c8ff");
    missionPoliceBtn.addEventListener("click", () => goToMissionPage(1));
  }
  const missionRideBtn = document.getElementById("btn-mission-ride");
  if (missionRideBtn) {
    missionRideBtn.innerHTML = ICON_ROUTE;
    missionRideBtn.addEventListener("click", () => goToMissionPage(3));
  }
  const missionHeroBtn = document.getElementById("btn-mission-hero");
  if (missionHeroBtn) {
    missionHeroBtn.innerHTML = ICON_AWARD;
    missionHeroBtn.addEventListener("click", () => goToMissionPage(2));
  }
  const missionDeliverBtn = document.getElementById("btn-mission-deliver");
  if (missionDeliverBtn) {
    missionDeliverBtn.innerHTML = ICON_TRADE;
    missionDeliverBtn.addEventListener("click", () => goToMissionPage(4));
  }
  missionProcPageIdx = 0;
  missionPolicePageIdx = 0;
  missionRidePageIdx = 0;
  missionHeroPageIdx = 0;
  missionDeliverPageIdx = 0;
  document.getElementById("mission-content").innerHTML = `
        <div id="mission-header">
            <div id="mission-header-left">
                <span id="mission-title">Contracts</span>
                <span id="mission-location">Active: 0</span>
            </div>
            <div id="mission-header-right">
                <button id="btn-mission-prev"></button>
                <button id="btn-mission-next"></button>
                <button id="btn-mission-close"></button>
            </div>
        </div>
        <div id="mission-slider"></div>`;
  document.getElementById("btn-mission-prev").innerHTML = ICON_CHEVRON_LEFT;
  document.getElementById("btn-mission-next").innerHTML = ICON_CHEVRON_RIGHT;
  document.getElementById("btn-mission-close").innerHTML = ICON_CLOSE;
  document
    .getElementById("btn-mission-close")
    .addEventListener("click", hideMission);
  document.getElementById("btn-mission-prev").addEventListener("click", () => {
    missionProcSlide(-1);
  });
  document.getElementById("btn-mission-next").addEventListener("click", () => {
    missionProcSlide(1);
  });
  missionPageIdx = 0;
  updateMissionLocation();
  renderMissionPages();
}
function hideMission() {
  missionOverlay.classList.add("hidden");
  missionAnimating = false;
}
document.getElementById("btn-mission").addEventListener("click", () => {
  if (!missionOverlay.classList.contains("hidden")) {
    hideMission();
    return;
  }
  closeAllOverlays();
  renderMission();
  missionOverlay.classList.remove("hidden");
});
missionOverlay.addEventListener("click", (e) => {
  if (e.target === missionOverlay) {
    hideMission();
  }
});
function missionCanNavigate(dir) {
  const btn = document.getElementById(
    dir > 0 ? "btn-mission-next" : "btn-mission-prev",
  );
  return btn && !btn.disabled;
}
function missionSlideBack() {
  const slider = document.getElementById("mission-slider");
  if (!slider) return;
  slider.style.transition = "transform 0.2s ease";
  slider.style.transform = "translateX(0)";
  slider.addEventListener("transitionend", function onBack() {
    slider.removeEventListener("transitionend", onBack);
    slider.style.transition = "";
    slider.style.transform = "";
  });
}
let missionSwipeStartX = 0;
let missionSwipeActive = false;
const mp = document.getElementById("mission-panel");
function startMissionDrag(clientX) {
  if (missionAnimating) return false;
  missionSwipeStartX = clientX;
  missionSwipeActive = true;
  const slider = document.getElementById("mission-slider");
  if (slider) {
    slider.style.transition = "none";
    slider.style.transform = "";
  }
  return true;
}
function moveMissionDrag(clientX) {
  if (!missionSwipeActive) return;
  const slider = document.getElementById("mission-slider");
  if (!slider) return;
  const dx = clientX - missionSwipeStartX;
  slider.style.transform = `translateX(${dx}px)`;
}
function endMissionDrag(clientX) {
  if (!missionSwipeActive) return;
  missionSwipeActive = false;
  const dx = clientX - missionSwipeStartX;
  const w = document.getElementById("mission-panel").clientWidth;
  if (Math.abs(dx) > w * 0.25) {
    const dir = dx > 0 ? -1 : 1;
    if (missionCanNavigate(dir)) {
      missionProcSlide(dir);
    } else {
      missionSlideBack();
    }
  } else {
    missionSlideBack();
  }
}
mp.addEventListener(
  "touchstart",
  (e) => {
    startMissionDrag(e.touches[0].clientX);
  },
  { passive: true },
);
mp.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      missionSwipeActive = false;
      return;
    }
    moveMissionDrag(e.touches[0].clientX);
  },
  { passive: true },
);
mp.addEventListener("touchend", (e) => {
  endMissionDrag(e.changedTouches[0].clientX);
});
mp.addEventListener("touchcancel", () => {
  missionSwipeActive = false;
  missionSlideBack();
});
mp.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest("button")) return;
  startMissionDrag(e.clientX);
});
document.addEventListener("mousemove", (e) => {
  moveMissionDrag(e.clientX);
});
document.addEventListener("mouseup", (e) => {
  endMissionDrag(e.clientX);
});
