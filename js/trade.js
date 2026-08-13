// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const TRADE_ITEMS = [
  {
    id: 0,
    name: "Water",
    base: 30,
    inc: 3,
    tProd: 0,
    tTop: 3,
    illegal: false,
    statusEvent: STATUS_EVENTS.Drought,
    roundOff: 1,
    variance: 4,
    cheap: "SweetwaterOceans",
    expensive: "Desert",
  },
  {
    id: 1,
    name: "Furs",
    base: 250,
    inc: 10,
    tProd: 0,
    tTop: 1,
    illegal: false,
    statusEvent: STATUS_EVENTS.ColdSpell,
    roundOff: 5,
    variance: 10,
    cheap: "RichFauna",
    expensive: "Lifeless",
  },
  {
    id: 2,
    name: "Food",
    base: 100,
    inc: 5,
    tProd: 1,
    tTop: 2,
    illegal: false,
    statusEvent: STATUS_EVENTS.CropFailure,
    roundOff: 5,
    variance: 5,
    cheap: "RichSoil",
    expensive: "PoorSoil",
  },
  {
    id: 3,
    name: "Ore",
    base: 350,
    inc: 20,
    tProd: 2,
    tTop: 4,
    illegal: false,
    statusEvent: STATUS_EVENTS.AtWar,
    roundOff: 10,
    variance: 10,
    cheap: "MineralRich",
    expensive: "MineralPoor",
  },
  {
    id: 4,
    name: "Games",
    base: 250,
    inc: -10,
    tProd: 5,
    tTop: 6,
    illegal: false,
    statusEvent: STATUS_EVENTS.Boredom,
    roundOff: 5,
    variance: 5,
    cheap: "Artistic",
    expensive: null,
  },
  {
    id: 5,
    name: "Firearms",
    base: 1250,
    inc: -75,
    tProd: 4,
    tTop: 5,
    illegal: true,
    statusEvent: STATUS_EVENTS.AtWar,
    roundOff: 25,
    variance: 100,
    cheap: "Warlike",
    expensive: null,
  },
  {
    id: 6,
    name: "Medicine",
    base: 650,
    inc: -20,
    tProd: 6,
    tTop: 7,
    illegal: false,
    statusEvent: STATUS_EVENTS.Plague,
    roundOff: 25,
    variance: 10,
    cheap: "SpecialHerbs",
    expensive: null,
  },
  {
    id: 7,
    name: "Machines",
    base: 900,
    inc: -30,
    tProd: 4,
    tTop: 5,
    illegal: false,
    statusEvent: STATUS_EVENTS.LackWorkers,
    roundOff: 25,
    variance: 5,
    cheap: null,
    expensive: null,
  },
  {
    id: 8,
    name: "Narcotics",
    base: 3500,
    inc: -125,
    tProd: 5,
    tTop: 6,
    illegal: true,
    statusEvent: STATUS_EVENTS.Boredom,
    roundOff: 50,
    variance: 150,
    cheap: "WeirdMushrooms",
    expensive: null,
  },
  {
    id: 9,
    name: "Robots",
    base: 5000,
    inc: -150,
    tProd: 7,
    tTop: 8,
    illegal: false,
    statusEvent: STATUS_EVENTS.LackWorkers,
    roundOff: 100,
    variance: 100,
    cheap: null,
    expensive: null,
  },
];
function getItemPrice(item, star) {
  if (!star) return 0;
  if (!isItemTradeable(item, star)) return 0;
  const tech = getTechLevel(star);
  let price = item.base + tech * item.inc;
  if (price < 1) return 0;
  const desired = POLITICS_DESIRED[star.system];
  if (desired === item.id) {
    price = Math.floor((price * 4) / 3);
  }
  const rules = POLITICS_TRADE_RULES[star.system];
  const occTraders = rules ? rules.occurrenceTraders : 0;
  price = Math.floor((price * (100 - 2 * occTraders)) / 100);
  const sizeIdx =
    star.systemSize != null
      ? Math.min(4, Math.max(0, star.systemSize))
      : Math.min(4, Math.max(0, Math.floor(star.size - 1)));
  price = Math.floor((price * (100 - sizeIdx)) / 100);
  if (star.visited && star.resource && star.resource !== "None") {
    if (item.cheap === star.resource) {
      price = Math.floor((price * 3) / 4);
    }
    if (item.expensive === star.resource) {
      price = Math.floor((price * 4) / 3);
    }
  }
  return Math.max(price, 0);
}
function getItemBasePrice(item, star) {
  let price = getItemPrice(item, star);
  if (price <= 0) return 0;
  if (
    item.statusEvent !== STATUS_EVENTS.Uneventful &&
    star.status === item.statusEvent
  ) {
    price = Math.floor((price * 3) / 2);
  }
  const off =
    star.priceOffsets && star.priceOffsets[item.id] != null
      ? star.priceOffsets[item.id]
      : 0;
  price += off;
  return Math.max(price, 0);
}
function getItemSellPrice(item, star) {
  const price = getItemBasePrice(item, star);
  if (price <= 0) return 0;
  if (typeof policeRecordScore !== "undefined" && policeRecordScore <= -5) {
    return Math.max(0, Math.floor((price * 90) / 100));
  }
  return price;
}
function getItemBuyPrice(item, star) {
  const base = getItemBasePrice(item, star);
  if (base <= 0) return 0;
  const ts =
    typeof traderSkillTotal === "function"
      ? Math.min(traderSkillTotal(), 10)
      : 5;
  return Math.max(
    getItemSellPrice(item, star) + 1,
    Math.floor((base * (103 + (10 - ts))) / 100),
  );
}
const POLITICS_TRADE_RULES = {
  Anarchy: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 1,
    bribeWillingness: 7,
    reactionIllegal: 0,
    occurrencePolice: 0,
    occurrencePirates: 7,
  },
  Capitalist: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 7,
    bribeWillingness: 1,
    reactionIllegal: 2,
    occurrencePolice: 3,
    occurrencePirates: 2,
  },
  Communist: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 4,
    bribeWillingness: 5,
    reactionIllegal: 6,
    occurrencePolice: 6,
    occurrencePirates: 4,
  },
  Confederacy: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 5,
    bribeWillingness: 3,
    reactionIllegal: 5,
    occurrencePolice: 4,
    occurrencePirates: 3,
  },
  Corporate: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 7,
    bribeWillingness: 2,
    reactionIllegal: 2,
    occurrencePolice: 6,
    occurrencePirates: 2,
  },
  Cybernetic: {
    drugs: false,
    firearms: false,
    occurrenceTraders: 5,
    bribeWillingness: 0,
    reactionIllegal: 0,
    occurrencePolice: 7,
    occurrencePirates: 7,
  },
  Democracy: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 5,
    bribeWillingness: 2,
    reactionIllegal: 4,
    occurrencePolice: 3,
    occurrencePirates: 2,
  },
  Dictatorship: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 3,
    bribeWillingness: 2,
    reactionIllegal: 3,
    occurrencePolice: 4,
    occurrencePirates: 5,
  },
  Fascist: {
    drugs: false,
    firearms: true,
    occurrenceTraders: 1,
    bribeWillingness: 0,
    reactionIllegal: 7,
    occurrencePolice: 7,
    occurrencePirates: 7,
  },
  Feudal: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 2,
    bribeWillingness: 6,
    reactionIllegal: 1,
    occurrencePolice: 1,
    occurrencePirates: 6,
  },
  Military: {
    drugs: false,
    firearms: true,
    occurrenceTraders: 6,
    bribeWillingness: 0,
    reactionIllegal: 7,
    occurrencePolice: 7,
    occurrencePirates: 0,
  },
  Monarchy: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 4,
    bribeWillingness: 4,
    reactionIllegal: 3,
    occurrencePolice: 4,
    occurrencePirates: 3,
  },
  Pacifist: {
    drugs: true,
    firearms: false,
    occurrenceTraders: 5,
    bribeWillingness: 1,
    reactionIllegal: 7,
    occurrencePolice: 2,
    occurrencePirates: 1,
  },
  Socialist: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 3,
    bribeWillingness: 6,
    reactionIllegal: 4,
    occurrencePolice: 2,
    occurrencePirates: 5,
  },
  Technocracy: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 6,
    bribeWillingness: 2,
    reactionIllegal: 1,
    occurrencePolice: 6,
    occurrencePirates: 3,
  },
  Theocracy: {
    drugs: true,
    firearms: true,
    occurrenceTraders: 4,
    bribeWillingness: 0,
    reactionIllegal: 5,
    occurrencePolice: 6,
    occurrencePirates: 1,
  },
};
const POLITICS_DESIRED = {
  Anarchy: 2,
  Capitalist: 3,
  Communist: -1,
  Confederacy: 4,
  Corporate: 9,
  Cybernetic: 3,
  Democracy: 4,
  Dictatorship: -1,
  Fascist: 7,
  Feudal: 5,
  Military: 9,
  Monarchy: 6,
  Pacifist: -1,
  Socialist: -1,
  Technocracy: 0,
  Theocracy: 8,
};
function isItemTradeable(item, star) {
  if (!item.illegal) return true;
  const rules = POLITICS_TRADE_RULES[star.system] || {
    drugs: true,
    firearms: true,
  };
  if (item.name === "Firearms") return rules.firearms;
  if (item.name === "Narcotics") return rules.drugs;
  return true;
}
function refreshStarPrices(star) {
  if (star.status == null) star.status = STATUS_EVENTS.Uneventful;
  star.priceOffsets = TRADE_ITEMS.map((item) => {
    if (item.variance > 0) {
      return (
        Math.floor(Math.random() * item.variance) -
        Math.floor(Math.random() * item.variance)
      );
    }
    return 0;
  });
}
function reinitStarInventory(star) {
  if (star.status == null) star.status = STATUS_EVENTS.Uneventful;
  const tech = getTechLevel(star);
  const sizeIdx =
    star.systemSize != null
      ? Math.min(4, Math.max(0, star.systemSize))
      : Math.min(4, Math.max(0, Math.floor(star.size - 1)));
  const inv = TRADE_ITEMS.map((item) => {
    if (tech < item.tProd) return 0;
    if (!isItemTradeable(item, star)) return 0;
    let qty =
      (9 + Math.floor(Math.random() * 5) - Math.abs(item.tTop - tech)) *
      (1 + sizeIdx);
    if (item.name === "Robots" || item.name === "Narcotics") {
      qty = Math.floor((qty * 3) / 4) + 1;
    }
    if (star.resource && star.resource !== "None") {
      if (item.cheap === star.resource) {
        qty = Math.floor((qty * 4) / 3);
      }
      if (item.expensive === star.resource) {
        qty = Math.floor((qty * 3) / 4);
      }
    }
    if (
      item.statusEvent !== STATUS_EVENTS.Uneventful &&
      star.status === item.statusEvent
    ) {
      qty = Math.floor(qty / 5);
    }
    qty = qty - Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10);
    return Math.max(0, qty);
  });
  star.inventory = inv;
}
function ensureStarInventory(star) {
  if (star.status == null) star.status = STATUS_EVENTS.Uneventful;
  if (!star.priceOffsets) {
    refreshStarPrices(star);
  }
  if (!star.inventory) {
    reinitStarInventory(star);
  }
}
let lastDebtReminderTurn = 0;
function getDateString(turn) {
  const year = Math.floor(turn / 365) + 1;
  const day = (turn % 365) + 1;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthIdx = Math.floor((day - 1) / 30);
  const dayOfMonth = ((day - 1) % 30) + 1;
  return `${months[Math.min(monthIdx, 11)]} ${dayOfMonth}, ${2500 + year - 1}`;
}
function updatePoliceDisplay() {
  const repScore =
    typeof gameReputationScore !== "undefined" ? gameReputationScore : 0;
  const label =
    typeof getReputationLabel === "function"
      ? getReputationLabel(repScore)
      : "Harmless";
  document
    .querySelectorAll(".pilot-rep")
    .forEach((el) => (el.textContent = label));
  const polScore =
    typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  const polLabel =
    typeof getPoliceRecordLabel === "function"
      ? getPoliceRecordLabel(polScore)
      : "Clean";
  document
    .querySelectorAll(".pilot-record")
    .forEach((el) => (el.textContent = polLabel));
  if (typeof _checkPoliceCommission === "function") _checkPoliceCommission();
}
var _policeCommissionWarned = false;
function _checkPoliceCommission() {
  if (typeof playerShip === "undefined" || playerShip.name !== "Police") {
    _policeCommissionWarned = false;
    return;
  }
  var rec = typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  if (rec <= -5) {
    _confiscatePoliceShip();
  } else if (rec <= 4) {
    if (!_policeCommissionWarned) {
      _policeCommissionWarned = true;
      if (typeof addMailMessage === "function")
        addMailMessage("Police Warning", "Dear Commander " + (window.commanderName || "Jameson") + ", the Space Corps is watching you. Your police record has fallen, which demonstrates that you are failing in your promise to serve and protect travellers, by neutralising or apprehending threats in the areas we patrol. Should you continue down this path, we will be forced to confiscate your ship and discharge you from the police force.");
    }
  } else {
    _policeCommissionWarned = false;
  }
}
function _confiscatePoliceShip() {
  if (typeof playerShip === "undefined" || playerShip.name !== "Police") return;
  if (typeof playerCredits !== "undefined") playerCredits += 1500;
  if (typeof addMailMessage === "function") addMailMessage("Police Discharged", "The Space Corps has confiscated your police cruiser and discharged you from the force. A Flea has been issued to you and a severance of 1,500 cr has been paid into your account. Thank you for your service, Commander.");
  var oldSpecials = playerShip.specials ? playerShip.specials.slice() : [];
  var transferResult =
    typeof getTransferableItems === "function"
      ? getTransferableItems("Flea")
      : null;
  playerShip.name = "Flea";
  playerShip.gadgets = [];
  playerShip.weapons = [];
  playerShip.shields = [];
  playerShip.hull = SHIP_STATS.Flea.hull;
  if (transferResult && transferResult.items) {
    transferResult.items.forEach(function (item) {
      if (item.canTransfer && item.cat !== "special") {
        var targetArr =
          item.cat === "gadget"
            ? playerShip.gadgets
            : item.cat === "weapon"
              ? playerShip.weapons
              : item.cat === "shield"
                ? playerShip.shields
                : null;
        if (targetArr) {
          for (var q = 0; q < item.qty; q++) targetArr.push(item.name);
        }
      }
    });
  }
  playerShip.specials =
    oldSpecials.indexOf("Escape pod") !== -1 ? ["Escape pod"] : [];
  if (
    typeof playerFuel !== "undefined" &&
    typeof maxFuelCapacity === "function"
  ) {
    if (playerFuel > maxFuelCapacity()) playerFuel = maxFuelCapacity();
  }
  if (typeof beginMissionCancelBatch === "function") beginMissionCancelBatch();
  if (typeof cancelExcessRideMissions === "function") cancelExcessRideMissions("police ship confiscated");
  if (typeof cancelExcessHeroMissions === "function") cancelExcessHeroMissions("police ship confiscated");
  if (typeof cancelExcessManhuntMissions === "function") cancelExcessManhuntMissions("police ship confiscated");
  if (typeof sendMissionCancelBatchMail === "function") sendMissionCancelBatchMail();
  if (typeof savePlayerShip === "function") savePlayerShip();
  if (typeof saveFuelState === "function") saveFuelState();
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (typeof saveState === "function") saveState();
}
function updateCreditsDisplay() {
  const credits = _playerCredits.toLocaleString();
  const infoCredits = document.getElementById("info-credits");
  if (infoCredits) infoCredits.textContent = `${credits} cr`;
  const hudCredits = document.getElementById("hud-credits");
  if (hudCredits) hudCredits.textContent = `${credits} cr`;
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (typeof updateInfoWormhole === "function") updateInfoWormhole();
  if (typeof updateBankBlink === "function") updateBankBlink();
}
function updateCargoDisplay() {
  if (typeof playerShip === "undefined" || typeof SHIP_STATS === "undefined")
    return;
  const s = SHIP_STATS[playerShip.name];
  if (!s) return;
  const eb = playerShip.gadgets.filter(
    (g) => g === "5 extra cargo bays",
  ).length;
  const cap = s.cargo + eb * 5;
  let used = 0;
  if (
    typeof TRADE_ITEMS !== "undefined" &&
    typeof playerCargo !== "undefined"
  ) {
    TRADE_ITEMS.forEach((ti) => {
      used += playerCargo[ti.id] || 0;
    });
  }
  const totalUsed = used + 0;
  const el = document.getElementById("trade-status");
  if (el) el.textContent = `Cargo bays: ${totalUsed}/${cap} · ${getTradeStar().name}`;
  const shipCargo = document.getElementById("ship-cargo");
  if (shipCargo) shipCargo.textContent = `Cargo Bays: ${totalUsed}/${cap}`;
}
function updateGameDate() {
  const str = getDateString(turnCounter);
  const el = document.getElementById("game-date");
  if (el) el.textContent = str;
  const infoDate = document.getElementById("info-date");
  if (infoDate) infoDate.textContent = str;
  const hudDate = document.getElementById("hud-date");
  if (hudDate) hudDate.textContent = str;
  updateCreditsDisplay();
  updateCargoDisplay();
  updatePoliceDisplay();
}
function advanceTurn() {
  turnCounter++;
  if (typeof policeRecordScore !== "undefined") {
    if (policeRecordScore > 0 && turnCounter % 3 === 0) {
      policeRecordScore--;
    } else if (policeRecordScore < -5) {
      policeRecordScore++;
    }
  }
  if (typeof window.CREW_NAMES !== "undefined") {
    const crewCost = window.CREW_NAMES.filter((c) => c.hired).reduce(
      (sum, c) => sum + (c.cost || 0),
      0,
    );
    if (crewCost > 0) playerCredits -= crewCost;
    while (playerCredits < 0) {
      const hired = window.CREW_NAMES.filter((c) => c.hired);
      if (hired.length === 0) break;
      const leaving = hired.reduce((a, b) => (a.cost > b.cost ? a : b));
      leaving.hired = false;
      playerCredits += leaving.cost;
      if (typeof addMailMessage === "function") {
        addMailMessage("Crew Departure", `${leaving.name} has left your crew due to unpaid wages.`);
      }
    }
    saveCrewNames();
  }
  for (const star of stars) {
    randomizeStarStatus(star);
    if (!star.inventory) continue;
    const tech = getTechLevel(star);
    if (star.replenishCountdown > 0) {
      star.replenishCountdown--;
      if (star.replenishCountdown <= 0) {
        reinitStarInventory(star);
      } else {
        for (let i = 0; i < star.inventory.length; i++) {
          const item = TRADE_ITEMS[i];
          if (tech < item.tProd || !isItemTradeable(item, star)) {
            star.inventory[i] = 0;
            continue;
          }
          star.inventory[i] = Math.max(
            0,
            star.inventory[i] +
              Math.floor(Math.random() * 5) -
              Math.floor(Math.random() * 5),
          );
        }
      }
    } else {
      for (let i = 0; i < star.inventory.length; i++) {
        const item = TRADE_ITEMS[i];
        if (tech < item.tProd || !isItemTradeable(item, star)) {
          star.inventory[i] = 0;
        }
      }
    }
  }
  if (typeof playerHasInsurance !== "undefined" && playerHasInsurance) {
    const insCost = insurancePrice();
    if (playerCredits >= insCost) {
      playerCredits -= insCost;
      noClaim = Math.min(noClaim + 1, 90);
    }
  }
  if (typeof loanDebt !== "undefined" && loanDebt > 0) {
    if (
      turnCounter -
        (typeof lastDebtReminderTurn !== "undefined"
          ? lastDebtReminderTurn
          : 0) >=
      10
    ) {
      lastDebtReminderTurn = turnCounter;
      if (typeof addMailMessage === "function") {
        addMailMessage("Debt Reminder", `You have a debt of ${loanDebt.toLocaleString()} cr.`);
      }
    }
    const interest = Math.max(1, Math.floor(loanDebt * 0.1));
    if (playerCredits >= interest) {
      playerCredits -= interest;
    } else {
      loanDebt += interest - playerCredits;
      playerCredits = 0;
    }
    if (typeof checkDebtWarning === "function") checkDebtWarning();
  }
  updateGameDate();
  saveTradeState();
  if (typeof saveState === "function") saveState();
}
const tradeOverlay = document.getElementById("trade-overlay");
const tradeContent = document.getElementById("trade-content");
const qtyOverlay = document.getElementById("trade-qty-overlay");
const qtyHeader = document.getElementById("trade-qty-header");
const qtyBody = document.getElementById("trade-qty-body");
var autoFuel = false;
var autoRepair = false;
let _playerCredits = 1000;
Object.defineProperty(window, "playerCredits", {
  get() {
    return _playerCredits;
  },
  set(v) {
    _playerCredits = Math.min(v, 999999999);
    updateCreditsDisplay();
  },
  configurable: true,
  enumerable: true,
});
var playerCargo = {};
var playerCargoBuyPrice = {};
var lockedCargo = {};
function getItem(id) {
  return TRADE_ITEMS[id];
}
function cargoCount(id) {
  return playerCargo[id] || 0;
}
function lockedCount(id) {
  return lockedCargo[id] || 0;
}
function sellableCount(id) {
  return Math.max(0, cargoCount(id) - lockedCount(id));
}
function getBuyItems(star) {
  const tech = getTechLevel(star);
  return TRADE_ITEMS.filter(
    (item) => tech >= item.tProd && isItemTradeable(item, star),
  );
}
function getSellItems(star) {
  return TRADE_ITEMS.filter((item) => isItemTradeable(item, star));
}
function openTrade() {
  if (!currentStar) return;
  if (!tradeOverlay.classList.contains("hidden")) {
    tradeOverlay.classList.add("hidden");
    return;
  }
  closeAllOverlays();
  if (typeof initPlayerShip === "function") initPlayerShip();
  ensureStarInventory(currentStar);
  tradeOverlay.classList.remove("hidden");
  tradeNearbyStars = getTradeNearbyStars(currentStar);
  let startIdx = -1;
  if (
    typeof selectedStar !== "undefined" &&
    selectedStar &&
    selectedStar !== currentStar
  ) {
    startIdx = tradeNearbyStars.indexOf(selectedStar);
  }
  tradeNearbyIdx = startIdx;
  renderTrade();
  updateCargoDisplay();
}
function closeTrade() {
  tradeOverlay.classList.add("hidden");
  qtyOverlay.classList.add("hidden");
  tradeAnimating = false;
}
function openQtyPopup(id, action) {
  const item = getItem(id);
  const star = getTradeStar();
  if (!star || star !== currentStar) return;
  if (action === "buy") {
    if (typeof loanDebt !== "undefined" && loanDebt > 100000) return;
    const price = getItemBuyPrice(item, star);
    const stock = star.inventory ? star.inventory[id] || 0 : 0;
    const cap =
      SHIP_STATS[playerShip.name].cargo +
      playerShip.gadgets.filter((g) => g === "5 extra cargo bays").length * 5;
    let used = 0;
    TRADE_ITEMS.forEach((ti) => {
      used += playerCargo[ti.id] || 0;
    });
    used += 0;
    const free = cap - used;
    const max = Math.min(Math.floor(playerCredits / price), stock, free);
    if (max < 1) return;
    qtyHeader.textContent = `Buy ${item.name}`;
    qtyBody.innerHTML = `
            <div class="qty-slider-row">
                <input type="range" class="qty-slider" min="1" max="${max}" value="1" step="1">
                <span class="qty-val">1</span>
            </div>
            <div class="qty-total">Total: <span class="qty-total-val">${price}</span>&nbsp;cr</div>
            <div class="qty-btns">
                <button class="qty-btn max">Max</button>
                <button class="qty-btn confirm">Buy</button>
                <button class="qty-btn cancel">Cancel</button>
            </div>`;
  } else {
    const price = getItemSellPrice(item, star);
    const max = sellableCount(id);
    if (max < 1) return;
    qtyHeader.textContent = `Sell ${item.name}`;
    qtyBody.innerHTML = `
            <div class="qty-slider-row">
                <input type="range" class="qty-slider" min="1" max="${max}" value="1" step="1">
                <span class="qty-val">1</span>
            </div>
            <div class="qty-total">Total: <span class="qty-total-val">${price}</span>&nbsp;cr</div>
            <div class="qty-btns">
                <button class="qty-btn max">Max</button>
                <button class="qty-btn confirm">Sell</button>
                <button class="qty-btn cancel">Cancel</button>
            </div>`;
  }
  qtyOverlay.classList.remove("hidden");
  const slider = qtyBody.querySelector(".qty-slider");
  const valSpan = qtyBody.querySelector(".qty-val");
  const totalSpan = qtyBody.querySelector(".qty-total span");
  function updateDisplay() {
    const v = parseInt(slider.value);
    valSpan.textContent = v;
    const unitPrice =
      action === "buy"
        ? getItemBuyPrice(item, star)
        : getItemSellPrice(item, star);
    totalSpan.textContent = unitPrice * v;
  }
  slider.addEventListener("input", updateDisplay);
  qtyBody.querySelector(".qty-btn.max").addEventListener("click", () => {
    slider.value = slider.max;
    updateDisplay();
  });
  qtyBody.querySelector(".qty-btn.confirm").addEventListener("click", () => {
    const n = parseInt(slider.value);
    if (action === "buy") {
      const price = getItemBuyPrice(item, star);
      const stock = star.inventory ? star.inventory[id] || 0 : 0;
      const actual = Math.min(n, stock);
      const cap =
        SHIP_STATS[playerShip.name].cargo +
        playerShip.gadgets.filter((g) => g === "5 extra cargo bays").length * 5;
      let used = 0;
      TRADE_ITEMS.forEach((ti) => {
        used += playerCargo[ti.id] || 0;
      });
      used += 0;
      const free = cap - used;
      const actual2 = Math.min(actual, free);
      if (actual2 > 0 && playerCredits >= price * actual2) {
        playerCredits -= price * actual2;
        playerCargo[id] = (playerCargo[id] || 0) + actual2;
        playerCargoBuyPrice[id] =
          (playerCargoBuyPrice[id] || 0) + price * actual2;
        if (star.inventory)
          star.inventory[id] = (star.inventory[id] || 0) - actual2;
        saveTradeState();
        updateGameDate();
        saveState();
        closeQtyPopup();
        renderTrade();
      }
    } else {
      const price = getItemSellPrice(item, star);
      if (sellableCount(id) >= n) {
        playerCredits += price * n;
        const oldQty = playerCargo[id] || 0;
        const newQty = oldQty - n;
        playerCargo[id] = newQty;
        if (newQty > 0) {
          playerCargoBuyPrice[id] = Math.floor(
            ((playerCargoBuyPrice[id] || 0) * newQty) / oldQty,
          );
        } else {
          delete playerCargo[id];
          delete playerCargoBuyPrice[id];
        }
        saveTradeState();
        updateGameDate();
        saveState();
        closeQtyPopup();
        renderTrade();
      }
    }
  });
  qtyBody
    .querySelector(".qty-btn.cancel")
    .addEventListener("click", closeQtyPopup);
}
function closeQtyPopup() {
  qtyOverlay.classList.add("hidden");
}
let tradeNearbyStars = [];
let tradeNearbyIdx = -1;
function getTradeNearbyStars(origin) {
  const inRange =
    typeof starsWithinRange === "function" ? starsWithinRange() : [];
  return inRange.filter((s) => s !== origin);
}
function navigateTrade(dir) {
  tradeNearbyIdx = Math.max(
    -1,
    Math.min(tradeNearbyStars.length - 1, tradeNearbyIdx + dir),
  );
  renderTrade();
}
function getTradeStar() {
  return tradeNearbyIdx >= 0 && tradeNearbyIdx < tradeNearbyStars.length
    ? tradeNearbyStars[tradeNearbyIdx]
    : currentStar;
}
function renderTrade() {
  const star = getTradeStar();
  if (!star) return;
  const isLocal = star === currentStar;
  if (selectedStar !== star) {
    selectedStar = star;
    if (typeof updateInfoRoute === "function") updateInfoRoute();
  }
  const cap =
    typeof playerShip !== "undefined" && typeof SHIP_STATS !== "undefined"
      ? SHIP_STATS[playerShip.name].cargo +
        playerShip.gadgets.filter((g) => g === "5 extra cargo bays").length * 5
      : 0;
  let used = 0;
  if (
    typeof TRADE_ITEMS !== "undefined" &&
    typeof playerCargo !== "undefined"
  ) {
    TRADE_ITEMS.forEach((ti) => {
      used += playerCargo[ti.id] || 0;
    });
  }
  const freeCargo = cap - used - 0;
  let html = `
        <div id="trade-header">
            <div id="trade-header-left">
                <span id="trade-title">${tradeNearbyIdx < 0 ? "Marketplace" : tradeNearbyIdx === findBestBuyStation() && tradeNearbyIdx === findBestSellStation() ? "Marketplace: Best Buy/Sell" : tradeNearbyIdx === findBestBuyStation() ? "Marketplace: Best Buy" : tradeNearbyIdx === findBestSellStation() ? "Marketplace: Best Sell" : "Marketplace: Avg. Prices"}</span>
                <span id="trade-status"></span>
            </div>
            <div id="trade-header-right">
                <button id="btn-trade-prev"></button>
                <button id="btn-trade-next"></button>
                <button id="btn-trade-close"></button>
            </div>
        </div>`;
  if (isLocal) {
    html += `<div id="trade-slider"><div id="trade-columns" class="local">
            <div class="trade-col">
                <div class="trade-col-header">
                    <span class="hdr-name">Item</span>
                    <span class="hdr-actions"><span class="hdr-buy">Buy</span><span class="hdr-sell">Sell</span></span>
                    <span class="hdr-stock">Stk</span>
                    <span class="hdr-cargo">Qty</span>
                </div>
                <div class="trade-items">`;
    const buyItems = getBuyItems(star);
    const sellItems = getSellItems(star);
    for (const item of TRADE_ITEMS) {
      const buyPrice = getItemBuyPrice(item, star);
      const sellPrice = getItemSellPrice(item, star);
      const cnt = cargoCount(item.id);
      const stock = star.inventory ? star.inventory[item.id] || 0 : 0;
      const isBuyable = buyItems.some((i) => i.id === item.id);
      const isSellable = sellItems.some((i) => i.id === item.id);
      const canBuy =
        isBuyable && playerCredits >= buyPrice && stock > 0 && freeCargo > 0;
      const canSell = isSellable && sellableCount(item.id) > 0;
      const buyBtnText =
        !canBuy && freeCargo <= 0
          ? "Full"
          : !canBuy && stock <= 0
            ? "Sold Out"
            : "Buy";
      html += `
                <div class="trade-row local${isBuyable ? " profitable" : ""}">
                    <span class="trade-name${item.illegal ? " illegal" : ""}">${item.name}</span>
                    <span class="trade-actions">
                        <span class="trade-action buy-action">${isBuyable ? `<span class="trade-price">${buyPrice}&nbsp;cr</span><button class="trade-btn buy" data-id="${item.id}"${canBuy ? "" : " disabled"}>${buyBtnText}</button>` : ""}</span>
                        <span class="trade-action sell-action">${isSellable ? `<span class="trade-price">${sellPrice}&nbsp;cr</span><button class="trade-btn sell" data-id="${item.id}"${canSell ? "" : " disabled"}>Sell</button>` : ""}</span>
                    </span>
                    <span class="trade-stock">${isBuyable ? stock : "-"}</span>
                    <span class="trade-cargo">${cnt}</span>
                </div>`;
    }
    html += `</div></div></div></div>`;
  } else {
    html += `<div id="trade-slider"><div id="trade-columns" class="single-col">
            <div class="trade-col">
                <div class="trade-col-header">
                    <span class="hdr-name">Item</span>
                    <span class="hdr-buy">Buy</span>
                    <span class="hdr-sell">Sell</span>
                </div>
                <div class="trade-items">`;
    const localBuyItems = getBuyItems(currentStar);
    for (const item of TRADE_ITEMS) {
      const price = getItemBuyPrice(item, star);
      const sellPrice = getItemSellPrice(item, star);
      const canBuy = getBuyItems(star).some((i) => i.id === item.id);
      const canSell = getSellItems(star).some((i) => i.id === item.id);
      const buyOnCur = getItemBuyPrice(item, currentStar);
      const sellOnCur = getItemSellPrice(item, currentStar);
      const profitSell = canSell ? sellPrice - buyOnCur : null;
      const profitBuy = canBuy ? sellOnCur - price : null;
      const availHere = localBuyItems.some((i) => i.id === item.id);
      const isProfitable = availHere;
      const notTraded = profitSell === null && profitBuy === null;
      const sellCls =
        profitSell !== null
          ? profitSell < 0
            ? " down"
            : profitSell > 0
              ? " up"
              : ""
          : "";
      const buyCls =
        profitBuy !== null
          ? profitBuy < 0
            ? " down"
            : profitBuy > 0
              ? " up"
              : ""
          : "";
      html += `
                <div class="trade-row${isProfitable ? " profitable" : ""}${notTraded ? " not-traded" : ""}">
                    <span class="trade-name${item.illegal ? " illegal" : ""}">${item.name}</span>
                    <span class="trade-diff buy${buyCls}">${profitBuy !== null ? (profitBuy > 0 ? "+" : "") + profitBuy : "—"}</span>
                    <span class="trade-diff sell${sellCls}">${profitSell !== null ? (profitSell > 0 ? "+" : "") + profitSell : "—"}</span>
                </div>`;
    }
    html += `</div></div></div></div>`;
  }
  tradeContent.style.transform = "";
  tradeContent.innerHTML = html;
  const sidebar = document.getElementById("trade-sidebar");
  sidebar.innerHTML = `<button id="btn-trade-cart"></button><button id="btn-trade-best-buy"></button><button id="btn-trade-best-sell"></button>`;
  tradeContent.querySelectorAll(".trade-btn.buy").forEach((btn) => {
    btn.addEventListener("click", () =>
      openQtyPopup(parseInt(btn.dataset.id), "buy"),
    );
  });
  tradeContent.querySelectorAll(".trade-btn.sell").forEach((btn) => {
    btn.addEventListener("click", () =>
      openQtyPopup(parseInt(btn.dataset.id), "sell"),
    );
  });
  const prevBtn = document.getElementById("btn-trade-prev");
  const nextBtn = document.getElementById("btn-trade-next");
  prevBtn.innerHTML = ICON_CHEVRON_LEFT;
  nextBtn.innerHTML = ICON_CHEVRON_RIGHT;
  document.getElementById("btn-trade-close").innerHTML = ICON_CLOSE;
  const cartBtn = document.getElementById("btn-trade-cart");
  const bestBuyBtn = document.getElementById("btn-trade-best-buy");
  const bestSellBtn = document.getElementById("btn-trade-best-sell");
  cartBtn.innerHTML = ICON_CART;
  bestBuyBtn.innerHTML = ICON_BUY;
  bestSellBtn.innerHTML = ICON_SELL;
  prevBtn.disabled = tradeNearbyIdx < 0;
  nextBtn.disabled = tradeNearbyIdx >= tradeNearbyStars.length - 1;
  prevBtn.addEventListener("click", () => {
    if (typeof tradeSlideOutAndIn === "function") tradeSlideOutAndIn(-1);
  });
  nextBtn.addEventListener("click", () => {
    if (typeof tradeSlideOutAndIn === "function") tradeSlideOutAndIn(1);
  });
  document
    .getElementById("btn-trade-close")
    .addEventListener("click", closeTrade);
  cartBtn.disabled = tradeNearbyIdx < 0;
  cartBtn.addEventListener("click", () => {
    if (typeof goToLocalMarket === "function") goToLocalMarket();
  });
  bestBuyBtn.disabled =
    typeof findBestBuyStation !== "function" ||
    findBestBuyStation() < 0 ||
    tradeNearbyIdx === findBestBuyStation();
  bestSellBtn.disabled =
    typeof findBestSellStation !== "function" ||
    findBestSellStation() < 0 ||
    tradeNearbyIdx === findBestSellStation();
  bestBuyBtn.addEventListener("click", () => {
    if (typeof goToBestBuyStation === "function") goToBestBuyStation();
  });
  bestSellBtn.addEventListener("click", () => {
    if (typeof goToBestSellStation === "function") goToBestSellStation();
  });
  updateCargoDisplay();
}
const TRADE_SAVE_KEY = "stc_trade";
function saveTradeState() {
  localStorage.setItem(
    TRADE_SAVE_KEY,
    JSON.stringify({
      credits: playerCredits,
      cargo: playerCargo,
      lockedCargo: lockedCargo,
      cargoBuyPrice: playerCargoBuyPrice,
      loanDebt: typeof loanDebt !== "undefined" ? loanDebt : 0,
      turnCounter: turnCounter,
      hasInsurance:
        typeof playerHasInsurance !== "undefined" ? playerHasInsurance : false,
      noClaim: typeof noClaim !== "undefined" ? noClaim : 0,
      debt75kWarningSent:
        typeof debt75kWarningSent !== "undefined" ? debt75kWarningSent : false,
      lastDebtReminderTurn:
        typeof lastDebtReminderTurn !== "undefined" ? lastDebtReminderTurn : 0,
      autoFuel: typeof autoFuel !== "undefined" ? autoFuel : false,
      autoRepair: typeof autoRepair !== "undefined" ? autoRepair : false,
    }),
  );
}
function loadTradeState() {
  const raw = localStorage.getItem(TRADE_SAVE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    playerCredits = data.credits != null ? data.credits : 1000;
    playerCargo = data.cargo || {};
    lockedCargo = data.lockedCargo || {};
    playerCargoBuyPrice = data.cargoBuyPrice || {};
    if (typeof data.loanDebt !== "undefined") loanDebt = data.loanDebt;
    if (typeof data.turnCounter !== "undefined") turnCounter = data.turnCounter;
    if (typeof data.hasInsurance !== "undefined")
      playerHasInsurance = data.hasInsurance;
    if (typeof data.noClaim !== "undefined") noClaim = data.noClaim;
    if (typeof data.debt75kWarningSent !== "undefined")
      debt75kWarningSent = data.debt75kWarningSent;
    if (typeof data.lastDebtReminderTurn !== "undefined")
      lastDebtReminderTurn = data.lastDebtReminderTurn;
    if (typeof data.autoFuel !== "undefined") autoFuel = data.autoFuel;
    if (typeof data.autoRepair !== "undefined") autoRepair = data.autoRepair;
  } catch {}
  updateGameDate();
}
function resetTradeState() {
  localStorage.removeItem(TRADE_SAVE_KEY);
  playerCredits = 1000;
  playerCargo = {};
  lockedCargo = {};
  playerCargoBuyPrice = {};
  loanDebt = 0;
  debt75kWarningSent = false;
  turnCounter = 0;
  playerHasInsurance = false;
  noClaim = 0;
  lastDebtReminderTurn = 0;
  autoFuel = false;
  autoRepair = false;
  updateGameDate();
}
document.getElementById("btn-trade").addEventListener("click", openTrade);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !tradeOverlay.classList.contains("hidden")) {
    if (!qtyOverlay.classList.contains("hidden")) {
      closeQtyPopup();
    } else {
      closeTrade();
    }
  }
});
tradeOverlay.addEventListener("click", (e) => {
  if (e.target === tradeOverlay) closeTrade();
});
qtyOverlay.addEventListener("click", (e) => {
  if (e.target === qtyOverlay) closeQtyPopup();
});
loadTradeState();
updateGameDate();
let tradeSwipeStartX = 0;
let tradeSwipeActive = false;
let tradeAnimating = false;
const TRADE_SWIPE_THRESHOLD = 0.25;
function getTradePanelWidth() {
  return document.getElementById("trade-panel").clientWidth;
}
function getTradeSlider() {
  return document.getElementById("trade-slider");
}
function tradeSlideOutAndIn(dir) {
  if (tradeAnimating) return;
  tradeAnimating = true;
  const w = getTradePanelWidth();
  const outX = -dir * w;
  const slider = getTradeSlider();
  if (!slider) {
    tradeAnimating = false;
    return;
  }
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlideOut() {
    slider.removeEventListener("transitionend", onSlideOut);
    navigateTrade(dir);
    const newSlider = getTradeSlider();
    if (!newSlider) {
      tradeAnimating = false;
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
      tradeAnimating = false;
    });
  });
}
function tradeSlideBack() {
  const slider = getTradeSlider();
  if (!slider) return;
  slider.style.transition = "transform 0.2s ease";
  slider.style.transform = "translateX(0)";
  slider.addEventListener("transitionend", function onBack() {
    slider.removeEventListener("transitionend", onBack);
    slider.style.transition = "";
    slider.style.transform = "";
  });
}
function tradeSwipeDir(dx) {
  return dx > 0 ? -1 : 1;
}
function tradeCanNavigate(dir) {
  const btn = document.getElementById(
    dir > 0 ? "btn-trade-next" : "btn-trade-prev",
  );
  return btn && !btn.disabled;
}
const tp = document.getElementById("trade-panel");
function startTradeDrag(clientX) {
  if (
    !document.getElementById("trade-qty-overlay").classList.contains("hidden")
  )
    return false;
  if (tradeAnimating) return false;
  tradeSwipeStartX = clientX;
  tradeSwipeActive = true;
  const slider = getTradeSlider();
  if (slider) {
    slider.style.transition = "none";
    slider.style.transform = "";
  }
  return true;
}
function moveTradeDrag(clientX) {
  if (!tradeSwipeActive) return;
  const slider = getTradeSlider();
  if (!slider) return;
  const dx = clientX - tradeSwipeStartX;
  slider.style.transform = `translateX(${dx}px)`;
}
function endTradeDrag(clientX) {
  if (!tradeSwipeActive) return;
  tradeSwipeActive = false;
  const dx = clientX - tradeSwipeStartX;
  const w = getTradePanelWidth();
  if (Math.abs(dx) > w * TRADE_SWIPE_THRESHOLD) {
    const dir = tradeSwipeDir(dx);
    if (tradeCanNavigate(dir)) {
      tradeSlideOutAndIn(dir);
    } else {
      tradeSlideBack();
    }
  } else {
    tradeSlideBack();
  }
}
tp.addEventListener(
  "touchstart",
  (e) => {
    startTradeDrag(e.touches[0].clientX);
  },
  { passive: true },
);
tp.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      tradeSwipeActive = false;
      return;
    }
    moveTradeDrag(e.touches[0].clientX);
  },
  { passive: true },
);
tp.addEventListener("touchend", (e) => {
  endTradeDrag(e.changedTouches[0].clientX);
});
tp.addEventListener("touchcancel", () => {
  tradeSwipeActive = false;
  tradeSlideBack();
});
tp.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (
    e.target.closest("button") ||
    e.target.closest("input") ||
    e.target.closest(".qty-slider")
  )
    return;
  startTradeDrag(e.clientX);
});
document.addEventListener("mousemove", (e) => {
  moveTradeDrag(e.clientX);
});
document.addEventListener("mouseup", (e) => {
  endTradeDrag(e.clientX);
});
function calculateStationBuyProfit(star) {
  let total = 0;
  for (const item of TRADE_ITEMS) {
    const price = getItemBuyPrice(item, star);
    const canBuy = getBuyItems(star).some((i) => i.id === item.id);
    const sellOnCur = getItemSellPrice(item, currentStar);
    const profitBuy = canBuy ? sellOnCur - price : null;
    if (profitBuy !== null && profitBuy > 0) total += profitBuy;
  }
  return total;
}
function calculateStationSellProfit(star) {
  let total = 0;
  for (const item of TRADE_ITEMS) {
    const sellPrice = getItemSellPrice(item, star);
    const canSell = getSellItems(star).some((i) => i.id === item.id);
    const buyOnCur = getItemBuyPrice(item, currentStar);
    const profitSell = canSell ? sellPrice - buyOnCur : null;
    if (profitSell !== null && profitSell > 0) total += profitSell;
  }
  return total;
}
function findBestBuyStation() {
  let bestIdx = -1;
  let bestProfit = 0;
  const curProfit = calculateStationBuyProfit(currentStar);
  for (let i = 0; i < tradeNearbyStars.length; i++) {
    const profit = calculateStationBuyProfit(tradeNearbyStars[i]);
    if (profit > bestProfit) {
      bestProfit = profit;
      bestIdx = i;
    }
  }
  if (bestProfit <= curProfit) return -1;
  return bestIdx;
}
function findBestSellStation() {
  let bestIdx = -1;
  let bestProfit = 0;
  const curProfit = calculateStationSellProfit(currentStar);
  for (let i = 0; i < tradeNearbyStars.length; i++) {
    const profit = calculateStationSellProfit(tradeNearbyStars[i]);
    if (profit > bestProfit) {
      bestProfit = profit;
      bestIdx = i;
    }
  }
  if (bestProfit <= curProfit) return -1;
  return bestIdx;
}
function goToBestBuyStation() {
  if (tradeAnimating) return;
  const bestIdx = findBestBuyStation();
  if (bestIdx < 0) return;
  const dir = bestIdx > tradeNearbyIdx ? 1 : -1;
  tradeNearbyIdx = bestIdx - dir;
  tradeSlideOutAndIn(dir);
}
function goToBestSellStation() {
  if (tradeAnimating) return;
  const bestIdx = findBestSellStation();
  if (bestIdx < 0) return;
  const dir = bestIdx > tradeNearbyIdx ? 1 : -1;
  tradeNearbyIdx = bestIdx - dir;
  tradeSlideOutAndIn(dir);
}
function goToLocalMarket() {
  if (tradeAnimating) return;
  if (tradeNearbyIdx === -1) return;
  const dir = -1;
  tradeNearbyIdx = -1 - dir;
  tradeSlideOutAndIn(dir);
}
