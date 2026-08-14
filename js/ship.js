// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function _sendPoliceDischargeMail() {
  playerCredits += 1500;
  if (typeof addMailMessage === "function")
    addMailMessage("Police Discharged", "You have been discharged from the Space Corps. A severance of 1,500 cr has been paid into your account. Thank you for your service, Commander.");
}
let shipPageIdx = 0;
let shipAnimating = false;
let shipStoreIdx = 0;
let shipEquipIdx = 0;
let shipBuyName = "";
let shipCatchMode = false;
const EQUIP_PER_PAGE = 4;
const STORE_SHIPS = [
  "Flea", "Gnat", "Firefly", "Mosquito", "Bumblebee", "Beetle",
  "Hornet", "Grasshopper", "Termite", "Wasp", "Police",
];
const TECH_EARLY_INDUSTRIAL = 4;
const TECH_INDUSTRIAL = 5;
const TECH_POST_INDUSTRIAL = 6;
const TECH_HIGH_TECH = 7;
const EQUIP_ITEMS = [
  {
    name: "5 extra cargo bays",
    price: 2500,
    tech: TECH_EARLY_INDUSTRIAL,
    cat: "gadget",
    desc: "+5 cargo",
  },
  {
    name: "Escape pod",
    price: 2000,
    tech: 0,
    cat: "special",
    desc: "Required for insurance",
  },
  {
    name: "Auto-repair system",
    price: 7500,
    tech: TECH_INDUSTRIAL,
    cat: "gadget",
    desc: "+3 Engineer",
  },
  {
    name: "Navigation system",
    price: 15000,
    tech: TECH_POST_INDUSTRIAL,
    cat: "gadget",
    desc: "+3 Pilot",
  },
  {
    name: "Targeting system",
    price: 25000,
    tech: TECH_POST_INDUSTRIAL,
    cat: "gadget",
    desc: "+3 Fighter",
  },
  {
    name: "Cloaking device",
    price: 100000,
    tech: TECH_HIGH_TECH,
    cat: "gadget",
    desc: "+2 Pilot, invisibility",
  },
  {
    name: "Fuel compactor",
    price: 30000,
    tech: TECH_HIGH_TECH,
    cat: "special",
    desc: "+18 fuel capacity",
  },
  {
    name: "Renwick Retrofit Tech",
    price: 50000,
    tech: TECH_HIGH_TECH,
    cat: "gadget",
    desc: "+50 hull strength",
  },
  {
    name: "Pulse laser",
    price: 2000,
    tech: TECH_INDUSTRIAL,
    cat: "weapon",
    desc: "Power 15",
  },
  {
    name: "Beam laser",
    price: 12500,
    tech: TECH_POST_INDUSTRIAL,
    cat: "weapon",
    desc: "Power 25",
  },
  {
    name: "Military laser",
    price: 35000,
    tech: TECH_HIGH_TECH,
    cat: "weapon",
    desc: "Power 35",
  },
  {
    name: "Morgan's laser",
    price: 50000,
    tech: TECH_HIGH_TECH,
    cat: "weapon",
    desc: "Power 85",
  },
  {
    name: "Energy shield",
    price: 5000,
    tech: TECH_INDUSTRIAL,
    cat: "shield",
    desc: "Power 100",
  },
  {
    name: "Reflective shield",
    price: 20000,
    tech: TECH_POST_INDUSTRIAL,
    cat: "shield",
    desc: "Power 200",
  },
  {
    name: "Lightning shield",
    price: 45000,
    tech: TECH_HIGH_TECH,
    cat: "shield",
    desc: "Power 350",
  },
];
const EQUIP_SAVE_KEY = "stc_equip";
const FUEL_SAVE_KEY = "stc_fuel";
let playerShip = {
  name: "Flea",
  gadgets: [],
  weapons: [],
  shields: [],
  specials: [],
};
let playerFuel = 0;
Object.defineProperty(window, "hasEscapePod", {
  get() {
    return (
      playerShip &&
      playerShip.specials &&
      playerShip.specials.includes("Escape pod")
    );
  },
  enumerable: true,
  configurable: true,
});
function initPlayerShip() {
  const raw = localStorage.getItem(EQUIP_SAVE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.name && SHIP_STATS[data.name]) {
        playerShip = data;
        if (!playerShip.specials) playerShip.specials = [];
        loadFuelState();
        if (typeof updateFuelBlink === "function") updateFuelBlink();
        return;
      }
    } catch {}
  }
  loadFuelState();
  if (typeof updateFuelBlink === "function") updateFuelBlink();
}
function savePlayerShip() {
  localStorage.setItem(EQUIP_SAVE_KEY, JSON.stringify(playerShip));
}
function maxFuelCapacity() {
  const s = SHIP_STATS[playerShip.name];
  if (!s) return 0;
  if (playerShip.specials && playerShip.specials.includes("Fuel compactor"))
    return 18;
  return s.fuel;
}
function maxHull() {
  const s = SHIP_STATS[playerShip.name];
  if (!s) return 0;
  let hull = s.hull;
  if (
    playerShip.gadgets &&
    playerShip.gadgets.includes("Renwick Retrofit Tech")
  ) {
    hull += 50;
  }
  return hull;
}
function saveFuelState() {
  localStorage.setItem(FUEL_SAVE_KEY, String(Math.round(playerFuel)));
}
function loadFuelState() {
  const raw = localStorage.getItem(FUEL_SAVE_KEY);
  if (raw != null) {
    playerFuel = parseFloat(raw) || 0;
  } else {
    playerFuel = maxFuelCapacity();
  }
}
function fuelCostPerUnit() {
  const s = SHIP_STATS[playerShip.name];
  if (!s) return 10;
  return s.costOfFuel;
}
function repairCostPerPoint() {
  const s = SHIP_STATS[playerShip.name];
  return s.repairCosts || Math.floor(s.price / s.hull / 10);
}
function attemptHullRepair(amount) {
  const maxH = maxHull();
  const cur = playerShip.hull != null ? playerShip.hull : maxH;
  const damage = maxH - cur;
  if (damage <= 0) return;
  const cost = repairCostPerPoint();
  const toRepair = Math.min(amount, damage, Math.floor(playerCredits / cost));
  if (toRepair <= 0) return;
  playerShip.hull = cur + toRepair;
  playerCredits -= toRepair * cost;
  if (typeof saveTradeState === "function") saveTradeState();
  savePlayerShip();
  if (typeof updateCreditsDisplay === "function") updateCreditsDisplay();
  renderShipPages();
}
function attemptPurchaseOfFuel(amount) {
  const maxFuel = maxFuelCapacity();
  const cost = fuelCostPerUnit();
  let realAmount = Math.min(maxFuel - playerFuel, amount);
  realAmount = Math.min(realAmount, Math.floor(playerCredits / cost));
  if (realAmount <= 0) return false;
  playerCredits -= realAmount * cost;
  playerFuel += realAmount;
  saveFuelState();
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (typeof updateFuelBlink === "function") updateFuelBlink();
  return true;
}
function updateFuelBlink() {
  const canTravel =
    typeof starsWithinRange === "function" && starsWithinRange().length > 0;
  const shipBtn = document.getElementById("btn-ship");
  const fuelBtn = document.getElementById("btn-ship-maintenance");
  const hudBtn = document.getElementById("hud-btn-ship");
  if (shipBtn) shipBtn.classList.toggle("fuel-blink", !canTravel);
  if (fuelBtn) fuelBtn.classList.toggle("fuel-blink", !canTravel);
  if (hudBtn) hudBtn.classList.toggle("fuel-blink", !canTravel);
}
function engineerSkillTotal() {
  const base = (window.commanderSkills && window.commanderSkills.engineer) || 5;
  const cb =
    typeof crewBonuses === "function" ? crewBonuses() : { Engineer: 0 };
  const eb = equipSkillBonuses();
  return base + (cb.Engineer || 0) + (eb.Engineer || 0);
}
function equipSkillBonuses() {
  const b = { Pilot: 0, Fighter: 0, Trader: 0, Engineer: 0 };
  if (playerShip.gadgets.includes("Navigation system")) b.Pilot += 3;
  if (playerShip.gadgets.includes("Targeting system")) b.Fighter += 3;
  if (playerShip.gadgets.includes("Auto-repair system")) b.Engineer += 3;
  if (playerShip.gadgets.includes("Cloaking device")) b.Pilot += 2;
  return b;
}
function traderSkillTotal() {
  const base = (window.commanderSkills && window.commanderSkills.trader) || 5;
  const cb = typeof crewBonuses === "function" ? crewBonuses() : { Trader: 0 };
  const eb = equipSkillBonuses();
  return base + (cb.Trader || 0) + (eb.Trader || 0);
}
function fighterSkillTotal() {
  const base = (window.commanderSkills && window.commanderSkills.fighter) || 5;
  const cb = typeof crewBonuses === "function" ? crewBonuses() : { Fighter: 0 };
  const eb = equipSkillBonuses();
  return base + (cb.Fighter || 0) + (eb.Fighter || 0);
}
function pilotSkillTotal() {
  const base = (window.commanderSkills && window.commanderSkills.pilot) || 5;
  const cb = typeof crewBonuses === "function" ? crewBonuses() : { Pilot: 0 };
  const eb = equipSkillBonuses();
  return base + (cb.Pilot || 0) + (eb.Pilot || 0);
}
function shipTradeInValue() {
  const s = SHIP_STATS[playerShip.name];
  let val = Math.floor((s.price * 3) / 4);
  const currentHull = playerShip.hull != null ? playerShip.hull : s.hull;
  const repairCost = s.repairCosts || Math.floor(s.price / s.hull / 10);
  val -= (s.hull - currentHull) * repairCost;
  val -= (maxFuelCapacity() - (playerFuel || 0)) * fuelCostPerUnit();
  playerShip.gadgets.forEach((g) => {
    const item = EQUIP_ITEMS.find((e) => e.name === g);
    if (item) val += Math.floor((item.price * 3) / 4);
  });
  playerShip.weapons.forEach((w) => {
    const item = EQUIP_ITEMS.find((e) => e.name === w);
    if (item) val += Math.floor((item.price * 3) / 4);
  });
  playerShip.shields.forEach((sh) => {
    const item = EQUIP_ITEMS.find((e) => e.name === sh);
    if (item) val += Math.floor((item.price * 3) / 4);
  });
  return val;
}
function shipValuationForInsurance() {
  const s = SHIP_STATS[playerShip.name];
  let val = Math.floor((s.price * 3) / 4);
  const currentHull = playerShip.hull != null ? playerShip.hull : s.hull;
  const repairCost = s.repairCosts || Math.floor(s.price / s.hull / 10);
  val -= (s.hull - currentHull) * repairCost;
  val -= (maxFuelCapacity() - (playerFuel || 0)) * fuelCostPerUnit();
  playerShip.gadgets.forEach((g) => {
    const item = EQUIP_ITEMS.find((e) => e.name === g);
    if (item) val += Math.floor((item.price * 3) / 4);
  });
  playerShip.weapons.forEach((w) => {
    const item = EQUIP_ITEMS.find((e) => e.name === w);
    if (item) val += Math.floor((item.price * 3) / 4);
  });
  playerShip.shields.forEach((sh) => {
    const item = EQUIP_ITEMS.find((e) => e.name === sh);
    if (item) val += Math.floor((item.price * 3) / 4);
  });
  return Math.floor(val);
}
function cargoValuation() {
  let val = 0;
  if (
    typeof TRADE_ITEMS !== "undefined" &&
    typeof playerCargo !== "undefined" &&
    typeof currentStar !== "undefined"
  ) {
    TRADE_ITEMS.forEach((item) => {
      const qty = playerCargo[item.id] || 0;
      if (qty > 0) {
        const price =
          typeof getItemSellPrice === "function"
            ? getItemSellPrice(item, currentStar)
            : item.base;
        val += price * qty;
      }
    });
  }
  return val;
}
function cargoAndShipValuationForInsurance() {
  return shipValuationForInsurance(true) + cargoValuation();
}
function getTransferableItems(newShipName) {
  const ns = SHIP_STATS[newShipName];
  const allItems = [];
  let extraCost = 0;
  let sellTotal = 0;
  const remaining = {
    gadget: ns.gadgets,
    weapon: ns.weapons,
    shield: ns.shields,
  };
  EQUIP_ITEMS.forEach((item) => {
    const owned = countOwned(item);
    if (owned === 0) return;
    let canTransfer = false;
    let transferable = 0;
    if (item.cat === "special") {
      canTransfer = true;
      transferable = owned;
    } else if (item.cat in remaining) {
      transferable = Math.min(owned, remaining[item.cat]);
      canTransfer = transferable > 0;
      remaining[item.cat] -= transferable;
    }
    const transferCost = Math.floor((item.price * 2) / 3);
    const sellValue = Math.floor((item.price * 3) / 4);
    allItems.push({
      name: item.name,
      price: item.price,
      qty: owned,
      transferCost,
      sellValue,
      cat: item.cat,
      canTransfer,
      transferable,
      lostQty: owned - transferable,
    });
    if (canTransfer) extraCost += transferCost * transferable;
    sellTotal += sellValue * (owned - transferable);
  });
  return { items: allItems, extraCost, sellTotal, lost: [] };
}
function cargoSellValue() {
  if (typeof playerCargo === "undefined" || !currentStar) return 0;
  let total = 0;
  for (const item of TRADE_ITEMS) {
    const qty = Math.max(
      0,
      (playerCargo[item.id] || 0) -
        (typeof lockedCargo !== "undefined" ? lockedCargo[item.id] || 0 : 0),
    );
    if (qty > 0) total += qty * getItemSellPrice(item, currentStar);
  }
  return total;
}
function shipNetPrice(shipName) {
  const s = SHIP_STATS[shipName];
  const ts = traderSkillTotal();
  const buyPrice = Math.floor((s.price * (100 - ts)) / 100);
  const tradeIn = shipTradeInValue();
  const ti = getTransferableItems(shipName);
  const cargoVal = cargoSellValue();
  const ps = SHIP_STATS[playerShip.name];
  const currentHull = playerShip.hull != null ? playerShip.hull : ps.hull;
  const repairCost = ps.repairCosts || Math.floor(ps.price / ps.hull / 10);
  const hullDamageDed = (ps.hull - currentHull) * repairCost;
  const fuelMissingDed =
    (maxFuelCapacity() - (playerFuel || 0)) * fuelCostPerUnit();
  const net = buyPrice - tradeIn - cargoVal + ti.extraCost - ti.sellTotal;
  return {
    buyPrice,
    tradeIn,
    cargoVal,
    hullDamageDed,
    fuelMissingDed,
    net,
    transferItems: ti.items,
    extraCost: ti.extraCost,
    sellTotal: ti.sellTotal,
    lost: ti.lost,
  };
}
function getSlotUsage() {
  const stats = SHIP_STATS[playerShip.name];
  return {
    gadgets: { used: playerShip.gadgets.length, max: stats.gadgets },
    weapons: { used: playerShip.weapons.length, max: stats.weapons },
    shields: { used: playerShip.shields.length, max: stats.shields },
  };
}
function canBuyEquip(item) {
  if (item.cat === "special") {
    return (
      playerCredits >= item.price && !playerShip.specials.includes(item.name)
    );
  }
  const usage = getSlotUsage();
  switch (item.cat) {
    case "gadget":
      if (usage.gadgets.used >= usage.gadgets.max) return false;
      if (
        item.name !== "5 extra cargo bays" &&
        playerShip.gadgets.includes(item.name)
      )
        return false;
      return true;
    case "weapon":
      return usage.weapons.used < usage.weapons.max;
    case "shield":
      return usage.shields.used < usage.shields.max;
    default:
      return false;
  }
}
function countOwned(item) {
  if (item.cat === "special")
    return playerShip.specials.filter((s) => s === item.name).length;
  switch (item.cat) {
    case "gadget":
      return playerShip.gadgets.filter((g) => g === item.name).length;
    case "weapon":
      return playerShip.weapons.filter((w) => w === item.name).length;
    case "shield":
      return playerShip.shields.filter((s) => s === item.name).length;
    default:
      return 0;
  }
}
function canSellEquip(item) {
  if (item.cat === "special") {
    if (
      item.name === "Escape pod" &&
      typeof playerHasInsurance !== "undefined" &&
      playerHasInsurance
    )
      return false;
    return playerShip.specials.includes(item.name);
  }
  const cnt = countOwned(item);
  if (cnt === 0) return false;
  if (item.name === "5 extra cargo bays") {
    const s = SHIP_STATS[playerShip.name];
    const extraBays = playerShip.gadgets.filter(
      (g) => g === "5 extra cargo bays",
    ).length;
    const capacity = s.cargo + extraBays * 5;
    let used = 0;
    if (
      typeof TRADE_ITEMS !== "undefined" &&
      typeof playerCargo !== "undefined"
    ) {
      TRADE_ITEMS.forEach((ti) => {
        used += playerCargo[ti.id] || 0;
      });
    }
    used += 0;
    return used <= capacity - 5;
  }
  return true;
}
function sellEquip(item) {
  if (!canSellEquip(item)) return false;
  const arr =
    item.cat === "gadget"
      ? playerShip.gadgets
      : item.cat === "weapon"
        ? playerShip.weapons
        : item.cat === "shield"
          ? playerShip.shields
          : item.cat === "special"
            ? playerShip.specials
            : null;
  if (!arr) return false;
  const idx = arr.indexOf(item.name);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  if (typeof window._updateAttackBtn === "function") window._updateAttackBtn();
  const refund = Math.floor((item.price * 3) / 4);
  playerCredits += refund;
  savePlayerShip();
  if (typeof saveTradeState === "function") saveTradeState();
  if (typeof saveState === "function") saveState();
  if (typeof beginMissionCancelBatch === "function") beginMissionCancelBatch();
  if (typeof cancelExcessHeroMissions === "function")
    cancelExcessHeroMissions("no weapons");
  if (typeof cancelExcessManhuntMissions === "function")
    cancelExcessManhuntMissions("no weapons");
  if (typeof sendMissionCancelBatchMail === "function") sendMissionCancelBatchMail();
  return true;
}
const SHIP_STATS = {
  Flea: {
    cargo: 10,
    weapons: 0,
    shields: 0,
    gadgets: 0,
    quarters: 0,
    fuel: 20,
    hull: 25,
    price: 2000,
    costOfFuel: 1,
    repairCosts: 1,
    tech: TECH_EARLY_INDUSTRIAL,
  },
  Gnat: {
    cargo: 15,
    weapons: 1,
    shields: 0,
    gadgets: 1,
    quarters: 0,
    fuel: 14,
    hull: 100,
    price: 10000,
    costOfFuel: 2,
    repairCosts: 1,
    tech: TECH_INDUSTRIAL,
  },
  Firefly: {
    cargo: 20,
    weapons: 1,
    shields: 1,
    gadgets: 1,
    quarters: 0,
    fuel: 17,
    hull: 100,
    price: 25000,
    costOfFuel: 3,
    repairCosts: 1,
    tech: TECH_INDUSTRIAL,
  },
  Mosquito: {
    cargo: 15,
    weapons: 2,
    shields: 1,
    gadgets: 1,
    quarters: 0,
    fuel: 13,
    hull: 100,
    price: 30000,
    costOfFuel: 5,
    repairCosts: 1,
    tech: TECH_INDUSTRIAL,
  },
  Bumblebee: {
    cargo: 25,
    weapons: 1,
    shields: 2,
    gadgets: 2,
    quarters: 1,
    fuel: 15,
    hull: 100,
    price: 60000,
    costOfFuel: 7,
    repairCosts: 1,
    tech: TECH_INDUSTRIAL,
  },
  Beetle: {
    cargo: 50,
    weapons: 0,
    shields: 1,
    gadgets: 1,
    quarters: 2,
    fuel: 14,
    hull: 50,
    price: 80000,
    costOfFuel: 10,
    repairCosts: 1,
    tech: TECH_INDUSTRIAL,
  },
  Hornet: {
    cargo: 20,
    weapons: 3,
    shields: 2,
    gadgets: 1,
    quarters: 1,
    fuel: 16,
    hull: 150,
    price: 100000,
    costOfFuel: 15,
    repairCosts: 2,
    tech: TECH_POST_INDUSTRIAL,
  },
  Grasshopper: {
    cargo: 30,
    weapons: 2,
    shields: 2,
    gadgets: 3,
    quarters: 2,
    fuel: 15,
    hull: 150,
    price: 150000,
    costOfFuel: 15,
    repairCosts: 3,
    tech: TECH_POST_INDUSTRIAL,
  },
  Termite: {
    cargo: 60,
    weapons: 1,
    shields: 3,
    gadgets: 2,
    quarters: 2,
    fuel: 13,
    hull: 200,
    price: 225000,
    costOfFuel: 20,
    repairCosts: 4,
    tech: TECH_HIGH_TECH,
  },
  Wasp: {
    cargo: 35,
    weapons: 3,
    shields: 2,
    gadgets: 2,
    quarters: 2,
    fuel: 14,
    hull: 200,
    price: 300000,
    costOfFuel: 20,
    repairCosts: 4,
    tech: TECH_HIGH_TECH,
  },
  Dragonfly: {
    cargo: 10,
    weapons: 2,
    shields: 3,
    gadgets: 2,
    quarters: 1,
    fuel: 18,
    hull: 10,
    price: 0,
    costOfFuel: 3,
    repairCosts: 2,
    tech: TECH_POST_INDUSTRIAL,
  },
  Mantis: {
    cargo: 35,
    weapons: 3,
    shields: 1,
    gadgets: 3,
    quarters: 3,
    fuel: 15,
    hull: 300,
    price: 0,
    costOfFuel: 5,
    repairCosts: 3,
    tech: TECH_POST_INDUSTRIAL,
  },
  Police: {
    cargo: 0,
    weapons: 3,
    shields: 2,
    gadgets: 2,
    quarters: 2,
    fuel: 17,
    hull: 200,
    price: 50000,
    costOfFuel: 4,
    repairCosts: 2,
    tech: TECH_POST_INDUSTRIAL,
  },
  Scarab: {
    cargo: 20,
    weapons: 2,
    shields: 0,
    gadgets: 2,
    quarters: 2,
    fuel: 12,
    hull: 400,
    price: 0,
    costOfFuel: 8,
    repairCosts: 5,
    tech: TECH_POST_INDUSTRIAL,
  },
  Scorp: {
    cargo: 20,
    weapons: 4,
    shields: 2,
    gadgets: 2,
    quarters: 1,
    fuel: 14,
    hull: 250,
    price: 0,
    costOfFuel: 6,
    repairCosts: 3,
    tech: TECH_POST_INDUSTRIAL,
  },
};
const SHIP_VIEWBOX_OFFSET = {
  flea: { ox: 38.0, oy: -28.7 },
  gnat: { ox: -11.9, oy: -44.1 },
  firefly: { ox: -28.0, oy: -29.5 },
  mosquito: { ox: 29.0, oy: -2.3 },
  bumblebee: { ox: 17.5, oy: -16.8 },
  beetle: { ox: -9.5, oy: -51.2 },
  hornet: { ox: -64.0, oy: 49.5 },
  grasshopper: { ox: 86.7, oy: -28.5 },
  termite: { ox: -8.0, oy: -27.3 },
  wasp: { ox: 69.8, oy: -3.1 },
  dragonfly: { ox: 59.5, oy: 7.8 },
  mantis: { ox: -57.7, oy: -0.4 },
  police: { ox: 41.7, oy: -15.5 },
  scarab: { ox: 32.1, oy: -13.7 },
  scorp: { ox: -32.5, oy: -9.6 },
};
const shipSvgCache = {};
async function shipSvgFor(name) {
  const key = name.toLowerCase();
  if (shipSvgCache[key]) return shipSvgCache[key];
  let b64 = Z[key];
  if (!b64) b64 = ZS[key];
  if (!b64) return null;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes]);
  const ds = new DecompressionStream("gzip");
  let svg = await new Response(blob.stream().pipeThrough(ds)).text();
  const wMatch = svg.match(/width="(\d+)"/);
  const hMatch = svg.match(/height="(\d+)"/);
  const w = wMatch ? wMatch[1] : "1254";
  const h = hMatch ? hMatch[1] : "1254";
  const ofs = SHIP_VIEWBOX_OFFSET[key] || { ox: 0, oy: 0 };
  svg = svg.replace(
    "<svg",
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ofs.ox} ${ofs.oy} ${w} ${h}"`,
  );
  shipSvgCache[key] = svg;
  return svg;
}
async function shipRenderPreview(name) {
  const el = document.getElementById("ship-preview-image");
  if (!el) return;
  el.innerHTML = "";
  const svg = await shipSvgFor(name);
  if (svg) el.innerHTML = svg;
}
function slideOutAndIn(dir, onDone) {
  if (shipAnimating) return;
  shipAnimating = true;
  const slider = document.getElementById("ship-slider");
  if (!slider) {
    shipAnimating = false;
    return;
  }
  const w = document.getElementById("ship-content").clientWidth;
  const outX = -dir * w;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlideOut() {
    slider.removeEventListener("transitionend", onSlideOut);
    onDone();
    const newSlider = document.getElementById("ship-slider");
    if (!newSlider) {
      shipAnimating = false;
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
      shipAnimating = false;
    });
  });
}
function shipSlideOutAndIn(dir) {
  if (shipPageIdx === 1) {
    const maxIdx = Math.ceil(EQUIP_ITEMS.length / EQUIP_PER_PAGE) - 1;
    const newIdx = shipEquipIdx + dir;
    if (newIdx < 0 || newIdx > maxIdx) return;
    slideOutAndIn(dir, () => {
      shipEquipIdx = newIdx;
      renderShipPages();
    });
    return;
  }
  if (shipPageIdx === 2) {
    const newIdx = shipStoreIdx + dir;
    if (newIdx < 0 || newIdx >= STORE_SHIPS.length) return;
    slideOutAndIn(dir, () => {
      shipStoreIdx = newIdx;
      renderShipPages();
    });
    return;
  }
  if (shipAnimating) return;
  const newIdx = Math.max(0, Math.min(3, shipPageIdx + dir));
  slideOutAndIn(dir, () => {
    shipPageIdx = newIdx;
    renderShipPages();
  });
}
function goToShipPage(targetIdx) {
  if (
    shipAnimating ||
    targetIdx < 0 ||
    targetIdx > 3 ||
    targetIdx === shipPageIdx
  )
    return;
  const dir = targetIdx > shipPageIdx ? 1 : -1;
  const steps = Math.abs(targetIdx - shipPageIdx);
  const slider = document.getElementById("ship-slider");
  if (!slider) return;
  const w = document.getElementById("ship-content").clientWidth;
  const outX = -dir * w * steps;
  shipAnimating = true;
  slider.style.transition = "transform 0.25s ease";
  slider.style.transform = `translateX(${outX}px)`;
  slider.addEventListener("transitionend", function onSlide() {
    slider.removeEventListener("transitionend", onSlide);
    shipPageIdx = targetIdx;
    renderShipPages();
    const newSlider = document.getElementById("ship-slider");
    if (!newSlider) {
      shipAnimating = false;
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
      shipAnimating = false;
    });
  });
}
function renderShipPages() {
  const pages = [
    `<div class="ship-page">
            <div id="ship-preview">
                <div id="ship-preview-image"></div>
                <div id="ship-preview-stats" class="split-stats">${(function () {
                  const s = SHIP_STATS[playerShip.name];
                  const u = getSlotUsage();
                  const extraBays = playerShip.gadgets.filter(
                    (g) => g === "5 extra cargo bays",
                  ).length;
                  const cargo = s.cargo + extraBays * 5;
                  let cargoUsed = 0;
                  if (
                    typeof TRADE_ITEMS !== "undefined" &&
                    typeof playerCargo !== "undefined"
                  ) {
                    TRADE_ITEMS.forEach((ti) => {
                      cargoUsed += playerCargo[ti.id] || 0;
                    });
                  }
                  cargoUsed += 0;
                  const hiredCrew = window.CREW_NAMES
                    ? window.CREW_NAMES.filter((c) => c.hired).length
                    : 0;
                  const ridePassengers =
                    typeof activeMissions !== "undefined"
                      ? activeMissions.filter((m) => m.type === "ride").reduce((sum, m) => sum + (m.quartersRequired || 1), 0)
                      : 0;
                  const occupiedQuarters = hiredCrew + ridePassengers;
                  return `
                    <div data-value="${occupiedQuarters}/${s.quarters}">Crew Quarters</div><div>${occupiedQuarters}/${s.quarters}</div>
                    <div data-value="${u.gadgets.used}/${u.gadgets.max}">Gadgets</div><div>${u.gadgets.used}/${u.gadgets.max}</div>
                    <div data-value="${u.weapons.used}/${u.weapons.max}">Weapons</div><div>${u.weapons.used}/${u.weapons.max}</div>
                    <div data-value="${u.shields.used}/${u.shields.max}">Shields</div><div>${u.shields.used}/${u.shields.max}</div>
                    <div data-value="${cargoUsed}/${cargo}">Cargo Bays</div><div>${cargoUsed}/${cargo}</div>
                    <div data-value="${playerFuel}/${maxFuelCapacity()}">Fuel Tanks</div><div>${playerFuel}/${maxFuelCapacity()}</div>
                    <div data-value="${playerShip.hull != null ? playerShip.hull : maxHull()}/${maxHull()}">Hull Strength</div><div>${playerShip.hull != null ? playerShip.hull : maxHull()}/${maxHull()}</div>`;
                })()}
                </div>
            </div>
        </div>`,
    `<div class="ship-page"><div id="equip-columns">${(function () {
      const curTech =
        typeof currentStar !== "undefined" && currentStar
          ? getTechLevel(currentStar)
          : 0;
      const start = shipEquipIdx * EQUIP_PER_PAGE;
      const pageItems = EQUIP_ITEMS.slice(start, start + EQUIP_PER_PAGE);
      const left = pageItems.slice(0, 2);
      const right = pageItems.slice(2);
      const row = (items) =>
        items
          .map((item) => {
            const enoughTech = curTech >= item.tech;
            const cnt = countOwned(item);
            const canSlot = canBuyEquip(item);
            const isCumulable =
              item.cat !== "gadget" || item.name === "5 extra cargo bays";
            const ts = traderSkillTotal();
            const discountedPrice = Math.floor((item.price * (100 - ts)) / 100);
            const canBuy =
              enoughTech &&
              canSlot &&
              !(cnt > 0 && !isCumulable) &&
              !(typeof loanDebt !== "undefined" && loanDebt >= 100000) &&
              (typeof playerCredits === "undefined" ||
                playerCredits >= discountedPrice);
            const canSell = canSellEquip(item);
            const dimmed = !enoughTech;
            const catIcon =
              item.cat === "gadget"
                ? ICON_GADGET
                : item.cat === "weapon"
                  ? ICON_WEAPON
                  : item.cat === "special"
                    ? item.name === "Escape pod" ||
                      item.name === "Fuel compactor"
                      ? ICON_ASTROID
                      : ICON_SPARKLES
                    : ICON_SHIELD;
            return `
                <div class="equip-row${dimmed ? " dimmed" : ""}" data-equip="${item.name}">
                    <div class="equip-row-top">
                        <div class="equip-name-wrap">
                            <span class="equip-name">${item.name}${cnt > 0 ? ` <span class="equip-owns">${ICON_CHECK.repeat(cnt)}</span>` : ""}</span>
                            <span class="equip-desc">${item.desc}</span>
                        </div>
                        <span class="equip-price">${discountedPrice}&nbsp;cr</span>
                    </div>
                    <div class="equip-btns">
                        <button class="equip-btn buy" data-equip="${item.name}" data-price="${discountedPrice}"${!canBuy ? " disabled" : ""}>Buy</button>
                        <button class="equip-btn sell" data-equip="${item.name}"${!canSell ? " disabled" : ""}>Sell ${Math.floor((item.price * 3) / 4)} cr</button>
                    </div>
                    <span class="equip-icon">${catIcon}</span>
                </div>`;
          })
          .join("");
      return `
            <div class="equip-col"><div class="equip-items">${row(left)}</div></div>
            <div class="equip-col"><div class="equip-items">${row(right)}</div></div>`;
    })()}
        </div></div>`,
    null,
    `<div class="ship-page">
            <div id="fuel-panel">
                <div id="fuel-stats">${(function () {
                  const maxFuel = maxFuelCapacity();
                  const cost = fuelCostPerUnit();
                  const toFill = maxFuel - playerFuel;
                  const canBuy = toFill > 0 && playerCredits >= cost;
                  const maxBuy = canBuy
                    ? Math.min(toFill, Math.floor(playerCredits / cost))
                    : 0;
                  return `
                    <div class="fuel-loan-form">
                        <label for="fuel-slider" class="slider-label">
                            <span id="fuel-slider-value">Units: <span id="fuel-slider-num" class="slider-val">0</span></span>
                            <span class="slider-val">Total: <span id="fuel-total-price">0</span> cr</span>
                        </label>
                        <div class="fuel-loan-controls">
                            <input type="range" id="fuel-slider" min="0" max="${maxBuy}" value="0"${maxBuy <= 0 ? " disabled" : ""}>
                            <button id="btn-fuel-half"${maxBuy <= 0 ? " disabled" : ""}>50%</button>
                            <button id="btn-fuel-max"${maxBuy <= 0 ? " disabled" : ""}>Max</button>
                            <button id="btn-fuel-buy">Buy</button>
                        </div>
                    </div>
                    <div class="auto-fuel-row">
                        <label class="auto-fuel-label"><input type="checkbox" id="chk-auto-fuel"${typeof autoFuel !== "undefined" && autoFuel ? " checked" : ""}> Auto-refuel on arrival</label>
                    </div>`;
                })()}
                </div>
            </div>
            <div id="hull-repair-section">
                <div id="hull-stats">${(function () {
                  const s = SHIP_STATS[playerShip.name];
                  const maxH = maxHull();
                  const cur = playerShip.hull != null ? playerShip.hull : maxH;
                  const repairCost =
                    s.repairCosts || Math.floor(s.price / s.hull / 10);
                  const damage = maxH - cur;
                  const maxBuy =
                    damage > 0
                      ? Math.min(damage, Math.floor(playerCredits / repairCost))
                      : 0;
                  return `
                    <div class="hull-loan-form">
                        <label for="hull-slider" class="slider-label">
                            <span id="hull-slider-value">Points: <span id="hull-slider-num" class="slider-val">0</span></span>
                            <span class="slider-val">Total: <span id="hull-total-price">0</span> cr</span>
                        </label>
                        <div class="hull-loan-controls">
                            <input type="range" id="hull-slider" min="0" max="${maxBuy}" value="0"${maxBuy <= 0 ? " disabled" : ""}>
                            <button id="btn-hull-half"${maxBuy <= 0 ? " disabled" : ""}>50%</button>
                            <button id="btn-hull-max"${maxBuy <= 0 ? " disabled" : ""}>Max</button>
                            <button id="btn-hull-buy">Repair</button>
                        </div>
                    </div>
                    <div class="auto-hull-row">
                        <label class="auto-hull-label"><input type="checkbox" id="chk-auto-repair"${typeof autoRepair !== "undefined" && autoRepair ? " checked" : ""}> Auto-repair on arrival</label>
                    </div>`;
                })()}
                </div>
            </div>
        </div>`,
  ];
  let html;
  let shipName;
  if (shipPageIdx === 2) {
    shipBuyName = STORE_SHIPS[shipStoreIdx];
    shipName = shipBuyName;
    const s = SHIP_STATS[shipName];
    const np = shipNetPrice(shipName);
    const curTech =
      typeof currentStar !== "undefined" && currentStar
        ? getTechLevel(currentStar)
        : 0;
    const enoughTech = shipName === "Police" || curTech >= s.tech;
    const inDebt = typeof loanDebt !== "undefined" && loanDebt >= 100000;
    const alreadyOwn = playerShip.name === shipName;
    const policeLocked =
      shipName === "Police" &&
      (typeof policeRecordScore === "undefined" || policeRecordScore < 10);
    const policeSystemLocked =
      shipName === "Police" &&
      (!currentStar || currentStar.system !== "Military");
    const cantBuy =
      !enoughTech ||
      (inDebt && np.net > 0) ||
      alreadyOwn ||
      policeLocked ||
      policeSystemLocked;
    const canAfford =
      typeof playerCredits !== "undefined" &&
      (np.net <= 0 || playerCredits >= np.net);
    const shipClass =
      !enoughTech || policeLocked || policeSystemLocked ? " dimmed" : "";
    const btnBuyText = alreadyOwn
      ? "Owned"
      : policeLocked
        ? "Locked"
        : policeSystemLocked
          ? "Not Sold"
          : !enoughTech
            ? "Not Sold"
            : "Buy";
    const inMilitarySystem = currentStar && currentStar.system === "Military";
    const storeReqNote =
      shipName === "Police"
        ? `<div class="store-req">Required Record: <span class="${policeLocked ? "c-red" : "c-green"}">Trusted+</span><br><span class="store-req-military">${inMilitarySystem ? '<span class="c-green">Available in this system</span>' : "Available in military systems only"}</span></div>`
        : "";
    html = `<div class="ship-page${shipClass}">
            <div id="ship-preview">
                <div class="buy-wrap">
                    <div id="ship-preview-image"></div>
                    <button class="equip-btn buy" id="btn-buy-ship"${cantBuy || !canAfford ? " disabled" : ""}>${btnBuyText}</button>
                </div>
                <div id="ship-store-info">
                    <div id="ship-preview-stats">
                        <div>Crew Quarters: ${s.quarters}</div>
                        <div>Gadgets: ${s.gadgets}</div>
                        <div>Weapons: ${s.weapons}</div>
                        <div>Shields: ${s.shields}</div>
                        <div>Cargo Bays: ${s.cargo}</div>
                        <div>Fuel Tanks: ${s.fuel}</div>
                        <div>Hull Strength: ${s.hull}</div>
                    </div>
                    ${storeReqNote}
                </div>
            </div>
        </div>`;
  } else {
    html = pages[shipPageIdx];
    shipName = STORE_SHIPS[0];
  }
  var slider = document.getElementById("ship-slider");
  if (!slider) return;
  slider.innerHTML = html;
  if (shipPageIdx === 0) {
    const el = document.getElementById("ship-preview-image");
    if (el && playerShip) {
      (async () => {
        try {
          const svg = await shipSvgFor(playerShip.name);
          if (svg) el.innerHTML = svg;
        } catch (e) {}
      })();
    }
  } else if (shipPageIdx === 1) {
    document
      .querySelectorAll("#ship-slider .equip-btn.buy[data-equip]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const equip = btn.dataset.equip;
          const price = parseInt(btn.dataset.price);
          const item = EQUIP_ITEMS.find((e) => e.name === equip);
          if (!item) return;
          if (typeof playerCredits === "undefined" || playerCredits < price)
            return;
          if (!canBuyEquip(item)) return;
          playerCredits -= price;
          switch (item.cat) {
            case "gadget":
              playerShip.gadgets.push(item.name);
              break;
            case "weapon":
              playerShip.weapons.push(item.name);
              if (typeof window._updateAttackBtn === "function")
                window._updateAttackBtn();
              break;
            case "shield":
              playerShip.shields.push(item.name);
              break;
            case "special":
              playerShip.specials.push(item.name);
              break;
          }
          savePlayerShip();
          if (typeof updateGameDate === "function") updateGameDate();
          if (typeof saveTradeState === "function") saveTradeState();
          if (typeof saveState === "function") saveState();
          renderShipPages();
        });
      });
    document
      .querySelectorAll("#ship-slider .equip-btn.sell[data-equip]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const equip = btn.dataset.equip;
          const item = EQUIP_ITEMS.find((e) => e.name === equip);
          if (!item) return;
          if (!sellEquip(item)) return;
          if (playerShip.hull != null && playerShip.hull > maxHull())
            playerShip.hull = maxHull();
          if (typeof updateGameDate === "function") updateGameDate();
          if (typeof saveTradeState === "function") saveTradeState();
          if (typeof saveState === "function") saveState();
          renderShipPages();
        });
      });
  } else if (shipPageIdx !== 3) {
    shipRenderPreview(shipName);
  }
  if (shipPageIdx === 2) {
    const buyShipBtn = document.getElementById("btn-buy-ship");
    if (buyShipBtn) {
      buyShipBtn.addEventListener("click", () => {
        const np = shipNetPrice(shipName);
        const msgEl = document.getElementById("ship-buy-msg");
        const transferred = np.transferItems.filter((ei) => ei.canTransfer);
        const sold = np.transferItems.filter((ei) => !ei.canTransfer);
        function renderEquipRows(items, cls, sign, priceField, qtyField) {
          if (items.length === 0) return "";
          return items
            .map((ei) => {
              const qty = qtyField ? ei[qtyField] : ei.qty;
              if (qty <= 0) return "";
              const label = qty > 1 ? `${ei.name} ×${qty}` : ei.name;
              return `<div class="cost-row"><span>${label}</span><span class="${cls}">${sign}${(ei[priceField] * qty).toLocaleString()} cr</span></div>`;
            })
            .join("");
        }
        const transferRows = renderEquipRows(
          transferred,
          "c-red",
          "-",
          "transferCost",
          "transferable",
        );
        const sellRows = renderEquipRows(
          sold,
          "c-green",
          "+",
          "sellValue",
          "lostQty",
        );
        const sellTotal = sold.reduce(
          (sum, ei) => sum + ei.sellValue * ei.lostQty,
          0,
        );
        let transferSection = "";
        if (transferred.length > 0) {
          transferSection += `<div class="sep">${transferRows}`;
          if (np.extraCost > 0)
            transferSection += `<div class="sep fw-row c-muted"><span>Transfer total:</span><span class="c-red">-${np.extraCost.toLocaleString()} cr</span></div>`;
          transferSection += `</div>`;
        }
        if (sold.length > 0) {
          transferSection += `<div class="sep">${sellRows}`;
          if (sellTotal > 0)
            transferSection += `<div class="sep fw-row c-muted"><span>Sold total:</span><span class="c-green">+${sellTotal.toLocaleString()} cr</span></div>`;
          transferSection += `</div>`;
        }
        if (msgEl) {
          document.getElementById("btn-ship-buy-confirm").disabled = false;
          let crewSection = "";
          const newQuarters = SHIP_STATS[shipBuyName].quarters;
          if (typeof window.CREW_NAMES !== "undefined") {
            const hired = window.CREW_NAMES.filter((c) => c.hired);
            if (newQuarters > 0) {
              const mustFire = hired.length - newQuarters;
              if (mustFire > 0) {
                crewSection = `<div class="sep">
                                    <div class="crew-label">Only <span class="c-red">${newQuarters}</span> quarter${newQuarters !== 1 ? "s" : ""}, who will you keep?</div>`;
                hired.forEach((c) => {
                  crewSection += `<div class="crew-row">
                                        <span class="crew-name">${c.name} <span class="crew-warp">${c.cost} cr/warp</span></span>
                                        <button class="crew-fire-btn" data-name="${c.name}" data-fire="false">Keep</button>
                                    </div>`;
                });
                crewSection += `</div>`;
              }
            } else if (hired.length > 0) {
              crewSection = `<div class="sep">
                                <div class="crew-label">No quarters, <span class="c-red">${hired.length}</span> crew member${hired.length !== 1 ? "s" : ""} will be dismissed</div>
                            </div>`;
            }
          }
          const headerEl = document.getElementById("ship-buy-header");
          if (headerEl)
            headerEl.innerHTML = `Confirm Purchase<div class="confirm-sub">${playerShip.name} ${ICON_TRAVEL} ${shipBuyName}</div>`;
          msgEl.innerHTML = `
                    <div class="buy-details">
                        <div class="fw-row"><span>Discounted price:</span><span class="c-gold">${np.buyPrice.toLocaleString()} cr</span></div>
                        ${np.hullDamageDed > 0 ? `<div class="fw-row"><span>Hull damage:</span><span class="c-red">-${np.hullDamageDed.toLocaleString()} cr</span></div>` : ""}
                        ${np.fuelMissingDed > 0 ? `<div class="fw-row"><span>Fuel missing:</span><span class="c-red">-${np.fuelMissingDed.toLocaleString()} cr</span></div>` : ""}
                        <div class="fw-row"><span>Trade-in value:</span><span class="c-green">-${np.tradeIn.toLocaleString()} cr</span></div>
                        ${np.cargoVal > 0 ? `<div class="fw-row"><span>Cargo value:</span><span class="c-green">-${np.cargoVal.toLocaleString()} cr</span></div>` : ""}
                        ${transferSection}
                        ${crewSection}
                        <div class="net-row">${np.net <= 0 ? `<span>Credit:</span><span class="c-green">${Math.abs(np.net).toLocaleString()} cr</span>` : `<span>Net cost:</span><span class="c-gold">${np.net.toLocaleString()} cr</span>`}</div>
                    </div>`;
          if (crewSection) {
            const fireBtns = msgEl.querySelectorAll(".crew-fire-btn");
            if (fireBtns.length > 0) {
              const mustFire =
                window.CREW_NAMES.filter((c) => c.hired).length - newQuarters;
              fireBtns.forEach((btn) => {
                btn.addEventListener("click", () => {
                  const isFire = btn.dataset.fire === "true";
                  btn.dataset.fire = isFire ? "false" : "true";
                  btn.textContent = isFire ? "Keep" : "Fire";
                  btn.classList.toggle("fire", !isFire);
                  const fireCount = msgEl.querySelectorAll(
                    '.crew-fire-btn[data-fire="true"]',
                  ).length;
                  document.getElementById("btn-ship-buy-confirm").disabled =
                    fireCount < mustFire;
                });
              });
              document.getElementById("btn-ship-buy-confirm").disabled = true;
            }
          }
        }
        document.getElementById("ship-buy-overlay").classList.remove("hidden");
      });
    }
  }
  if (shipPageIdx === 3) {
    const slider = document.getElementById("fuel-slider");
    const btnHalf = document.getElementById("btn-fuel-half");
    const btnMax = document.getElementById("btn-fuel-max");
    const btnBuy = document.getElementById("btn-fuel-buy");
    const chkAuto = document.getElementById("chk-auto-fuel");
    const fuelValue = document.getElementById("fuel-slider-num");
    const fuelTotal = document.getElementById("fuel-total-price");
    const costPerUnit = fuelCostPerUnit();
    const updateFuelValue = () => {
      const val = parseInt(slider.value);
      if (fuelValue) fuelValue.textContent = val;
      if (fuelTotal)
        fuelTotal.textContent = (val * costPerUnit).toLocaleString();
      if (btnBuy) btnBuy.disabled = val === 0;
    };
    updateFuelValue();
    slider.addEventListener("input", updateFuelValue);
    if (btnHalf)
      btnHalf.addEventListener("click", () => {
        const max = parseInt(slider.max);
        slider.value = Math.floor(max / 2);
        updateFuelValue();
      });
    if (btnMax)
      btnMax.addEventListener("click", () => {
        slider.value = slider.max;
        updateFuelValue();
      });
    if (btnBuy)
      btnBuy.addEventListener("click", () => {
        attemptPurchaseOfFuel(parseInt(slider.value));
        renderShipPages();
      });
    if (chkAuto)
      chkAuto.addEventListener("change", () => {
        autoFuel = chkAuto.checked;
        saveTradeState();
      });
    var chkAutoRepair = document.getElementById("chk-auto-repair");
    if (chkAutoRepair)
      chkAutoRepair.addEventListener("change", () => {
        autoRepair = chkAutoRepair.checked;
        saveTradeState();
      });
    const hullSlider = document.getElementById("hull-slider");
    const hullBtnHalf = document.getElementById("btn-hull-half");
    const hullBtnMax = document.getElementById("btn-hull-max");
    const hullBtnBuy = document.getElementById("btn-hull-buy");
    const hullValue = document.getElementById("hull-slider-num");
    const hullTotal = document.getElementById("hull-total-price");
    const hullCostPerPoint = () => {
      const s = SHIP_STATS[playerShip.name];
      return s.repairCosts || Math.floor(s.price / s.hull / 10);
    };
    const updateHullValue = () => {
      const val = parseInt(hullSlider.value);
      if (hullValue) hullValue.textContent = val;
      if (hullTotal)
        hullTotal.textContent = (val * hullCostPerPoint()).toLocaleString();
      if (hullBtnBuy) hullBtnBuy.disabled = val === 0;
    };
    if (hullSlider) {
      updateHullValue();
      hullSlider.addEventListener("input", updateHullValue);
    }
    if (hullBtnHalf)
      hullBtnHalf.addEventListener("click", () => {
        const max = parseInt(hullSlider.max);
        hullSlider.value = Math.floor(max / 2);
        updateHullValue();
      });
    if (hullBtnMax)
      hullBtnMax.addEventListener("click", () => {
        hullSlider.value = hullSlider.max;
        updateHullValue();
      });
    if (hullBtnBuy)
      hullBtnBuy.addEventListener("click", () => {
        attemptHullRepair(parseInt(hullSlider.value));
        renderShipPages();
      });
  }
  const titleEl = document.getElementById("ship-title");
  if (titleEl)
    titleEl.textContent =
      shipPageIdx === 0
        ? "Ship: Status"
        : shipPageIdx === 1
          ? "Ship: Equipment Store"
          : shipPageIdx === 2
            ? "Ship: Store"
            : "Ship: Maintenance";
  const statusEl = document.getElementById("ship-status");
  if (statusEl) {
    if (shipPageIdx === 2) {
      const np = shipNetPrice(shipBuyName);
      statusEl.innerHTML = `${shipBuyName} · <span class="ship-price">${np.buyPrice.toLocaleString()} cr</span>`;
    } else if (shipPageIdx === 1) {
      const u = getSlotUsage();
      statusEl.textContent = `Gadgets: ${u.gadgets.used}/${u.gadgets.max} · Weapons: ${u.weapons.used}/${u.weapons.max} · Shields: ${u.shields.used}/${u.shields.max}`;
    } else if (shipPageIdx === 3) {
      const maxFuel = maxFuelCapacity();
      const curHull = playerShip.hull != null ? playerShip.hull : maxHull();
      statusEl.textContent = `Fuel: ${playerFuel}/${maxFuel} · Hull: ${curHull}/${maxHull()}`;
    } else {
      statusEl.textContent = `Current Ship: ${playerShip.name}`;
    }
  }
  const prevBtn = document.getElementById("btn-ship-prev");
  const nextBtn = document.getElementById("btn-ship-next");
  const sirenBtn = document.getElementById("btn-ship-siren");
  if (sirenBtn) {
    sirenBtn.style.display = shipPageIdx === 2 ? "flex" : "none";
    sirenBtn.disabled =
      shipPageIdx === 2 && STORE_SHIPS[shipStoreIdx] === "Police";
  }
  const showArrows = shipPageIdx === 1 || shipPageIdx === 2;
  if (prevBtn) {
    prevBtn.style.display = showArrows ? "flex" : "none";
    if (shipPageIdx === 1) {
      prevBtn.disabled = shipEquipIdx === 0;
    } else if (shipPageIdx === 2) {
      prevBtn.disabled = shipStoreIdx === 0;
    }
  }
  if (nextBtn) {
    nextBtn.style.display = showArrows ? "flex" : "none";
    if (shipPageIdx === 1) {
      const maxIdx = Math.ceil(EQUIP_ITEMS.length / EQUIP_PER_PAGE) - 1;
      nextBtn.disabled = shipEquipIdx >= maxIdx;
    } else if (shipPageIdx === 2) {
      nextBtn.disabled = shipStoreIdx >= STORE_SHIPS.length - 1;
    }
  }
  const shipHomeBtn = document.getElementById("btn-ship-home");
  const equipBtn = document.getElementById("btn-equip-store");
  const storeBtn = document.getElementById("btn-ship-store");
  const fuelBtn = document.getElementById("btn-ship-maintenance");
  if (shipHomeBtn) shipHomeBtn.disabled = shipPageIdx === 0;
  if (equipBtn) equipBtn.disabled = shipPageIdx === 1;
  if (storeBtn) storeBtn.disabled = shipPageIdx === 2;
  if (fuelBtn) fuelBtn.disabled = shipPageIdx === 3;
}
function renderShip() {
  initPlayerShip();
  document.getElementById("ship-sidebar").innerHTML =
    `<button id="btn-ship-home"></button><button id="btn-equip-store"></button><button id="btn-ship-store"></button><button id="btn-ship-maintenance"></button>`;
  const shipHomeBtn = document.getElementById("btn-ship-home");
  if (shipHomeBtn) {
    shipHomeBtn.innerHTML = ICON_SHIP;
    shipHomeBtn.addEventListener("click", () => goToShipPage(0));
  }
  const shipOwnedBtn = document.getElementById("btn-equip-store");
  if (shipOwnedBtn) {
    shipOwnedBtn.innerHTML = ICON_SPARKLES;
    shipOwnedBtn.addEventListener("click", () => {
      shipEquipIdx = 0;
      goToShipPage(1);
    });
  }
  const shipStoreBtn = document.getElementById("btn-ship-store");
  if (shipStoreBtn) {
    shipStoreBtn.innerHTML = ICON_SPACESHIP;
    shipStoreBtn.addEventListener("click", () => {
      shipStoreIdx = 0;
      if (shipPageIdx === 2) {
        renderShipPages();
      } else {
        goToShipPage(2);
      }
    });
  }
  const shipFuelBtn = document.getElementById("btn-ship-maintenance");
  if (shipFuelBtn) {
    shipFuelBtn.innerHTML = ICON_MAINTENANCE;
    shipFuelBtn.addEventListener("click", () => goToShipPage(3));
  }
  document.getElementById("ship-content").innerHTML = `
        <div id="ship-header">
            <div id="ship-header-left">
                <span id="ship-title">Ship: Status</span>
                <span id="ship-status">Current Ship: ${playerShip.name}</span>
            </div>
            <div id="ship-header-right">
                <button id="btn-ship-siren"></button>
                <button id="btn-ship-prev"></button>
                <button id="btn-ship-next"></button>
                <button id="btn-ship-close"></button>
            </div>
        </div>
        <div id="ship-slider"></div>`;
  document.getElementById("btn-ship-prev").innerHTML = ICON_CHEVRON_LEFT;
  document.getElementById("btn-ship-next").innerHTML = ICON_CHEVRON_RIGHT;
  document.getElementById("btn-ship-close").innerHTML = ICON_CLOSE;
  const sirenBtn = document.getElementById("btn-ship-siren");
  if (sirenBtn) {
    sirenBtn.innerHTML = ICON_RECORD.replace(/#00ff88/g, "#00c8ff");
    sirenBtn.addEventListener("click", () => {
      const policeIdx = STORE_SHIPS.indexOf("Police");
      if (shipPageIdx !== 2 || policeIdx === shipStoreIdx) return;
      const dir = policeIdx > shipStoreIdx ? 1 : -1;
      slideOutAndIn(dir, () => {
        shipStoreIdx = policeIdx;
        renderShipPages();
      });
    });
  }
  document.getElementById("btn-ship-close").addEventListener("click", hideShip);
  document
    .getElementById("btn-ship-prev")
    .addEventListener("click", () => shipSlideOutAndIn(-1));
  document
    .getElementById("btn-ship-next")
    .addEventListener("click", () => shipSlideOutAndIn(1));
  shipPageIdx = 0;
  renderShipPages();
  if (typeof updateFuelBlink === "function") updateFuelBlink();
}
function hideShip() {
  shipOverlay.classList.add("hidden");
  shipAnimating = false;
}
document.getElementById("btn-ship").addEventListener("click", () => {
  if (!shipOverlay.classList.contains("hidden")) {
    hideShip();
    return;
  }
  closeAllOverlays();
  renderShip();
  shipOverlay.classList.remove("hidden");
});
shipOverlay.addEventListener("click", (e) => {
  if (e.target === shipOverlay) {
    hideShip();
  }
});
function shipCanNavigate(dir) {
  if (shipPageIdx === 0 || shipPageIdx === 3) return false;
  const btn = document.getElementById(
    dir > 0 ? "btn-ship-next" : "btn-ship-prev",
  );
  return btn && !btn.disabled;
}
function shipSlideBack() {
  const slider = document.getElementById("ship-slider");
  if (!slider) return;
  slider.style.transition = "transform 0.2s ease";
  slider.style.transform = "translateX(0)";
  slider.addEventListener("transitionend", function onBack() {
    slider.removeEventListener("transitionend", onBack);
    slider.style.transition = "";
    slider.style.transform = "";
  });
}
let shipSwipeStartX = 0;
let shipSwipeActive = false;
const sp = document.getElementById("ship-panel");
function startShipDrag(clientX) {
  if (shipAnimating) return false;
  shipSwipeStartX = clientX;
  shipSwipeActive = true;
  const slider = document.getElementById("ship-slider");
  if (slider) {
    slider.style.transition = "none";
    slider.style.transform = "";
  }
  return true;
}
function moveShipDrag(clientX) {
  if (!shipSwipeActive) return;
  const slider = document.getElementById("ship-slider");
  if (!slider) return;
  const dx = clientX - shipSwipeStartX;
  slider.style.transform = `translateX(${dx}px)`;
}
function endShipDrag(clientX) {
  if (!shipSwipeActive) return;
  shipSwipeActive = false;
  const dx = clientX - shipSwipeStartX;
  const w = document.getElementById("ship-panel").clientWidth;
  if (Math.abs(dx) > w * 0.25) {
    const dir = dx > 0 ? -1 : 1;
    if (shipCanNavigate(dir)) {
      shipSlideOutAndIn(dir);
    } else {
      shipSlideBack();
    }
  } else {
    shipSlideBack();
  }
}
sp.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.closest("input")) return;
    startShipDrag(e.touches[0].clientX);
  },
  { passive: true },
);
sp.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      shipSwipeActive = false;
      return;
    }
    moveShipDrag(e.touches[0].clientX);
  },
  { passive: true },
);
sp.addEventListener("touchend", (e) => {
  endShipDrag(e.changedTouches[0].clientX);
});
sp.addEventListener("touchcancel", () => {
  shipSwipeActive = false;
  shipSlideBack();
});
sp.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest("button")) return;
  if (e.target.closest("input")) return;
  startShipDrag(e.clientX);
});
document.addEventListener("mousemove", (e) => {
  moveShipDrag(e.clientX);
});
document.addEventListener("mouseup", (e) => {
  endShipDrag(e.clientX);
});
window.refreshShipVisual = function (shipName) {
  if (typeof shipSvgFor !== "function") return;
  shipName = shipName || playerShip.name;
  var shipEl = document.getElementById("travel-ship");
  if (shipEl && shipEl.offsetParent !== null) {
    shipEl.style.left = "";
    shipEl.style.bottom = "";
    shipSvgFor(shipName).then(function (svg) {
      if (svg) shipEl.innerHTML = svg;
      shipEl.classList.toggle("police", shipName === "Police");
      if (typeof window._shipPx === "function") {
        var p = window._shipPx(shipName);
        shipEl.style.width = p + "px";
        shipEl.style.height = p + "px";
      }
      if (shipName === "Mantis" || shipName === "Scorp") {
        if (window.innerWidth > 600) {
          shipEl.style.left = "calc(50% - " + (300 + (p - 144) / 2) + "px)";
        } else {
          shipEl.style.bottom = 140 - (p - 144) + "px";
        }
      }
    });
  }
  var whShip = document.getElementById("wormhole-ship");
  var whOverlay = document.getElementById("wormhole-overlay");
  if (whShip && whOverlay && !whOverlay.classList.contains("hidden")) {
    shipSvgFor(shipName).then(function (svg) {
      if (svg) {
        var existing = whShip.querySelector("svg");
        if (existing) existing.remove();
        whShip.insertAdjacentHTML("afterbegin", svg);
        whShip.classList.toggle("police", shipName === "Police");
        if (typeof window._shipPx === "function") {
          var p = window._shipPx(shipName);
          whShip.style.width = p + "px";
          whShip.style.height = p + "px";
        }
      }
    });
  }
};
window.openCatchConfirm = function () {
  shipCatchMode = true;
  shipBuyName = window._enemyShipName || "";
  if (!shipBuyName || !SHIP_STATS[shipBuyName]) {
    shipCatchMode = false;
    return;
  }
  const content = document.getElementById("board-npc-content");
  if (!content) {
    shipCatchMode = false;
    return;
  }
  const enemyName = shipBuyName;
  const np = shipNetPrice(enemyName);
  const transferred = np.transferItems.filter((ei) => ei.canTransfer);
  const discarded = np.transferItems.filter((ei) => !ei.canTransfer);
  function catchRows(items, cls, label, qtyKey) {
    if (items.length === 0) return "";
    return items
      .map((ei) => {
        const qty = qtyKey ? ei[qtyKey] : ei.qty;
        if (qty <= 0) return "";
        const text = qty > 1 ? `${ei.name} ×${qty}` : ei.name;
        return `<div class="cost-row"><span>${text}</span><span class="${cls}">${label}</span></div>`;
      })
      .join("");
  }
  let crewSection = "";
  const newQuarters = SHIP_STATS[enemyName].quarters;
  if (typeof window.CREW_NAMES !== "undefined") {
    const hired = window.CREW_NAMES.filter((c) => c.hired);
    if (newQuarters > 0) {
      const mustFire = hired.length - newQuarters;
      if (mustFire > 0) {
        crewSection = `<div class="sep">
                                    <div class="crew-label">Only <span class="c-red">${newQuarters}</span> quarter${newQuarters !== 1 ? "s" : ""}, who will you keep?</div>`;
        hired.forEach((c) => {
          crewSection += `<div class="crew-row">
                                    <span class="crew-name">${c.name} <span class="crew-warp">${c.cost} cr/warp</span></span>
                                    <button class="crew-fire-btn" data-name="${c.name}" data-fire="false">Keep</button>
                                </div>`;
        });
        crewSection += `</div>`;
      }
    } else if (hired.length > 0) {
      crewSection = `<div class="sep">
                                <div class="crew-label">No quarters, <span class="c-red">${hired.length}</span> crew member${hired.length !== 1 ? "s" : ""} will be dismissed</div>
                            </div>`;
    }
  }
  let html = "";
  html += '<div id="board-npc-header">';
  html += '<div id="board-npc-header-left">';
  html += '<span id="board-npc-title">Confirm Catch</span>';
  html +=
    '<span id="board-npc-status">' +
    playerShip.name +
    " " +
    ICON_TRAVEL +
    " " +
    enemyName +
    "</span>";
  html += "</div>";
  html += "</div>";
  const rowsHtml =
    catchRows(transferred, "c-green", "transfer", "transferable") +
    catchRows(discarded, "c-red", "discarded", "lostQty") +
    crewSection;
  if (rowsHtml) {
    html += '<div class="buy-details">' + rowsHtml + "</div>";
  }
  html +=
    "<div class='net-row" +
    (rowsHtml ? "" : " no-sep") +
    "'><span>Cost:</span><span class='c-green'>Free</span></div>";
  html += '<div id="surrender-buttons">';
  html += '<button id="btn-catch-cancel" class="cancel">Cancel</button>';
  html += '<button id="btn-catch-confirm">Catch</button>';
  html += "</div>";
  content.innerHTML = html;
  document
    .getElementById("btn-catch-cancel")
    .addEventListener("click", closeBoardPlunder);
  if (crewSection) {
    const fireBtns = content.querySelectorAll(".crew-fire-btn");
    if (fireBtns.length > 0) {
      const crewMustFire =
        window.CREW_NAMES.filter((c) => c.hired).length - newQuarters;
      fireBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const isFire = btn.dataset.fire === "true";
          btn.dataset.fire = isFire ? "false" : "true";
          btn.textContent = isFire ? "Keep" : "Fire";
          btn.classList.toggle("fire", !isFire);
          const fireCount = content.querySelectorAll(
            '.crew-fire-btn[data-fire="true"]',
          ).length;
          document.getElementById("btn-catch-confirm").disabled =
            fireCount < crewMustFire;
        });
      });
      document.getElementById("btn-catch-confirm").disabled = true;
    }
  }
  document
    .getElementById("btn-catch-confirm")
    .addEventListener("click", executeShipBuyConfirm);
  document.getElementById("board-npc-overlay").classList.remove("hidden");
  ["ignore", "plunder", "catch"].forEach((a) => {
    const b = document.querySelector('.enc-btn[data-action="' + a + '"]');
    if (b) b.disabled = true;
  });
};
function executeShipBuyConfirm() {
  const s = SHIP_STATS[shipBuyName];
  const curTech =
    typeof currentStar !== "undefined" && currentStar
      ? getTechLevel(currentStar)
      : 0;
    if (!shipCatchMode && shipBuyName !== "Police" && curTech < s.tech) return;
    if (
      !shipCatchMode &&
      shipBuyName === "Police" &&
      (!currentStar || currentStar.system !== "Military")
    )
      return;
    if (
      !shipCatchMode &&
      shipBuyName === "Police" &&
      (typeof policeRecordScore === "undefined" || policeRecordScore < 10)
    )
      return;
    const np = shipNetPrice(shipBuyName);
    if (!shipCatchMode) playerCredits -= np.net;
    const oldShip = playerShip;
    playerShip = {
      name: shipBuyName,
      gadgets: [],
      weapons: [],
      shields: [],
      specials: [],
    };
    if (!shipCatchMode && oldShip.name === "Police" && shipBuyName !== "Police") {
      _sendPoliceDischargeMail();
    }
    np.transferItems.forEach((ti) => {
      if (!ti.canTransfer) return;
      const item = EQUIP_ITEMS.find((e) => e.name === ti.name);
      if (!item) return;
      const arr =
        item.cat === "gadget"
          ? playerShip.gadgets
          : item.cat === "weapon"
            ? playerShip.weapons
            : item.cat === "shield"
              ? playerShip.shields
              : item.cat === "special"
                ? playerShip.specials
                : null;
      if (!arr) return;
      const oldArr =
        item.cat === "gadget"
          ? oldShip.gadgets
          : item.cat === "weapon"
            ? oldShip.weapons
            : item.cat === "shield"
              ? oldShip.shields
              : item.cat === "special"
                ? oldShip.specials
                : null;
      if (!oldArr) return;
      for (let i = 0; i < (ti.transferable != null ? ti.transferable : ti.qty); i++) {
        const idx = oldArr.indexOf(ti.name);
        if (idx === -1) break;
        oldArr.splice(idx, 1);
        arr.push(ti.name);
      }
    });
    if (playerFuel > maxFuelCapacity()) playerFuel = maxFuelCapacity();
    if (shipCatchMode) {
      const maxH = SHIP_STATS[shipBuyName].hull;
      const enemyHull = window._enemyHull;
      playerShip.hull =
        enemyHull != null ? Math.max(1, Math.min(maxH, enemyHull)) : maxH;
    } else if (playerShip.hull != null && playerShip.hull > maxHull()) {
      playerShip.hull = maxHull();
    }
    if (shipCatchMode) {
      const recBefore =
        typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
      if (window._enemyType === "trader") {
        if (typeof policeRecordScore !== "undefined")
          policeRecordScore = Math.max(-100, policeRecordScore - 2);
      } else if (window._enemyType === "pirate") {
        if (typeof policeRecordScore !== "undefined")
          policeRecordScore = Math.max(-100, policeRecordScore - 1);
      }
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
      if (recBefore !== null && policeRecordScore !== recBefore)
        _flashStatDelta("pilot-record", policeRecordScore - recBefore);
      if (typeof updateInfoTravel === "function") updateInfoTravel();
    }
    const newCargoCap =
      SHIP_STATS[shipBuyName].cargo +
      playerShip.gadgets.filter((g) => g === "5 extra cargo bays").length * 5;
    const keptCargo = {};
    const keptLocked = {};
    const keptBuyPrice = {};
    let usedCap = 0;
    for (const id in lockedCargo) {
      const qty = lockedCargo[id] || 0;
      if (qty <= 0) continue;
      const held = playerCargo[id] || 0;
      const keep = Math.min(held, qty, Math.max(0, newCargoCap - usedCap));
      if (keep <= 0) continue;
      keptCargo[id] = keep;
      keptLocked[id] = keep;
      if (playerCargoBuyPrice && playerCargoBuyPrice[id] != null)
        keptBuyPrice[id] = playerCargoBuyPrice[id];
      usedCap += keep;
    }
    playerCargo = keptCargo;
    lockedCargo = keptLocked;
    playerCargoBuyPrice = keptBuyPrice;
    if (typeof beginMissionCancelBatch === "function") beginMissionCancelBatch();
    if (typeof checkDeliverCargoIntegrity === "function")
      checkDeliverCargoIntegrity("insufficient cargo");
    if (typeof saveTradeState === "function") saveTradeState();
    const newQuarters = SHIP_STATS[shipBuyName].quarters;
    if (typeof window.CREW_NAMES !== "undefined") {
      const fireBtns = document.querySelectorAll(
        '.crew-fire-btn[data-fire="true"]',
      );
      if (fireBtns.length > 0) {
        fireBtns.forEach((btn) => {
          const crew = window.CREW_NAMES.find(
            (c) => c.name === btn.dataset.name,
          );
          if (crew && crew.hired) {
            crew.hired = false;
            if (typeof addMailMessage === "function") {
              addMailMessage("Crew Departure", `${crew.name} was let go due to insufficient crew quarters on your new ship.`);
            }
          }
        });
      } else if (newQuarters === 0) {
        window.CREW_NAMES.forEach((c) => {
          if (c.hired) {
            c.hired = false;
            if (typeof addMailMessage === "function") {
              addMailMessage("Crew Departure", `${c.name} was let go due to insufficient crew quarters on your new ship.`);
            }
          }
        });
      }
      if (typeof saveCrewNames === "function") saveCrewNames();
    }
    if (typeof cancelExcessRideMissions === "function") cancelExcessRideMissions("insufficient quarters");
    if (typeof cancelExcessHeroMissions === "function") cancelExcessHeroMissions("no weapons");
    if (typeof cancelExcessManhuntMissions === "function") cancelExcessManhuntMissions("not a Police ship");
    if (typeof sendMissionCancelBatchMail === "function") sendMissionCancelBatchMail();
    savePlayerShip();
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof saveState === "function") saveState();
    if (
      typeof routePath !== "undefined" &&
      routePath.length > 1 &&
      typeof findPath === "function" &&
      typeof currentStar !== "undefined" &&
      currentStar
    ) {
      const dest = routePath[routePath.length - 1];
      routePath = findPath(currentStar, dest);
      if (typeof updateInfoClean === "function") updateInfoClean();
    }
    if (shipCatchMode) {
      document.getElementById("board-npc-overlay").classList.add("hidden");
    } else {
      document.getElementById("ship-buy-overlay").classList.add("hidden");
    }
    if (shipCatchMode) {
      shipCatchMode = false;
      if (typeof window._totalShieldPower === "function") {
        window._playerShieldMax = window._totalShieldPower(
          playerShip.shields || [],
        );
        window._playerShieldHp = window._playerShieldMax;
      }
      if (typeof window._updateStatusBars === "function")
        window._updateStatusBars();
      if (typeof window.refreshShipVisual === "function")
        window.refreshShipVisual(playerShip.name);
      if (typeof resumeTravel === "function") setTimeout(resumeTravel, 1500);
    }
    renderShipPages();
  }
document
  .getElementById("btn-ship-buy-confirm")
  .addEventListener("click", executeShipBuyConfirm);
document.getElementById("btn-ship-buy-cancel").addEventListener("click", () => {
  document.getElementById("ship-buy-overlay").classList.add("hidden");
  if (shipCatchMode) {
    shipCatchMode = false;
    document.getElementById("btn-ship-buy-confirm").textContent = "Buy";
    ["ignore", "plunder", "catch"].forEach((a) => {
      const b = document.querySelector('.enc-btn[data-action="' + a + '"]');
      if (b) b.disabled = false;
    });
  }
});
document.getElementById("ship-buy-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("ship-buy-overlay")) {
    document.getElementById("ship-buy-overlay").classList.add("hidden");
    if (shipCatchMode) {
      shipCatchMode = false;
      document.getElementById("btn-ship-buy-confirm").textContent = "Buy";
      ["ignore", "plunder", "catch"].forEach((a) => {
        const b = document.querySelector('.enc-btn[data-action="' + a + '"]');
        if (b) b.disabled = false;
      });
    }
  }
});
