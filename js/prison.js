// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function timePassed(days) {
  for (var i = 0; i < days; i++) {
    advanceTurn();
  }
}
function _processArrest() {
  var record = typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
  var nw =
    typeof netWorth === "function"
      ? netWorth()
      : typeof playerCredits !== "undefined"
        ? playerCredits
        : 0;
  var imprisonment = Math.max(30, -record);
  imprisonment = Math.min(imprisonment, 100);
  var recordMult = Math.min(80, Math.max(0, -record));
  var fine = (1 + Math.floor((nw * recordMult) / 100 / 500)) * 500;
  if (
    typeof playerCargo !== "undefined" &&
    typeof TRADE_ITEMS !== "undefined"
  ) {
    for (var key in playerCargo) {
      var ti = TRADE_ITEMS.find(function (t) {
        return t.id == key || t.name === key;
      });
      if (ti && ti.illegal && playerCargo[key] > 0) {
        delete playerCargo[key];
        if (typeof playerCargoBuyPrice !== "undefined")
          delete playerCargoBuyPrice[key];
      }
    }
  }
  if (window.CREW_NAMES) {
    window.CREW_NAMES.forEach(function (c) {
      c.hired = false;
    });
    if (typeof saveCrewNames === "function") saveCrewNames();
  }
  if (typeof playerHasInsurance !== "undefined") {
    playerHasInsurance = false;
    noClaim = 0;
  }
  timePassed(imprisonment);
  var couldPay = typeof playerCredits !== "undefined" && playerCredits >= fine;
  if (couldPay) {
    playerCredits -= fine;
  } else {
    var shipVal =
      typeof cargoAndShipValuationForInsurance === "function"
        ? cargoAndShipValuationForInsurance()
        : 0;
    var remaining =
      (typeof playerCredits !== "undefined" ? playerCredits : 0) +
      shipVal -
      fine;
    playerCredits = Math.max(0, remaining);
    if (typeof playerShip !== "undefined" && playerShip.name !== "Flea") {
      var transferResult =
        typeof getTransferableItems === "function"
          ? getTransferableItems("Flea")
          : null;
      var oldSpecials = playerShip.specials ? playerShip.specials.slice() : [];
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
      if (typeof savePlayerShip === "function") savePlayerShip();
    }
    playerFuel = maxFuelCapacity();
    saveFuelState();
  }
  if (typeof policeRecordScore !== "undefined") {
    policeRecordScore = -5;
  }
  if (typeof saveState === "function") saveState();
  if (
    typeof loanDebt !== "undefined" &&
    loanDebt > 0 &&
    typeof playerCredits !== "undefined"
  ) {
    if (playerCredits >= loanDebt) {
      playerCredits -= loanDebt;
      loanDebt = 0;
    } else {
      loanDebt -= playerCredits;
      playerCredits = 0;
    }
  }
  if (typeof clearMissionsOnDeath === "function") clearMissionsOnDeath(true);
  if (typeof addMailMessage === "function") {
    addMailMessage("Arrested", couldPay ? `You have been sentenced to ${imprisonment} day${imprisonment !== 1 ? "s" : ""} in prison and fined ${fine.toLocaleString()} cr. After paying the fine, your ship was not seized. Your record has been noted.` : `You have been sentenced to ${imprisonment} day${imprisonment !== 1 ? "s" : ""} in prison. Unable to pay the fine, your ship and cargo have been seized and sold. You are released with a Flea.`);
  }
  if (typeof updateInfoTravel === "function") updateInfoTravel();
  if (typeof updateGameDate === "function") updateGameDate();
  if (typeof saveTradeState === "function") saveTradeState();
  setTimeout(function () {
    var overlay = document.getElementById("travel-overlay");
    if (overlay) overlay.classList.add("hidden");
  }, 500);
}
