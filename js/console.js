// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const consoleEl = (function () {
  const overlay = document.createElement("div");
  overlay.id = "console-overlay";
  overlay.innerHTML =
    '<div id="console-bg"></div><div id="console-output"></div><div id="console-input-row"><span id="console-prompt">></span><input type="text" id="console-input" placeholder="type help" autocomplete="off" spellcheck="false"></div>';
  document.body.appendChild(overlay);
  const output = overlay.querySelector("#console-output");
  const input = overlay.querySelector("#console-input");
  function print(msg, cls) {
    const line = document.createElement("div");
    line.textContent = msg;
    if (cls) line.className = cls;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }
  function printGrid(rows) {
    const grid = document.createElement("div");
    grid.className = "console-grid";
    rows.forEach(function (r) {
      const c1 = document.createElement("span");
      c1.className = "console-grid-cmd";
      c1.textContent = r[0];
      const c2 = document.createElement("span");
      c2.textContent = r[1];
      grid.appendChild(c1);
      grid.appendChild(c2);
    });
    output.appendChild(grid);
    output.scrollTop = output.scrollHeight;
  }
  function done() {
    if (typeof checkDebtWarning === "function") checkDebtWarning();
    if (typeof saveTradeState === "function") saveTradeState();
    if (typeof updateGameDate === "function") updateGameDate();
    if (typeof updateCargoDisplay === "function") updateCargoDisplay();
    if (
      typeof renderBankPages === "function" &&
      typeof bankOverlay !== "undefined" &&
      !bankOverlay.classList.contains("hidden")
    )
      renderBankPages();
    if (
      typeof renderShipPages === "function" &&
      typeof shipOverlay !== "undefined" &&
      !shipOverlay.classList.contains("hidden")
    )
      renderShipPages();
    if (
      typeof renderDashboardPages === "function" &&
      typeof dashboardOverlay !== "undefined" &&
      !dashboardOverlay.classList.contains("hidden")
    )
      renderDashboardPages();
    if (typeof updateBankBlink === "function") updateBankBlink();
  }
  const COMMANDS = {
    help: function () {
      printGrid([
        [
          "give <n|item|ship|shield|weapon>",
          "Give credits, cargo item, ship, shield or weapon",
        ],
        ["ship hull|fuel <n>", "Set hull or fuel"],
        ["stat rec|rep <n>", "Set police record or reputation"],
        [
          "jump <moon|star|worm|name>",
          "Jump to moon, unreachable star, wormhole or named star",
        ],
        ["go <die|retire>", "Die or retire"],
        ["clear", "Clear console"],
        ["exit", "Close console"],
        ["help", "This help"],
      ]);
    },
    give: function (args) {
      const input = (args[0] || "").toLowerCase();
      if (!input) {
        print("usage: give <amount|ship|shield|weapon>", "console-err");
        return;
      }
      const n = parseInt(input);
      if (!isNaN(n)) {
        playerCredits += n;
        done();
        print((n >= 0 ? "+" : "") + n + " cr", "console-ok");
        return;
      }
      if (input === "shield") {
        const stats = SHIP_STATS[playerShip.name];
        if (playerShip.shields.length >= stats.shields) {
          print("no shield slots available", "console-err");
          return;
        }
        const shields = EQUIP_ITEMS.filter((e) => e.cat === "shield");
        const idx = parseInt(args[1]);
        const next = idx >= 0 && idx <= 2 ? shields[idx] : shields[0];
        playerShip.shields.push(next.name);
        if (typeof savePlayerShip === "function") savePlayerShip();
        if (typeof window._totalShieldPower === "function") {
          window._playerShieldMax = window._totalShieldPower(
            playerShip.shields,
          );
          window._playerShieldHp = window._playerShieldMax;
        }
        if (typeof window._updateStatusBars === "function")
          window._updateStatusBars();
        done();
        print("+1 " + next.name, "console-ok");
        return;
      }
      if (input === "weapon") {
        const stats = SHIP_STATS[playerShip.name];
        if (playerShip.weapons.length >= stats.weapons) {
          print("no weapon slots available", "console-err");
          return;
        }
        const weapons = EQUIP_ITEMS.filter((e) => e.cat === "weapon");
        const idx = parseInt(args[1]);
        const next = idx >= 0 && idx <= 3 ? weapons[idx] : weapons[0];
        playerShip.weapons.push(next.name);
        if (typeof savePlayerShip === "function") savePlayerShip();
        if (typeof window._updateAttackBtn === "function")
          window._updateAttackBtn();
        if (
          typeof renderMissionPages === "function" &&
          typeof missionOverlay !== "undefined" &&
          !missionOverlay.classList.contains("hidden")
        ) {
          renderMissionPages();
        }
        done();
        print("+1 " + next.name, "console-ok");
        return;
      }
      const tradeItem =
        typeof TRADE_ITEMS !== "undefined" &&
        TRADE_ITEMS.find(function (t) {
          return t.name.toLowerCase() === input;
        });
      if (tradeItem) {
        var qty = args[1] ? parseInt(args[1]) : 1;
        if (isNaN(qty) || qty < 1) qty = 1;
        var cap = 0,
          used = 0;
        if (
          typeof playerShip !== "undefined" &&
          typeof SHIP_STATS !== "undefined"
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
          var free = cap - used;
          if (qty > free) {
            print(
              "cargo full: capped to " +
                free +
                " units (free space: " +
                free +
                "/" +
                cap +
                ")",
              "console-warn",
            );
            qty = Math.max(0, free);
          }
        }
        if (qty > 0) {
          playerCargo[tradeItem.id] = (playerCargo[tradeItem.id] || 0) + qty;
          if (typeof playerCargoBuyPrice !== "undefined") {
            var price =
              typeof getItemBasePrice === "function"
                ? getItemBasePrice(tradeItem, currentStar)
                : 0;
            playerCargoBuyPrice[tradeItem.id] =
              (playerCargoBuyPrice[tradeItem.id] || 0) + price * qty;
          }
          if (
            typeof renderMissionPages === "function" &&
            typeof missionOverlay !== "undefined" &&
            !missionOverlay.classList.contains("hidden")
          ) {
            renderMissionPages();
          }
          print("+" + qty + " " + tradeItem.name, "console-ok");
        } else {
          print("cargo is completely full", "console-err");
        }
        done();
        return;
      }
      const shipName = Object.keys(SHIP_STATS).find(
        (k) => k.toLowerCase() === input,
      );
      if (shipName) {
        if (
          shipName === "Police" &&
          (typeof policeRecordScore === "undefined" || policeRecordScore < 10)
        ) {
          print(
            "requires Trusted+ police record (10+) to get a Police ship",
            "console-err",
          );
          done();
          return;
        }
        if (playerShip.name === "Police" && shipName !== "Police") {
          _sendPoliceDischargeMail();
        }
        playerShip.name = shipName;
        playerShip.gadgets = [];
        playerShip.weapons = [];
        if (typeof window._updateAttackBtn === "function")
          window._updateAttackBtn();
        playerShip.shields = [];
        playerShip.specials = [];
        playerShip.hull = SHIP_STATS[shipName].hull;
        if (
          SHIP_STATS[shipName].quarters === 0 &&
          typeof window.CREW_NAMES !== "undefined"
        ) {
          let firedAny = false;
          window.CREW_NAMES.forEach(function (c) {
            if (c.hired) {
              c.hired = false;
              firedAny = true;
              if (typeof addMailMessage === "function") {
                addMailMessage("Crew Departure", `${c.name} was let go due to insufficient crew quarters on your new ship.`);
              }
            }
          });
          if (firedAny) {
            if (typeof saveCrewNames === "function") saveCrewNames();
            print(
              "crew dismissed: no crew quarters on " + shipName,
              "console-warn",
            );
          }
        }
        var newCap = SHIP_STATS[shipName].cargo;
        var cargoUsed = 0;
        if (
          typeof TRADE_ITEMS !== "undefined" &&
          typeof playerCargo !== "undefined"
        ) {
          TRADE_ITEMS.forEach(function (ti) {
            cargoUsed += playerCargo[ti.id] || 0;
          });
        }
        if (typeof beginMissionCancelBatch === "function") beginMissionCancelBatch();
        if (cargoUsed > newCap) {
          if (typeof playerCargo !== "undefined") playerCargo = {};
          if (typeof lockedCargo !== "undefined") lockedCargo = {};
          if (typeof playerCargoBuyPrice !== "undefined")
            playerCargoBuyPrice = {};
          if (typeof checkDeliverCargoIntegrity === "function")
            checkDeliverCargoIntegrity("insufficient cargo");
          if (typeof saveTradeState === "function") saveTradeState();
        }
        if (typeof playerFuel !== "undefined") playerFuel = maxFuelCapacity();
        if (typeof window._totalShieldPower === "function") {
          window._playerShieldMax = window._totalShieldPower(
            playerShip.shields,
          );
          window._playerShieldHp = window._playerShieldMax;
        }
        if (typeof window._updateStatusBars === "function")
          window._updateStatusBars();
        if (typeof saveFuelState === "function") saveFuelState();
        if (typeof cancelExcessRideMissions === "function") cancelExcessRideMissions("insufficient quarters");
        if (typeof cancelExcessHeroMissions === "function") cancelExcessHeroMissions("no weapons");
        if (typeof cancelExcessManhuntMissions === "function") cancelExcessManhuntMissions("not a Police ship");
        if (typeof sendMissionCancelBatchMail === "function") sendMissionCancelBatchMail();
        if (typeof savePlayerShip === "function") savePlayerShip();
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
        if (
          typeof renderMissionPages === "function" &&
          typeof missionOverlay !== "undefined" &&
          !missionOverlay.classList.contains("hidden")
        ) {
          renderMissionPages();
        }
        done();
        print("ship changed to " + shipName, "console-ok");
        var shipEl = document.getElementById("travel-ship");
        if (
          shipEl &&
          shipEl.offsetParent !== null &&
          typeof shipSvgFor === "function"
        ) {
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
                shipEl.style.left =
                  "calc(50% - " + (300 + (p - 144) / 2) + "px)";
              } else {
                shipEl.style.bottom = 140 - (p - 144) + "px";
              }
            }
          });
        }
        if (typeof shipSvgFor === "function") {
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
        }
        return;
      }
      print("unknown: " + args[0], "console-err");
    },
    ship: function (args) {
      const what = (args[0] || "").toLowerCase();
      const n = parseInt(args[1]);
      if (what !== "hull" && what !== "fuel") {
        print("usage: ship hull|fuel <amount>", "console-err");
        return;
      }
      if (isNaN(n)) {
        print("usage: ship " + what + " <amount>", "console-err");
        return;
      }
      if (what === "hull") {
        if (typeof playerShip === "undefined") {
          print("playerShip not available", "console-err");
          return;
        }
        const maxH = SHIP_STATS[playerShip.name].hull;
        playerShip.hull = Math.max(0, Math.min(maxH, n));
        if (typeof savePlayerShip === "function") savePlayerShip();
        if (typeof saveState === "function") saveState();
        if (typeof window._updateStatusBars === "function")
          window._updateStatusBars();
        done();
        print("hull set to " + playerShip.hull + "/" + maxH, "console-ok");
      } else {
        if (typeof playerFuel === "undefined") {
          print("playerFuel not available", "console-err");
          return;
        }
        const maxF = maxFuelCapacity();
        playerFuel = Math.max(0, Math.min(maxF, n));
        if (typeof saveFuelState === "function") saveFuelState();
        if (typeof saveState === "function") saveState();
        done();
        print("fuel set to " + playerFuel + "/" + maxF, "console-ok");
      }
    },
    stat: function (args) {
      const what = (args[0] || "").toLowerCase();
      const n = parseInt(args[1]);
      if (what !== "rec" && what !== "rep") {
        print("usage: stat rec|rep <amount>", "console-err");
        return;
      }
      if (isNaN(n)) {
        print("usage: stat " + what + " <amount>", "console-err");
        return;
      }
      if (what === "rec") {
        if (typeof policeRecordScore === "undefined") {
          print("policeRecordScore not available", "console-err");
          return;
        }
        policeRecordScore = n;
        if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
        if (typeof updateInfoTravel === "function") updateInfoTravel();
        if (
          typeof renderMissionPages === "function" &&
          typeof missionOverlay !== "undefined" &&
          !missionOverlay.classList.contains("hidden")
        )
          renderMissionPages();
        if (typeof saveState === "function") saveState();
        done();
        print(
          "police record set to " +
            n +
            " (" +
            (typeof getPoliceRecordLabel === "function"
              ? getPoliceRecordLabel(n)
              : "") +
            ")",
          "console-ok",
        );
      } else {
        if (typeof gameReputationScore === "undefined") {
          print("gameReputationScore not available", "console-err");
          return;
        }
        gameReputationScore = n;
        if (typeof updatePoliceDisplay === "function") updatePoliceDisplay();
        if (typeof updateInfoTravel === "function") updateInfoTravel();
        if (
          typeof renderMissionPages === "function" &&
          typeof missionOverlay !== "undefined" &&
          !missionOverlay.classList.contains("hidden")
        )
          renderMissionPages();
        if (typeof saveState === "function") saveState();
        done();
        print(
          "reputation set to " +
            n +
            " (" +
            (typeof getReputationLabel === "function"
              ? getReputationLabel(n)
              : "") +
            ")",
          "console-ok",
        );
      }
    },
    jump: function (args) {
      var target = (args[0] || "").toLowerCase();
      if (target === "moon") {
        if (typeof stars === "undefined" || !currentStar) return;
        var moons = [];
        for (var si = 0; si < stars.length; si++) {
          if (stars[si].planetClass === "Habitable Moon") moons.push(stars[si]);
        }
        if (moons.length === 0) {
          print("no habitable moons found", "console-err");
          return;
        }
        var s = moons[Math.floor(Math.random() * moons.length)];
        currentStar = s;
        currentStar.visited = true;
        selectedStar = currentStar;
        if (typeof refreshStarPrices === "function")
          refreshStarPrices(currentStar);
        if (typeof updateNewsLabel === "function") updateNewsLabel();
        cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: 15 };
        routePath = [];
        starInfo.innerHTML =
          '<span class="star-current">' +
          currentStar.name +
          " " +
          ICON_CHECK +
          '</span><br><span class="star-dist">Current location</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ' +
          classifyStar(currentStar) +
          '</span><br><span class="star-dist"><span class="star-label-route">System:</span> ' +
          currentStar.system +
          '</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ' +
          TECH_NAMES[getTechLevel(currentStar)] +
          '</span><br><span class="star-dist"><span class="star-label-route">Status:</span> ' +
          (currentStar.status != null
            ? STATUS_STR[currentStar.status]
            : "Uneventful") +
          "</span>";
        if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
        updateInfoClean();
        done();
        print("jumped to moon " + currentStar.name, "console-ok");
      } else if (target === "star") {
        if (
          typeof stars === "undefined" ||
          !currentStar ||
          typeof findPath !== "function"
        )
          return;
        for (var si = 0; si < stars.length; si++) {
          var s = stars[si];
          if (s === currentStar) continue;
          if (findPath(currentStar, s).length === 0) {
            currentStar = s;
            currentStar.visited = true;
            selectedStar = currentStar;
            if (typeof refreshStarPrices === "function")
              refreshStarPrices(currentStar);
            if (typeof updateNewsLabel === "function") updateNewsLabel();
            cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: 15 };
            routePath = [];
            starInfo.innerHTML =
              '<span class="star-current">' +
              currentStar.name +
              " " +
              ICON_CHECK +
              '</span><br><span class="star-dist">Current location</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ' +
              classifyStar(currentStar) +
              '</span><br><span class="star-dist"><span class="star-label-route">System:</span> ' +
              currentStar.system +
              '</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ' +
              TECH_NAMES[getTechLevel(currentStar)] +
              '</span><br><span class="star-dist"><span class="star-label-route">Status:</span> ' +
              (currentStar.status != null
                ? STATUS_STR[currentStar.status]
                : "Uneventful") +
              "</span>";
            if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
            updateInfoClean();
            done();
            print("jumped to star " + currentStar.name, "console-ok");
            return;
          }
        }
        print("no unreachable star found", "console-err");
      } else if (target === "worm") {
        if (typeof stars === "undefined") {
          print("no wormhole destination available", "console-err");
          return;
        }
        var wormholes = stars.filter(function (s) {
          return s.bridge;
        });
        if (wormholes.length === 0) {
          print("no wormholes found", "console-err");
          return;
        }
        var wormStar = wormholes[Math.floor(Math.random() * wormholes.length)];
        currentStar = wormStar;
        currentStar.visited = true;
        selectedStar = currentStar;
        if (typeof refreshStarPrices === "function")
          refreshStarPrices(currentStar);
        if (typeof updateNewsLabel === "function") updateNewsLabel();
        cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: 15 };
        routePath = [];
        starInfo.innerHTML =
          '<span class="star-current">' +
          currentStar.name +
          " " +
          ICON_CHECK +
          '</span><br><span class="star-dist">Current location</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ' +
          classifyStar(currentStar) +
          '</span><br><span class="star-dist"><span class="star-label-route">System:</span> ' +
          currentStar.system +
          '</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ' +
          TECH_NAMES[getTechLevel(currentStar)] +
          '</span><br><span class="star-dist"><span class="star-label-route">Status:</span> ' +
          (currentStar.status != null
            ? STATUS_STR[currentStar.status]
            : "Uneventful") +
          "</span>";
        if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
        if (typeof generateProcMissions === "function")
          generateProcMissions(currentStar);
        updateInfoClean();
        done();
        print("wormhole to " + currentStar.name, "console-ok");
      } else if (target) {
        if (typeof stars === "undefined" || !currentStar) return;
        var starName = args.join(" ").toLowerCase();
        var found = null;
        for (var si = 0; si < stars.length; si++) {
          if (stars[si].name.toLowerCase() === starName) {
            found = stars[si];
            break;
          }
        }
        if (!found) {
          for (var si = 0; si < stars.length; si++) {
            if (stars[si].name.toLowerCase().indexOf(starName) !== -1) {
              found = stars[si];
              break;
            }
          }
        }
        if (!found) {
          print("star not found: " + args.join(" "), "console-err");
          return;
        }
        currentStar = found;
        currentStar.visited = true;
        selectedStar = currentStar;
        if (typeof refreshStarPrices === "function")
          refreshStarPrices(currentStar);
        if (typeof updateNewsLabel === "function") updateNewsLabel();
        cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: 15 };
        routePath = [];
        starInfo.innerHTML =
          '<span class="star-current">' +
          currentStar.name +
          " " +
          ICON_CHECK +
          '</span><br><span class="star-dist">Current location</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ' +
          classifyStar(currentStar) +
          '</span><br><span class="star-dist"><span class="star-label-route">System:</span> ' +
          currentStar.system +
          '</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ' +
          TECH_NAMES[getTechLevel(currentStar)] +
          '</span><br><span class="star-dist"><span class="star-label-route">Status:</span> ' +
          (currentStar.status != null
            ? STATUS_STR[currentStar.status]
            : "Uneventful") +
          "</span>";
        if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
        if (typeof checkMissionCompletion === "function")
          checkMissionCompletion();
        if (typeof generateProcMissions === "function")
          generateProcMissions(currentStar);
        updateInfoClean();
        done();
        if (typeof saveState === "function") saveState();
        print("jumped to " + currentStar.name, "console-ok");
      } else {
        print("usage: jump <moon|star|worm|star name>", "console-err");
      }
    },
    go: function (args) {
      const action = (args[0] || "").toLowerCase();
      if (action === "die") {
        if (typeof die === "function") {
          die();
          done();
          print("died", "console-warn");
        }
      } else if (action === "retire") {
        if (typeof showRetirement === "function") {
          showRetirement();
          done();
          print("retired", "console-ok");
        }
      } else {
        print("usage: go <die|retire>", "console-err");
      }
    },
    exit: function () {
      consoleEl.overlay.classList.remove("open");
      consoleEl.input.blur();
    },
    clear: function () {
      output.innerHTML = "";
    },
  };
  let cmdHistory = [];
  let histIdx = -1;
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const text = input.value.trim();
      input.value = "";
      if (!text) return;
      cmdHistory.push(text);
      histIdx = cmdHistory.length;
      print("> " + text);
      const parts = text.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      if (COMMANDS[cmd]) {
        COMMANDS[cmd](args);
      } else {
        print("unknown command: " + cmd + " (try help)", "console-err");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      histIdx = Math.max(0, histIdx - 1);
      input.value = cmdHistory[histIdx];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < cmdHistory.length - 1) {
        histIdx++;
        input.value = cmdHistory[histIdx];
      } else {
        histIdx = cmdHistory.length;
        input.value = "";
      }
    }
  });
  return { overlay: overlay, output: output, input: input, print: print };
})();
document.addEventListener("keydown", (e) => {
  if (e.key === "`" || e.key === "Backquote") {
    e.preventDefault();
    const isOpen = consoleEl.overlay.classList.contains("open");
    if (isOpen) {
      consoleEl.overlay.classList.remove("open");
      if (document.activeElement === consoleEl.input) consoleEl.input.blur();
    } else {
      consoleEl.overlay.classList.add("open");
      consoleEl.input.focus();
    }
  }
});
function showFps() {
  var el = document.createElement("div");
  el.id = "debug-fps";
  el.style.cssText =
    "position:fixed;top:8px;right:8px;color:#0f0;font-size:12px;pointer-events:none;text-shadow:0 0 2px #000;z-index:9999;";
  el.textContent = "0 FPS";
  document.body.appendChild(el);
  var frames = 0,
    last = performance.now();
  function tick(now) {
    if (!window.debugMode) return;
    frames++;
    if (now - last >= 1000) {
      el.textContent = frames + " FPS";
      frames = 0;
      last = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
if (localStorage.getItem("debugFps") === "1") {
  window.debugMode = true;
  showFps();
}
