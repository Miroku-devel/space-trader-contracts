// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

(function () {
  var overlay = document.getElementById("wormhole-overlay");
  if (!overlay) return;
  var obs = new MutationObserver(function () {
    if (typeof SFX === "undefined") return;
    if (overlay.classList.contains("hidden")) {
      if (typeof SFX.stopWormholeTheme === "function") SFX.stopWormholeTheme();
    } else {
      if (typeof SFX.playWormholeTheme === "function") SFX.playWormholeTheme();
    }
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
})();
(function () {
  var shipEl = document.getElementById("wormhole-ship");
  var overlay = document.getElementById("wormhole-overlay");
  if (!shipEl || !overlay) return;
  function setShipSize() {
    var p = _shipScale.px(playerShip.name);
    shipEl.style.width = p + "px";
    shipEl.style.height = p + "px";
  }
  function loadShip() {
    if (typeof playerShip === "undefined" || typeof shipSvgFor !== "function")
      return;
    (async function () {
      try {
        var svg = await shipSvgFor(playerShip.name);
        if (!svg) return;
        var existing = shipEl.querySelector("svg");
        if (existing) existing.remove();
        shipEl.insertAdjacentHTML("afterbegin", svg);
        setShipSize();
        shipEl.classList.toggle("police", playerShip.name === "Police");
      } catch (e) {}
    })();
  }
  var obs = new MutationObserver(function () {
    if (overlay.classList.contains("hidden")) {
      var s = shipEl.querySelector("svg");
      if (s) s.remove();
    } else {
      loadShip();
    }
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  if (!overlay.classList.contains("hidden")) loadShip();
})();
(function () {
  var canvas = document.querySelector(".wormhole-sky");
  var overlay = document.getElementById("wormhole-overlay");
  if (!canvas || !overlay) return;
  var gl = null,
    prog = null,
    u = {},
    vao = null,
    buf = null;
  var _noiseTex = null;
  var _visible = false;
  var _time = 0,
    _lastTime = 0,
    _whSpeed = 1.0;
  function initGL() {
    gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) return false;
    prog = createProgram(gl, bgVS, wormholeFS);
    u.uRes = gl.getUniformLocation(prog, "u_res");
    u.uTime = gl.getUniformLocation(prog, "u_time");
    u.uTex0 = gl.getUniformLocation(prog, "u_tex0");
    u.uMobile = gl.getUniformLocation(prog, "u_mobile");
    var aPos = gl.getAttribLocation(prog, "a_pos");
    var texSize = 256;
    var texData = new Uint8Array(texSize * texSize * 4);
    for (var i = 0; i < texSize * texSize; i++) {
      var v = Math.floor(Math.random() * 256);
      texData[i * 4] = v;
      texData[i * 4 + 1] = v;
      texData[i * 4 + 2] = v;
      texData[i * 4 + 3] = Math.floor(Math.random() * 256);
    }
    _noiseTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, _noiseTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      texSize,
      texSize,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texData,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return true;
  }
  function render(now) {
    if (!_visible) return;
    if (!gl && !initGL()) return;
    var _s = window._resolutionScale || 1.0;
    var cw = canvas.clientWidth,
      ch = canvas.clientHeight;
    var w = Math.round(cw * _s),
      h = Math.round(ch * _s);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (w === 0 || h === 0) return;
    if (_lastTime === 0) _lastTime = now;
    var dt = (now - _lastTime) / 1000;
    _lastTime = now;
    if (window._warpPaused) {
      _whSpeed *= 0.97;
      if (_whSpeed < 0.5) _whSpeed = 0.5;
    } else {
      _whSpeed = Math.min(1, _whSpeed + 0.03);
    }
    _time += dt * _whSpeed;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(u.uRes, w, h);
    if (u.uTime !== null) gl.uniform1f(u.uTime, _time);
    if (u.uMobile !== null)
      gl.uniform1f(u.uMobile, window.innerWidth <= 600 ? 1.0 : 0.0);
    if (u.uTex0 !== null) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, _noiseTex);
      gl.uniform1i(u.uTex0, 0);
    }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
  function start() {
    if (_visible) return;
    _visible = true;
    _lastTime = 0;
    if (!gl) initGL();
    window._registerTravelRender(render);
  }
  function stop() {
    _visible = false;
    window._unregisterTravelRender(render);
  }
  var obs = new MutationObserver(function () {
    if (overlay.classList.contains("hidden")) stop();
    else start();
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  if (!overlay.classList.contains("hidden")) start();
})();
(function () {
  var overlay = document.getElementById("wormhole-overlay");
  if (!overlay) return;
  var bar = document.getElementById("wormhole-progress-bar");
  var label = document.getElementById("wormhole-progress-label");
  var fromEl = document.getElementById("wormhole-progress-from");
  var toEl = document.getElementById("wormhole-progress-to");
  var _start = 0,
    _duration = 10000,
    _dist = 0;
  function wormholeArrive() {
    if (
      typeof selectedStar === "undefined" ||
      !selectedStar ||
      !selectedStar.bridge ||
      !selectedStar.bridgeExit
    )
      return;
    closeAllOverlays();
    var tax =
      typeof fuelCostPerUnit === "function" ? fuelCostPerUnit() * 25 : 0;
    if (typeof playerCredits !== "undefined" && playerCredits >= tax) {
      playerCredits -= tax;
    } else if (typeof playerCredits !== "undefined") {
      playerCredits = 0;
    }
    if (typeof advanceTurn === "function") advanceTurn();
    var exit = selectedStar.bridgeExit;
    currentStar = exit;
    currentStar.replenishCountdown = 4;
    currentStar.visited = true;
    selectedStar = currentStar;
    if (typeof refreshStarPrices === "function") refreshStarPrices(currentStar);
    if (typeof updateNewsLabel === "function") updateNewsLabel();
    cameraTarget = { x: exit.x, y: exit.y, zoom: camera.zoom };
    if (typeof routePath !== "undefined" && routePath.length > 1) {
      var idx = routePath.indexOf(currentStar);
      if (idx === routePath.length - 1) {
        routePath = [];
      } else if (idx >= 0) {
        routePath = routePath.slice(idx);
      } else {
        var dest = routePath[routePath.length - 1];
        routePath =
          typeof findPath === "function" ? findPath(currentStar, dest) : [];
      }
    }
    if (typeof starInfo !== "undefined") {
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
    }
    if (typeof checkArrivalAlerts === "function") checkArrivalAlerts();
    if (typeof checkMissionCompletion === "function") checkMissionCompletion();
    if (typeof generateProcMissions === "function")
      generateProcMissions(currentStar);
    if (typeof updateInfoClean === "function") updateInfoClean();
    if (typeof updateInfoRoute === "function") updateInfoRoute();
    overlay.classList.add("hidden");
  }
  var _showCrate = false,
    _crateLoaded = false,
    _crateEncounter = false,
    _crateLooted = false,
    _crateEncounterPct = 0,
    _crateEncounterPctAt = 0.5,
    _crateResumeTimer = null,
    _puzzleAnswer = null;
  function _freeCargo() {
    if (typeof SHIP_STATS === "undefined" || typeof playerShip === "undefined")
      return 0;
    var cap =
      SHIP_STATS[playerShip.name].cargo +
      playerShip.gadgets.filter(function (g) {
        return g === "5 extra cargo bays";
      }).length *
        5;
    var used = 0;
    if (
      typeof TRADE_ITEMS !== "undefined" &&
      typeof playerCargo !== "undefined"
    ) {
      TRADE_ITEMS.forEach(function (ti) {
        used += playerCargo[ti.id] || 0;
      });
    }
    used += 0;
    return cap - used;
  }
  function _generatePuzzle() {
    var types = [
      function () {
        var a = 1 + Math.floor(Math.random() * 5);
        var b = 1 + Math.floor(Math.random() * 5);
        var seq = [a, b];
        for (var i = 0; i < 4; i++) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
        var answer = seq[seq.length - 1] + seq[seq.length - 2];
        return { seq: seq, answer: answer };
      },
      function () {
        var start = 2 + Math.floor(Math.random() * 4);
        var seq = [start];
        for (var i = 1; i <= 5; i++) seq.push(seq[i - 1] * (i + 1));
        var answer = seq[seq.length - 1] * (seq.length + 1);
        return { seq: seq, answer: answer };
      },
      function () {
        var start = 10 + Math.floor(Math.random() * 20);
        var seq = [start];
        for (var i = 0; i < 5; i++) seq.push(seq[i] * 2 - 1);
        var answer = seq[seq.length - 1] * 2 - 1;
        return { seq: seq, answer: answer };
      },
      function () {
        var start = 5 + Math.floor(Math.random() * 10);
        var seq = [start];
        for (var i = 0; i < 5; i++) seq.push(seq[i] * 3 - 1);
        var answer = seq[seq.length - 1] * 3 - 1;
        return { seq: seq, answer: answer };
      },
      function () {
        var start = 100 + Math.floor(Math.random() * 100);
        var sub = 5 + Math.floor(Math.random() * 10);
        var seq = [start];
        for (var i = 0; i < 5; i++) seq.push(seq[i] - (sub - i));
        var answer = seq[seq.length - 1] - (sub - 5);
        return { seq: seq, answer: answer };
      },
      function () {
        var start = 10 + Math.floor(Math.random() * 20);
        var add = 2 + Math.floor(Math.random() * 5);
        var seq = [start];
        for (var i = 0; i < 5; i++) seq.push(seq[i] + add + i);
        var answer = seq[seq.length - 1] + add + 5;
        return { seq: seq, answer: answer };
      },
    ];
    var puzzle = types[Math.floor(Math.random() * types.length)]();
    var answer = puzzle.answer;
    var wrong1 = answer + Math.floor(Math.random() * 10) + 5;
    var wrong2 = answer - Math.floor(Math.random() * 10) - 5;
    if (wrong2 < 0) wrong2 = answer + Math.floor(Math.random() * 15) + 10;
    var options = [answer, wrong1, wrong2];
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = options[i];
      options[i] = options[j];
      options[j] = tmp;
    }
    return { seq: puzzle.seq, answer: answer, options: options };
  }
  function _giveCrateRewards() {
    var rewards = [];
    var freeCargo = _freeCargo();
    if (Math.random() < 0.3 || freeCargo <= 0) {
      var amount = Math.floor(Math.random() * 501);
      if (amount > 0) amount = Math.round(amount / 10) * 10;
      if (typeof playerCredits !== "undefined") {
        playerCredits += amount;
        rewards.push({
          label: "Credits",
          value: "+" + amount.toLocaleString() + " cr",
          cls: "credits",
        });
      }
    }
    if (
      freeCargo > 0 &&
      typeof TRADE_ITEMS !== "undefined" &&
      typeof playerCargo !== "undefined"
    ) {
      var usedSpace = 0;
      var itemCount = 1 + Math.floor(Math.random() * Math.min(5, freeCargo));
      var legalItems = TRADE_ITEMS.filter(function (ti) {
        return !ti.illegal;
      });
      var picked = [];
      for (
        var i = 0;
        i < itemCount &&
        usedSpace < freeCargo &&
        picked.length < legalItems.length;
        i++
      ) {
        var idx = Math.floor(Math.random() * legalItems.length);
        if (picked.indexOf(idx) >= 0) {
          i--;
          continue;
        }
        picked.push(idx);
        var maxQty = Math.min(
          freeCargo - usedSpace,
          1 + Math.floor(Math.random() * 10),
        );
        var qty = maxQty;
        var itemId = legalItems[idx].id;
        playerCargo[itemId] = (playerCargo[itemId] || 0) + qty;
        usedSpace += qty;
        rewards.push({
          label: legalItems[idx].name,
          value: "+" + qty,
          cls: "positive",
        });
      }
    }
    return rewards;
  }
  function _showRewards(rewards) {
    var whMsg = document.getElementById("wormhole-msg-label");
    if (whMsg && rewards.length > 0) {
      var html = "";
      for (var r = 0; r < rewards.length; r++) {
        html +=
          '<span class="reward-row"><span class="reward-label">' +
          rewards[r].label +
          '</span><span class="reward-value ' +
          rewards[r].cls +
          '">' +
          rewards[r].value +
          "</span></span>";
      }
      whMsg.innerHTML = html;
    } else if (whMsg) {
      whMsg.textContent = "The crate is empty.";
    }
  }
  function _onPuzzleAnswer(correct) {
    if (_crateLooted || !_crateEncounter) return;
    _crateLooted = true;
    var puzzleBtns = document.querySelectorAll("#wormhole-scene .puzzle-btn");
    for (var i = 0; i < puzzleBtns.length; i++) puzzleBtns[i].classList.add("hidden");
    var puzzleSeq = document.getElementById("wormhole-puzzle-sequence");
    if (puzzleSeq) puzzleSeq.classList.add("hidden");
    var whMsg = document.getElementById("wormhole-msg-label");
    if (correct) {
      if (typeof SFX !== "undefined" && typeof SFX.play === "function")
        SFX.play("granted");
      var rewards = _giveCrateRewards();
      if (whMsg) {
        var html = "Access granted!";
        for (var r = 0; r < rewards.length; r++) {
          html +=
            '<span class="reward-row"><span class="reward-label">' +
            rewards[r].label +
            '</span><span class="reward-value ' +
            rewards[r].cls +
            '">' +
            rewards[r].value +
            "</span></span>";
        }
        whMsg.innerHTML = html;
      }
      if (typeof saveTradeState === "function") saveTradeState();
      if (typeof updateCargoDisplay === "function") updateCargoDisplay();
    } else {
      if (typeof SFX !== "undefined" && typeof SFX.play === "function")
        SFX.play("denied");
      if (whMsg) whMsg.textContent = "Crate locked. Access denied.";
    }
    if (typeof updateGameDate === "function") updateGameDate();
    if (typeof saveState === "function") saveState();
    var contBtn = document.getElementById("wormhole-ignore-btn");
    if (contBtn) contBtn.classList.remove("hidden");
  }
  function _loadCrateSvg() {
    var crateEl = document.getElementById("wormhole-crate");
    if (!crateEl || _crateLoaded) return;
    _crateLoaded = true;
    if (typeof shipSvgFor !== "function") return;
    shipSvgFor("crate").then(function (svg) {
      if (!svg) return;
      var existing = crateEl.querySelector("svg");
      if (existing) existing.remove();
      crateEl.insertAdjacentHTML("afterbegin", svg);
    });
  }
  function _spawnCrateEncounter(pct) {
    if (_crateEncounter) return;
    _crateEncounter = true;
    _crateEncounterPct = pct;
    window._warpPaused = true;
    var wd = document.querySelector("#wormhole-scene .warp-drive");
    if (wd) wd.style.opacity = "0";
    var crateEl = document.getElementById("wormhole-crate");
    if (!crateEl) return;
    var puzzle = _generatePuzzle();
    _puzzleAnswer = puzzle.answer;
    var doShow = function () {
      crateEl.classList.remove("hidden");
      crateEl.style.opacity = "";
      crateEl.style.transition = "";
      void crateEl.offsetHeight;
      crateEl.classList.add("show");
      var whMsg = document.getElementById("wormhole-msg-label");
      if (whMsg) {
        whMsg.textContent =
          "An abandoned crate has been found...";
        whMsg.classList.remove("hidden");
      }
      var puzzleSeq = document.getElementById("wormhole-puzzle-sequence");
      if (puzzleSeq) {
        puzzleSeq.textContent = puzzle.seq.join(" - ") + " - XX";
        puzzleSeq.classList.remove("hidden");
      }
      var btn1 = document.getElementById("puzzle-btn-1");
      var btn2 = document.getElementById("puzzle-btn-2");
      var btn3 = document.getElementById("puzzle-btn-3");
      if (btn1) {
        btn1.textContent = puzzle.options[0];
        btn1.classList.remove("hidden");
        btn1.onclick = function () {
          _onPuzzleAnswer(puzzle.options[0] === _puzzleAnswer);
        };
      }
      if (btn2) {
        btn2.textContent = puzzle.options[1];
        btn2.classList.remove("hidden");
        btn2.onclick = function () {
          _onPuzzleAnswer(puzzle.options[1] === _puzzleAnswer);
        };
      }
      if (btn3) {
        btn3.textContent = puzzle.options[2];
        btn3.classList.remove("hidden");
        btn3.onclick = function () {
          _onPuzzleAnswer(puzzle.options[2] === _puzzleAnswer);
        };
      }
      var ignoreBtn = document.getElementById("wormhole-ignore-btn");
      if (ignoreBtn) ignoreBtn.classList.remove("hidden");
    };
    var existing = crateEl.querySelector("svg");
    if (existing) {
      doShow();
    } else if (typeof shipSvgFor === "function") {
      _crateLoaded = true;
      shipSvgFor("crate").then(function (svg) {
        if (!svg) return;
        crateEl.insertAdjacentHTML("afterbegin", svg);
        doShow();
      });
    }
  }
  function _resumeFromCrate() {
    if (_crateResumeTimer) {
      clearTimeout(_crateResumeTimer);
      _crateResumeTimer = null;
    }
    _showCrate = false;
    _crateEncounter = false;
    _crateLooted = false;
    _puzzleAnswer = null;
    var crateEl = document.getElementById("wormhole-crate");
    if (crateEl) {
      crateEl.classList.remove("show");
      crateEl.style.pointerEvents = "";
    }
    var ignoreBtn = document.getElementById("wormhole-ignore-btn");
    if (ignoreBtn) ignoreBtn.classList.add("hidden");
    var puzzleSeq = document.getElementById("wormhole-puzzle-sequence");
    if (puzzleSeq) {
      puzzleSeq.classList.add("hidden");
      puzzleSeq.textContent = "";
    }
    var puzzleBtns = document.querySelectorAll("#wormhole-scene .puzzle-btn");
    for (var i = 0; i < puzzleBtns.length; i++) puzzleBtns[i].classList.add("hidden");
    var whMsg = document.getElementById("wormhole-msg-label");
    if (whMsg) whMsg.classList.add("hidden");
    var wd = document.querySelector("#wormhole-scene .warp-drive");
    if (wd) wd.style.opacity = "1";
    _crateResumeTimer = setTimeout(function () {
      if (crateEl) crateEl.classList.add("hidden");
      window._warpPaused = false;
      _start = performance.now() - _crateEncounterPct * _duration;
    }, 800);
  }
  function startWormhole() {
    if (
      typeof currentStar === "undefined" ||
      typeof selectedStar === "undefined" ||
      !selectedStar ||
      !selectedStar.bridge ||
      !selectedStar.bridgeExit
    )
      return;
    if (_crateResumeTimer) {
      clearTimeout(_crateResumeTimer);
      _crateResumeTimer = null;
    }
    if (fromEl)
      fromEl.innerHTML = ICON_MAP_PIN + " " + (currentStar.name || "");
    if (toEl)
      toEl.innerHTML =
        ((selectedStar.bridgeExit && selectedStar.bridgeExit.name) ||
          selectedStar.name ||
          "") +
        " " +
        ICON_MAP_PIN;
    _dist =
      typeof travelDistance === "function"
        ? travelDistance(currentStar, selectedStar.bridgeExit)
        : 10;
    _start = performance.now();
    _showCrate = Math.random() < 0.5;
    _crateEncounterPctAt = 0.05 + Math.random() * 0.9;
    _crateEncounter = false;
    _crateLooted = false;
    var crateEl = document.getElementById("wormhole-crate");
    if (crateEl) {
      crateEl.classList.remove("show");
      crateEl.classList.add("hidden");
    }
    var ignoreBtn = document.getElementById("wormhole-ignore-btn");
    if (ignoreBtn) ignoreBtn.classList.add("hidden");
    var puzzleSeq = document.getElementById("wormhole-puzzle-sequence");
    if (puzzleSeq) {
      puzzleSeq.classList.add("hidden");
      puzzleSeq.textContent = "";
    }
    var puzzleBtns = document.querySelectorAll("#wormhole-scene .puzzle-btn");
    for (var i = 0; i < puzzleBtns.length; i++) puzzleBtns[i].classList.add("hidden");
    if (_showCrate) _loadCrateSvg();
    window._warpPaused = false;
    bar.style.width = "0%";
    label.textContent = "1/" + _dist + " pc";
    window._registerTravelRender(tick);
  }
  function tick() {
    if (overlay.classList.contains("hidden") || window._warpPaused) return;
    var elapsed = performance.now() - _start;
    var pct = Math.min(elapsed / _duration, 1);
    bar.style.width = pct * 100 + "%";
    label.textContent =
      Math.min(_dist, Math.floor(_dist * pct) + 1) +
      "/" +
      _dist +
      " pc";
    if (_showCrate && !_crateEncounter && pct > _crateEncounterPctAt) {
      _spawnCrateEncounter(pct);
    }
    if (pct >= 1) {
      label.textContent = "Arriving...";
      window._unregisterTravelRender(tick);
      if (typeof wormholeArrive === "function") wormholeArrive();
    }
  }
  function stop() {
    window._unregisterTravelRender(tick);
    window._warpPaused = false;
    if (_crateResumeTimer) {
      clearTimeout(_crateResumeTimer);
      _crateResumeTimer = null;
    }
    var wd = document.querySelector("#wormhole-scene .warp-drive");
    if (wd) wd.style.opacity = "1";
    var crateEl = document.getElementById("wormhole-crate");
    if (crateEl) {
      crateEl.classList.remove("show");
      crateEl.classList.add("hidden");
      crateEl.style.pointerEvents = "";
    }
    _crateLooted = false;
    _puzzleAnswer = null;
    var ignoreBtn = document.getElementById("wormhole-ignore-btn");
    if (ignoreBtn) ignoreBtn.classList.add("hidden");
    var puzzleSeq = document.getElementById("wormhole-puzzle-sequence");
    if (puzzleSeq) {
      puzzleSeq.classList.add("hidden");
      puzzleSeq.textContent = "";
    }
    var puzzleBtns = document.querySelectorAll("#wormhole-scene .puzzle-btn");
    for (var i = 0; i < puzzleBtns.length; i++) puzzleBtns[i].classList.add("hidden");
    var whMsg = document.getElementById("wormhole-msg-label");
    if (whMsg) whMsg.classList.add("hidden");
  }
  var mql = window.matchMedia("(max-width: 600px)");
  mql.addEventListener("change", function () {
    var crateEl = document.getElementById("wormhole-crate");
    if (crateEl) {
      crateEl.style.transition = "none";
      requestAnimationFrame(function () {
        crateEl.style.transition = "";
      });
    }
  });
  var ignoreBtn = document.getElementById("wormhole-ignore-btn");
  if (ignoreBtn) {
    ignoreBtn.addEventListener("click", _resumeFromCrate);
  }
  var obs = new MutationObserver(function () {
    if (overlay.classList.contains("hidden")) stop();
    else startWormhole();
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  if (!overlay.classList.contains("hidden")) startWormhole();
})();
