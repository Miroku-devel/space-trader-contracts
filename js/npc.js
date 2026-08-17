// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

(function () {
  var _plundered = false;
  function renderBoardPlunder() {
    var content = document.getElementById("board-npc-content");
    var cargo = window._enemyCargo || {};
    var cap = 0,
      used = 0;
    if (
      typeof SHIP_STATS !== "undefined" &&
      typeof playerShip !== "undefined"
    ) {
      cap =
        SHIP_STATS[playerShip.name].cargo +
        playerShip.gadgets.filter(function (g) {
          return g === "5 extra cargo bays";
        }).length *
          5;
      if (
        typeof TRADE_ITEMS !== "undefined" &&
        typeof playerCargo !== "undefined"
      ) {
        TRADE_ITEMS.forEach(function (ti) {
          used += playerCargo[ti.id] || 0;
        });
      }
      used += 0;
    }
    var freeCargo = cap - used;
    var enemyName = window._enemyShipName || "Enemy";
    var typeLabel =
      window._enemyTypeLabel ||
      (window._enemyType === "trader" ? "Trader" : "Pirate");
    var html = "";
    html += '<div id="board-npc-header">';
    html += '<div id="board-npc-header-left">';
    html +=
      '<span id="board-npc-title">' + typeLabel + " — " + enemyName + "</span>";
    html +=
      '<span id="board-npc-status">Cargo bays: ' + used + "/" + cap + "</span>";
    html += "</div>";
    html += '<div id="board-npc-header-right">';
    html +=
      '<button id="btn-board-npc-close">' +
      (typeof ICON_CLOSE !== "undefined" ? ICON_CLOSE : "X") +
      "</button>";
    html += "</div></div>";
    var hasCargo = false;
    for (var k in cargo) {
      if (cargo[k] > 0) {
        hasCargo = true;
        break;
      }
    }
    if (!hasCargo) {
      html +=
        '<div class="board-empty">No cargo to plunder.</div>';
      content.innerHTML = html;
      document
        .getElementById("btn-board-npc-close")
        .addEventListener("click", closeBoardPlunder);
      return;
    }
    html += '<div class="board-header">';
    html += '<span class="hdr-name">Item</span>';
    html +=
      '<span class="hdr-actions"><span class="hdr-take">Take</span></span>';
    html += '<span class="hdr-qty">Stk</span>';
    html += '<span class="hdr-hold">Qty</span>';
    html += "</div>";
    html += '<div class="board-items">';
    var keys = Object.keys(cargo)
      .filter(function (k) {
        return cargo[k] > 0;
      })
      .sort(function (a, b) {
        return parseInt(a) - parseInt(b);
      });
    for (var i = 0; i < keys.length; i++) {
      var itemIdx = parseInt(keys[i]);
      var qty = cargo[itemIdx];
      var item = null;
      if (typeof TRADE_ITEMS !== "undefined") item = TRADE_ITEMS[itemIdx];
      var name = item ? item.name : "Item " + itemIdx;
      var illegal = item ? item.illegal : false;
      var cnt =
        typeof playerCargo !== "undefined" ? playerCargo[itemIdx] || 0 : 0;
      var canTake = qty > 0 && freeCargo > 0;
      html += '<div class="board-row' + (canTake ? " profitable" : "") + '">';
      html +=
        '<span class="board-name' +
        (illegal ? " illegal" : "") +
        '">' +
        name +
        "</span>";
      html += '<span class="board-actions">';
      html += '<span class="board-action">';
      html +=
        '<button class="board-btn" onclick="window._boardTake(' +
        itemIdx +
        ',1)"' +
        (canTake ? "" : " disabled") +
        ">1</button>";
      html +=
        '<button class="board-btn" onclick="window._boardTake(' +
        itemIdx +
        ',5)"' +
        (canTake && qty >= 5 ? "" : " disabled") +
        ">5</button>";
      html +=
        '<button class="board-btn" onclick="window._boardTake(' +
        itemIdx +
        ',-1)"' +
        (canTake ? "" : " disabled") +
        ">All</button>";
      html += "</span>";
      html += "</span>";
      html += '<span class="board-qty">' + qty + "</span>";
      html += '<span class="board-hold">' + cnt + "</span>";
      html += "</div>";
    }
    html += "</div>";
    content.innerHTML = html;
    document
      .getElementById("btn-board-npc-close")
      .addEventListener("click", closeBoardPlunder);
  }
  function openBoardPlunder() {
    _plundered = false;
    renderBoardPlunder();
    var encBtns = document.querySelectorAll(".enc-btn");
    for (var i = 0; i < encBtns.length; i++) encBtns[i].disabled = true;
    document.getElementById("board-npc-overlay").classList.remove("hidden");
  }
  function closeBoardPlunder() {
    document.getElementById("board-npc-overlay").classList.add("hidden");
    if (typeof shipCatchMode !== "undefined" && shipCatchMode)
      shipCatchMode = false;
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    var plunderBtn = document.querySelector('.enc-btn[data-action="plunder"]');
    if (plunderBtn) plunderBtn.disabled = false;
    var ignoreBtn = document.querySelector('.enc-btn[data-action="ignore"]');
    if (ignoreBtn) ignoreBtn.disabled = false;
    var catchBtn = document.querySelector('.enc-btn[data-action="catch"]');
    if (catchBtn) catchBtn.disabled = false;
    if (_plundered) {
      var recBeforeBoard =
        typeof policeRecordScore !== "undefined" ? policeRecordScore : null;
      if (window._enemyType === "trader") {
        if (typeof policeRecordScore !== "undefined")
          policeRecordScore = Math.max(-100, policeRecordScore - 2);
      } else if (window._enemyType === "pirate") {
        if (typeof policeRecordScore !== "undefined")
          policeRecordScore = Math.max(-100, policeRecordScore - 1);
      }
      if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
      if (recBeforeBoard !== null && policeRecordScore !== recBeforeBoard) {
        _flashStatDelta(
          "pilot-record",
          policeRecordScore - recBeforeBoard,
        );
        if (typeof saveState === "function") saveState();
      }
    }
    if (typeof updateInfoTravel === "function") updateInfoTravel();
  }
  window._boardTake = function (itemIdx, qty) {
    var cargo = window._enemyCargo || {};
    var available = cargo[itemIdx] || 0;
    if (available <= 0) return;
    var takeQty = qty === -1 ? available : Math.min(qty, available);
    if (takeQty <= 0) return;
    var cap = 0,
      used = 0;
    if (
      typeof SHIP_STATS !== "undefined" &&
      typeof playerShip !== "undefined"
    ) {
      cap =
        SHIP_STATS[playerShip.name].cargo +
        playerShip.gadgets.filter(function (g) {
          return g === "5 extra cargo bays";
        }).length *
          5;
      if (
        typeof TRADE_ITEMS !== "undefined" &&
        typeof playerCargo !== "undefined"
      ) {
        TRADE_ITEMS.forEach(function (ti) {
          used += playerCargo[ti.id] || 0;
        });
      }
      used += 0;
    }
    var freeCargo = cap - used;
    takeQty = Math.min(takeQty, freeCargo);
    if (takeQty <= 0) return;
    cargo[itemIdx] = available - takeQty;
    if (cargo[itemIdx] <= 0) delete cargo[itemIdx];
    if (typeof playerCargo !== "undefined") {
      playerCargo[itemIdx] = (playerCargo[itemIdx] || 0) + takeQty;
    }
    _plundered = true;
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof updateGameDate === "function") updateGameDate();
    if (typeof saveState === "function") saveState();
    renderBoardPlunder();
  };
  document
    .getElementById("board-npc-overlay")
    .addEventListener("click", function (e) {
      if (e.target === this) closeBoardPlunder();
    });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var overlay = document.getElementById("board-npc-overlay");
      if (!overlay.classList.contains("hidden")) {
        closeBoardPlunder();
      }
    }
  });
  window.openBoardPlunder = openBoardPlunder;
  window.closeBoardPlunder = closeBoardPlunder;
})();
(function () {
  function _bribePolitics() {
    var sys =
      typeof window._encounterSystem !== "undefined" && window._encounterSystem
        ? window._encounterSystem
        : typeof currentStar !== "undefined" && currentStar
          ? currentStar.system
          : null;
    if (!sys) return null;
    return typeof POLITICS_TRADE_RULES !== "undefined"
      ? POLITICS_TRADE_RULES[sys]
      : null;
  }
  function _bribeWillingness() {
    var p = _bribePolitics();
    return p ? p.bribeWillingness : 1;
  }
  function calcBribe() {
    var nw =
      typeof netWorth === "function"
        ? netWorth()
        : typeof playerCredits !== "undefined"
          ? playerCredits
          : 0;
    var will = _bribeWillingness();
    var bribe = Math.ceil(nw / (10 * will) / 100) * 100;
    bribe = Math.max(100, Math.min(bribe, 10000));
    var canPay = typeof playerCredits !== "undefined" && playerCredits >= bribe;
    return { bribe: bribe, canPay: canPay };
  }
  function renderBribe() {
    var content = document.getElementById("surrender-content");
    var p = calcBribe();
    var systemName =
      typeof currentStar !== "undefined" && currentStar
        ? currentStar.name
        : "Unknown";
    var html = "";
    html += '<div id="bribe-header">';
    html += '<div id="bribe-header-left" class="w-full">';
    html += '<span id="bribe-title">Bribe Police</span>';
    html += '<span id="bribe-status">System: ' + systemName + "</span>";
    html += "</div>";
    html += "</div>";
    html += '<div id="bribe-details">';
    html += '<div class="bribe-row">';
    html += '<span class="bribe-label">Bribe Amount</span>';
    html +=
      '<span class="bribe-value danger">' +
      p.bribe.toLocaleString() +
      " cr</span>";
    html += "</div>";
    html += "</div>";
    if (!p.canPay) {
      html +=
        '<div id="bribe-msg" class="err">You do not have enough credits for a bribe.</div>';
    }
    html += '<div id="bribe-buttons">';
    html += '<button id="btn-bribe-cancel" class="cancel">Forget It</button>';
    if (p.canPay) {
      html += '<button id="btn-bribe-confirm">Offer Bribe</button>';
    }
    html += "</div>";
    content.innerHTML = html;
    document
      .getElementById("btn-bribe-cancel")
      .addEventListener("click", closeBribe);
    var confirmBtn = document.getElementById("btn-bribe-confirm");
    if (confirmBtn) confirmBtn.addEventListener("click", confirmBribe);
  }
  function openBribe() {
    var will = _bribeWillingness();
    if (will <= 0) {
      var systemName =
        typeof currentStar !== "undefined" && currentStar
          ? currentStar.name
          : "Unknown";
      showTravelMsg("The police of " + systemName + " cannot be bribed");
      return;
    }
    window._bribePanelOpen = true;
    var encBtns = document.querySelectorAll(".enc-btn");
    for (var i = 0; i < encBtns.length; i++) encBtns[i].disabled = true;
    renderBribe();
    document.getElementById("surrender-overlay").classList.remove("hidden");
  }
  function closeBribe() {
    window._bribePanelOpen = false;
    document.getElementById("surrender-overlay").classList.add("hidden");
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    var bribeBtn = document.querySelector('.enc-btn[data-action="bribe"]');
    if (bribeBtn) bribeBtn.disabled = false;
  }
  function confirmBribe() {
    window._bribePanelOpen = false;
    var p = calcBribe();
    document.getElementById("surrender-overlay").classList.add("hidden");
    if (!p.canPay || typeof playerCredits === "undefined") {
      showTravelMsg("You do not have enough credits for a bribe");
      showActions(["ignore"]);
      if (encBtns.ignore) encBtns.ignore.disabled = false;
      return;
    }
    playerCredits -= p.bribe;
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof updateInfoTravel === "function") updateInfoTravel();
    showTravelMsg("The police accept your bribe and let you go");
    showActions(["ignore"]);
    if (encBtns.ignore) encBtns.ignore.disabled = false;
  }
  window.openBribe = openBribe;
  window.closeBribe = closeBribe;
  window.getBribeWillingness = _bribeWillingness;
})();
(function () {
  function calcPenalties() {
    var record =
      typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
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
          break;
        }
      }
    }
    var canPay = typeof playerCredits !== "undefined" && playerCredits >= fine;
    var hasMercenaries =
      typeof window.CREW_NAMES !== "undefined" &&
      window.CREW_NAMES.filter(function (c) {
        return c.hired;
      }).length > 0;
    var hasInsurance =
      typeof playerHasInsurance !== "undefined" && playerHasInsurance;
    return {
      imprisonment: imprisonment,
      fine: fine,
      hasIllegal: hasIllegal,
      canPay: canPay,
      hasMercenaries: hasMercenaries,
      hasInsurance: hasInsurance,
    };
  }
  function renderSurrender() {
    var content = document.getElementById("surrender-content");
    var p = calcPenalties();
    var recScore =
      typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
    var recordLabel =
      typeof getPoliceRecordLabel === "function"
        ? getPoliceRecordLabel(recScore)
        : "Unknown";
    var html = "";
    html += '<div id="surrender-header">';
    html += '<div id="surrender-header-left" class="w-full">';
    html += '<span id="surrender-title">Surrender to the police</span>';
    html += '<span id="surrender-status">Crimes have consequences</span>';
    html += "</div>";
    html += "</div>";
    html += '<div id="surrender-details">';
    html += '<div class="surrender-row">';
    html += '<span class="surrender-label">Days in Prison</span>';
    html +=
      '<span class="surrender-value warn">' + p.imprisonment + " days</span>";
    html += "</div>";
    html += '<div class="surrender-row">';
    html += '<span class="surrender-label">Fine</span>';
    html +=
      '<span class="surrender-value danger">' +
      p.fine.toLocaleString() +
      " cr</span>";
    html += "</div>";
    if (p.hasIllegal) {
      html += '<div class="surrender-row">';
      html += '<span class="surrender-label">Illegal Cargo</span>';
      html += '<span class="surrender-value danger">Confiscated</span>';
      html += "</div>";
    }
    if (p.hasMercenaries) {
      html += '<div class="surrender-row">';
      html += '<span class="surrender-label">Mercenaries</span>';
      html += '<span class="surrender-value danger">Dismissed</span>';
      html += "</div>";
    }
    if (p.hasInsurance) {
      html += '<div class="surrender-row">';
      html += '<span class="surrender-label">Insurance</span>';
      html += '<span class="surrender-value danger">Voided</span>';
      html += "</div>";
    }
    if (!p.canPay) {
      html += '<div class="surrender-row">';
      html += '<span class="surrender-label">Ship</span>';
      html += '<span class="surrender-value danger">Seized</span>';
      html += "</div>";
    }
    html += "</div>";
    html += '<div id="surrender-buttons">';
    html += '<button id="btn-surrender-cancel" class="cancel">Cancel</button>';
    html += '<button id="btn-surrender-confirm">Surrender</button>';
    html += "</div>";
    content.innerHTML = html;
    document
      .getElementById("btn-surrender-cancel")
      .addEventListener("click", closeSurrender);
    document
      .getElementById("btn-surrender-confirm")
      .addEventListener("click", confirmSurrender);
  }
  function openSurrender() {
    renderSurrender();
    document.getElementById("surrender-overlay").classList.remove("hidden");
  }
  function renderPirateSurrender() {
    var content = document.getElementById("surrender-content");
    var hasCargo = typeof TRADE_ITEMS !== "undefined" && typeof playerCargo !== "undefined" &&
      TRADE_ITEMS.some(function (t) { return (playerCargo[t.id] || 0) > 0; });
    var stats = typeof SHIP_STATS !== "undefined" ? SHIP_STATS[window._enemyShipName] : null;
    var enemyCap = stats ? stats.cargo : 10;
    var enemyUsed = 0;
    if (typeof window._enemyCargo !== "undefined") {
      for (var k in window._enemyCargo) enemyUsed += window._enemyCargo[k];
    }
    var freePirateBays = Math.max(0, enemyCap - enemyUsed);
    var totalItems = 0;
    TRADE_ITEMS.forEach(function (t) { totalItems += playerCargo[t.id] || 0; });
    var itemsToTake = hasCargo ? Math.min(totalItems, freePirateBays) : 0;
    var willTakeCargo = itemsToTake > 0;
    var nw = typeof netWorth === "function" ? netWorth() : (typeof playerCredits !== "undefined" ? playerCredits : 0);
    var blackmail = Math.min(25000, Math.max(500, Math.floor(nw / 20)));
    var isTrader = window._enemyType === "trader";
    var html = "";
    html += '<div id="surrender-header">';
    html += '<div id="surrender-header-left" class="w-full">';
    var surrenderTo = window._isSmuggler
      ? "the smuggler"
      : window._enemyType === "trader"
        ? "the trader"
        : "the pirate";
    html += '<span id="surrender-title">Surrender to ' + surrenderTo + '</span>';
    html += '<span id="surrender-status">' + (isTrader ? "My ship's damages are on you." : "This is not a negotiation") + '</span>';
    html += "</div>";
    html += "</div>";
    html += '<div id="surrender-details">';
    if (!isTrader) {
      html += '<div class="surrender-row">';
      html += '<span class="surrender-label">Cargo</span>';
      html += '<span class="surrender-value danger">' + (willTakeCargo ? itemsToTake + " item" + (itemsToTake !== 1 ? "s" : "") : "no items") + '</span>';
      html += "</div>";
    }
    html += '<div class="surrender-row">';
    html += '<span class="surrender-label">' + (isTrader ? "Damages compensation" : "Ransom") + '</span>';
    html += '<span class="surrender-value danger">' + (isTrader || !willTakeCargo ? blackmail.toLocaleString() + " cr" : "-") + '</span>';
    html += "</div>";
    html += "</div>";
    html += '<div id="surrender-buttons">';
    html += '<button id="btn-pirate-surrender-cancel" class="cancel">Cancel</button>';
    html += '<button id="btn-pirate-surrender-confirm">Surrender</button>';
    html += "</div>";
    content.innerHTML = html;
    document.getElementById("btn-pirate-surrender-cancel").addEventListener("click", closeSurrender);
    document.getElementById("btn-pirate-surrender-confirm").addEventListener("click", confirmPirateSurrender);
  }
  function confirmPirateSurrender() {
    document.getElementById("surrender-overlay").classList.add("hidden");
    if (window._enemyType === "trader") {
      var nw = typeof netWorth === "function" ? netWorth() : (typeof playerCredits !== "undefined" ? playerCredits : 0);
      var blackmail = Math.min(25000, Math.max(500, Math.floor(nw / 20)));
      if (typeof _executeSurrenderRansom === "function") _executeSurrenderRansom(blackmail);
      return;
    }
    var hasCargo = typeof TRADE_ITEMS !== "undefined" && typeof playerCargo !== "undefined" &&
      TRADE_ITEMS.some(function (t) { return (playerCargo[t.id] || 0) > 0; });
    var stats = typeof SHIP_STATS !== "undefined" ? SHIP_STATS[window._enemyShipName] : null;
    var enemyCap = stats ? stats.cargo : 10;
    var enemyUsed = 0;
    if (typeof window._enemyCargo !== "undefined") {
      for (var k in window._enemyCargo) enemyUsed += window._enemyCargo[k];
    }
    var freePirateBays = Math.max(0, enemyCap - enemyUsed);
    var totalItems = 0;
    TRADE_ITEMS.forEach(function (t) { totalItems += playerCargo[t.id] || 0; });
    var itemsToTake = hasCargo ? Math.min(totalItems, freePirateBays) : 0;
    if (itemsToTake > 0) {
      if (typeof _executeSurrenderCargo === "function") _executeSurrenderCargo(freePirateBays);
    } else {
      var nw = typeof netWorth === "function" ? netWorth() : (typeof playerCredits !== "undefined" ? playerCredits : 0);
      var blackmail = Math.min(25000, Math.max(500, Math.floor(nw / 20)));
      if (typeof _executeSurrenderRansom === "function") _executeSurrenderRansom(blackmail);
    }
  }
  function openPirateSurrender() {
    renderPirateSurrender();
    document.getElementById("surrender-overlay").classList.remove("hidden");
  }
  function closeSurrender() {
    document.getElementById("surrender-overlay").classList.add("hidden");
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    if (window._hasAttacked && typeof encBtns !== "undefined" && encBtns.auto) {
      encBtns.auto.disabled = false;
    }
  }
  function confirmSurrender() {
    document.getElementById("surrender-overlay").classList.add("hidden");
    if (typeof _processArrest === "function") {
      _processArrest(true);
    }
  }
  document
    .getElementById("surrender-overlay")
    .addEventListener("click", function (e) {
      if (e.target === this) closeSurrender();
    });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var overlay = document.getElementById("surrender-overlay");
      if (!overlay.classList.contains("hidden")) {
        if (window._bribePanelOpen && typeof closeBribe === "function") {
          closeBribe();
        } else {
          closeSurrender();
        }
      }
    }
  });
  window.openSurrender = openSurrender;
  window.openPirateSurrender = openPirateSurrender;
  window.closeSurrender = closeSurrender;
})();
(function () {
  var traderItems = [];
  function generateTraderItems() {
    var items = [];
    var pool = TRADE_ITEMS.filter(function (item) {
      if (item.illegal) {
        var record =
          typeof policeRecordScore !== "undefined" ? policeRecordScore : 0;
        return record <= -5;
      }
      return true;
    });
    var count = 3 + Math.floor(Math.random() * 4);
    var shuffled = pool.slice().sort(function () {
      return Math.random() - 0.5;
    });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      var qty = 1 + Math.floor(Math.random() * 10);
      var price = Math.max(
        1,
        Math.floor(item.base * (0.8 + Math.random() * 0.4)),
      );
      var buyPrice = Math.max(
        1,
        Math.floor(item.base * (0.5 + Math.random() * 0.3)),
      );
      items.push({ item: item, qty: qty, price: price, buyPrice: buyPrice });
    }
    return items;
  }
  function renderTraderTrade() {
    var content = document.getElementById("trader-npc-content");
    var cap =
      typeof SHIP_STATS !== "undefined"
        ? SHIP_STATS[playerShip.name].cargo +
          playerShip.gadgets.filter(function (g) {
            return g === "5 extra cargo bays";
          }).length *
            5
        : 0;
    var used = 0;
    if (
      typeof TRADE_ITEMS !== "undefined" &&
      typeof playerCargo !== "undefined"
    ) {
      TRADE_ITEMS.forEach(function (ti) {
        used += playerCargo[ti.id] || 0;
      });
    }
    var freeCargo = cap - used - 0;
    var html = "";
    html += '<div id="trader-npc-header">';
    html += '<div id="trader-npc-header-left">';
    html += '<span id="trader-npc-title">Trader — Cargo</span>';
    html +=
      '<span id="trader-npc-status">Cargo bays: ' +
      used +
      "/" +
      cap +
      "</span>";
    html += "</div>";
    html += '<div id="trader-npc-header-right">';
    html +=
      '<button id="btn-trader-npc-close">' +
      (typeof ICON_CLOSE !== "undefined" ? ICON_CLOSE : "X") +
      "</button>";
    html += "</div></div>";
    html += '<div id="trader-npc-columns" class="local">';
    html += '<div class="trade-col-header">';
    html += '<span class="hdr-name">Item</span>';
    html +=
      '<span class="hdr-actions"><span class="hdr-buy">Buy</span><span class="hdr-sell">Sell</span></span>';
    html += '<span class="hdr-stock">Stk</span>';
    html += '<span class="hdr-cargo">Qty</span>';
    html += "</div>";
    html += '<div class="trade-items">';
    for (var i = 0; i < traderItems.length; i++) {
      var ti = traderItems[i];
      var item = ti.item;
      var price = ti.price;
      var stock = ti.qty;
      var cnt = playerCargo[item.id] || 0;
      if (typeof lockedCargo !== "undefined" && typeof sellableCount === "function")
        cnt = sellableCount(item.id);
      var canBuy = playerCredits >= price && stock > 0 && freeCargo > 0;
      var buyBtnText =
        !canBuy && freeCargo <= 0
          ? "Full"
          : !canBuy && stock <= 0
            ? "Sold Out"
            : "Buy";
      var canSell = cnt > 0;
      var sellPrice = ti.buyPrice;
      html += '<div class="trade-row local profitable">';
      html +=
        '<span class="trade-name' +
        (item.illegal ? " illegal" : "") +
        '">' +
        item.name +
        "</span>";
      html += '<span class="trade-actions">';
      html += '<span class="trade-action buy-action">';
      html += '<span class="trade-price">' + price + "&nbsp;cr</span>";
      html +=
        '<button class="trade-btn buy" onclick="window._traderBuy(' +
        i +
        ')"' +
        (canBuy ? "" : " disabled") +
        ">" +
        buyBtnText +
        "</button>";
      html += "</span>";
      html += '<span class="trade-action sell-action">';
      html += '<span class="trade-price">' + sellPrice + "&nbsp;cr</span>";
      html +=
        '<button class="trade-btn sell" onclick="window._traderSell(' +
        i +
        ')"' +
        (canSell ? "" : " disabled") +
        ">Sell</button>";
      html += "</span></span>";
      html += '<span class="trade-stock">' + stock + "</span>";
      html += '<span class="trade-cargo">' + cnt + "</span>";
      html += "</div>";
    }
    html += "</div></div>";
    content.innerHTML = html;
    document
      .getElementById("btn-trader-npc-close")
      .addEventListener("click", closeTraderTrade);
  }
  function bindQtySlider(body) {
    var slider = body.querySelector(".qty-slider");
    var valSpan = body.querySelector(".qty-val");
    var totalSpan = body.querySelector(".qty-total-val");
    if (!slider || !valSpan || !totalSpan) return;
    slider.addEventListener("input", function () {
      var v = parseInt(slider.value);
      valSpan.textContent = v;
      totalSpan.textContent = window._traderQtyData.price * v;
    });
  }
  function openTraderQty(idx) {
    var ti = traderItems[idx];
    var item = ti.item;
    var price = ti.price;
    var stock = ti.qty;
    var cap =
      SHIP_STATS[playerShip.name].cargo +
      playerShip.gadgets.filter(function (g) {
        return g === "5 extra cargo bays";
      }).length *
        5;
    var used = 0;
    TRADE_ITEMS.forEach(function (ti) {
      used += playerCargo[ti.id] || 0;
    });
    used += 0;
    var free = cap - used;
    var max = Math.min(Math.floor(playerCredits / price), stock, free);
    if (max < 1) return;
    var header = document.getElementById("trader-npc-qty-header");
    var body = document.getElementById("trader-npc-qty-body");
    header.textContent = "Buy " + item.name;
    body.innerHTML =
      "" +
      '<div class="qty-slider-row">' +
      '<input type="range" class="qty-slider" min="1" max="' +
      max +
      '" value="1" step="1">' +
      '<span class="qty-val">1</span>' +
      "</div>" +
      '<div class="qty-credits">Credits: <span class="qty-credits-val">' +
      (typeof playerCredits !== "undefined" ? playerCredits : 0) +
      "</span>&nbsp;cr</div>" +
      '<div class="qty-total">Total: <span class="qty-total-val">' +
      price +
      "</span>&nbsp;cr</div>" +
      '<div class="qty-btns">' +
      '<button class="qty-btn cancel" onclick="window._traderQtyCancel()">Cancel</button>' +
      '<button class="qty-btn max" onclick="window._traderQtyMax()">Max</button>' +
      '<button class="qty-btn confirm" onclick="window._traderQtyConfirm()">Buy</button>' +
      "</div>";
    document
      .getElementById("trader-npc-qty-overlay")
      .classList.remove("hidden");
    window._traderQtyData = {
      idx: idx,
      price: price,
      free: free,
      itemId: item.id,
      ti: ti,
      mode: "buy",
    };
    bindQtySlider(body);
  }
  function openTraderSellQty(idx) {
    var ti = traderItems[idx];
    var item = ti.item;
    var price = ti.buyPrice;
    var cnt = playerCargo[item.id] || 0;
    if (typeof lockedCargo !== "undefined" && typeof sellableCount === "function")
      cnt = sellableCount(item.id);
    if (cnt < 1) return;
    var header = document.getElementById("trader-npc-qty-header");
    var body = document.getElementById("trader-npc-qty-body");
    header.textContent = "Sell " + item.name;
    body.innerHTML =
      "" +
      '<div class="qty-slider-row">' +
      '<input type="range" class="qty-slider" min="1" max="' +
      cnt +
      '" value="1" step="1">' +
      '<span class="qty-val">1</span>' +
      "</div>" +
      '<div class="qty-total">Total: <span class="qty-total-val">' +
      price +
      "</span>&nbsp;cr</div>" +
      '<div class="qty-btns">' +
      '<button class="qty-btn cancel" onclick="window._traderQtyCancel()">Cancel</button>' +
      '<button class="qty-btn max" onclick="window._traderQtyMax()">Max</button>' +
      '<button class="qty-btn confirm" onclick="window._traderQtyConfirm()">Sell</button>' +
      "</div>";
    document
      .getElementById("trader-npc-qty-overlay")
      .classList.remove("hidden");
    window._traderQtyData = {
      idx: idx,
      price: price,
      itemId: item.id,
      ti: ti,
      mode: "sell",
    };
    bindQtySlider(body);
  }
  function closeTraderQty() {
    document.getElementById("trader-npc-qty-overlay").classList.add("hidden");
  }
  function openTraderTrade() {
    traderItems = generateTraderItems();
    renderTraderTrade();
    var encBtns = document.querySelectorAll(".enc-btn");
    for (var i = 0; i < encBtns.length; i++) encBtns[i].disabled = true;
    document.getElementById("trader-npc-overlay").classList.remove("hidden");
  }
  function closeTraderTrade() {
    document.getElementById("trader-npc-overlay").classList.add("hidden");
    document.getElementById("trader-npc-qty-overlay").classList.add("hidden");
    if (typeof window._updateAttackBtn === "function")
      window._updateAttackBtn();
    var tradeBtn = document.querySelector('.enc-btn[data-action="trade"]');
    if (tradeBtn) tradeBtn.disabled = false;
  }
  window.openTraderTrade = openTraderTrade;
  window._traderBuy = openTraderQty;
  window._traderSell = openTraderSellQty;
  window._closeTraderQty = closeTraderQty;
  window._renderTraderTrade = renderTraderTrade;
  window._traderQtyMax = function () {
    var body = document.getElementById("trader-npc-qty-body");
    var slider = body.querySelector(".qty-slider");
    var valSpan = body.querySelector(".qty-val");
    var totalSpan = body.querySelector(".qty-total-val");
    slider.value = slider.max;
    var v = parseInt(slider.value);
    valSpan.textContent = v;
    totalSpan.textContent = window._traderQtyData.price * v;
  };
  window._traderQtyConfirm = function () {
    var data = window._traderQtyData;
    if (!data) return;
    var body = document.getElementById("trader-npc-qty-body");
    var slider = body.querySelector(".qty-slider");
    var n = parseInt(slider.value);
    if (data.mode === "buy") {
      var cost = data.price * n;
      var ti = data.ti;
      var actual = Math.min(n, ti.qty);
      var actual2 = Math.min(actual, data.free);
      if (actual2 > 0 && playerCredits >= cost) {
        var actualCost = data.price * actual2;
        playerCredits -= actualCost;
        playerCargo[data.itemId] = (playerCargo[data.itemId] || 0) + actual2;
        if (typeof playerCargoBuyPrice !== "undefined") {
          playerCargoBuyPrice[data.itemId] =
            (playerCargoBuyPrice[data.itemId] || 0) + actualCost;
        }
        ti.qty -= actual2;
        if (typeof saveTradeState === "function") saveTradeState();
        if (typeof updateGameDate === "function") updateGameDate();
        if (typeof saveState === "function") saveState();
        window._closeTraderQty();
        window._renderTraderTrade();
      }
    } else {
      var amount = Math.min(n, playerCargo[data.itemId] || 0);
      if (
        typeof lockedCargo !== "undefined" &&
        typeof sellableCount === "function"
      ) {
        amount = Math.min(amount, sellableCount(data.itemId));
      }
      if (amount > 0) {
        var income = data.price * amount;
        playerCredits += income;
        var oldQty = playerCargo[data.itemId] || 0;
        var newQty = oldQty - amount;
        playerCargo[data.itemId] = newQty;
        if (
          newQty > 0 &&
          typeof playerCargoBuyPrice !== "undefined" &&
          playerCargoBuyPrice[data.itemId]
        ) {
          playerCargoBuyPrice[data.itemId] = Math.floor(
            ((playerCargoBuyPrice[data.itemId] || 0) * newQty) / oldQty,
          );
        } else if (newQty <= 0) {
          delete playerCargo[data.itemId];
          if (typeof playerCargoBuyPrice !== "undefined")
            delete playerCargoBuyPrice[data.itemId];
        }
        if (typeof saveTradeState === "function") saveTradeState();
        if (typeof updateGameDate === "function") updateGameDate();
        if (typeof saveState === "function") saveState();
        window._closeTraderQty();
        window._renderTraderTrade();
      }
    }
  };
  window._traderQtyCancel = function () {
    window._closeTraderQty();
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var overlay = document.getElementById("trader-npc-overlay");
      if (!overlay.classList.contains("hidden")) {
        var qtyOverlay = document.getElementById("trader-npc-qty-overlay");
        if (!qtyOverlay.classList.contains("hidden")) {
          closeTraderQty();
        } else {
          closeTraderTrade();
        }
      }
    }
  });
  document
    .getElementById("trader-npc-overlay")
    .addEventListener("click", function (e) {
      if (e.target === this) closeTraderTrade();
    });
  document
    .getElementById("trader-npc-qty-overlay")
    .addEventListener("click", function (e) {
      if (e.target === this) closeTraderQty();
    });
})();
