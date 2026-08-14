// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

window._travelRenderCallbacks = [];
window._travelAnimId = null;
window._rectCache = {};
window._rectCacheFrame = 0;
window._getRect = function (el) {
  var key = el.id || el.className || el;
  var entry = window._rectCache[key];
  if (entry && entry.f === window._rectCacheFrame) return entry.r;
  var r = el.getBoundingClientRect();
  window._rectCache[key] = { r: r, f: window._rectCacheFrame };
  return r;
};
window._registerTravelRender = function (fn) {
  if (window._travelRenderCallbacks.indexOf(fn) === -1) {
    window._travelRenderCallbacks.push(fn);
  }
  if (!window._travelAnimId) {
    window._travelAnimId = requestAnimationFrame(_travelAnimate);
  }
};
window._unregisterTravelRender = function (fn) {
  var idx = window._travelRenderCallbacks.indexOf(fn);
  if (idx !== -1) window._travelRenderCallbacks.splice(idx, 1);
  if (window._travelRenderCallbacks.length === 0 && window._travelAnimId) {
    cancelAnimationFrame(window._travelAnimId);
    window._travelAnimId = null;
  }
};
function _travelAnimate(time) {
  window._rectCacheFrame++;
  for (var i = 0; i < window._travelRenderCallbacks.length; i++) {
    window._travelRenderCallbacks[i](time);
  }
  window._travelAnimId = requestAnimationFrame(_travelAnimate);
}
btnInfoRoute.addEventListener("click", function () {
  closeAllOverlays();
  if (routePath.length > 1) {
    routePath = [];
    updateInfoClean();
    return;
  }
  if (selectedStar && currentStar) {
    showRoute(selectedStar);
  }
});
function freeRepair(amount) {
  if (typeof playerShip === "undefined" || !playerShip) return;
  var maxH = typeof maxHull === "function" ? maxHull() : 100;
  var cur = playerShip.hull != null ? playerShip.hull : maxH;
  if (cur >= maxH) return;
  playerShip.hull = Math.min(maxH, cur + amount);
  if (typeof savePlayerShip === "function") savePlayerShip();
}
function arriveAtStar() {
  closeAllOverlays();
  window._manhuntClick = undefined;
  window._manhuntStar = undefined;
  window._manhuntSpawnNow = false;
  window._heroClick = undefined;
  window._heroStar = undefined;
  window._heroSpawnNow = false;
  window._isHeroEnemy = false;
  if (
    selectedStar &&
    selectedStar !== currentStar &&
    starsWithinRange().includes(selectedStar) &&
    !(
      currentStar &&
      currentStar.bridge &&
      currentStar.bridgeExit &&
      selectedStar === currentStar.bridgeExit
    )
  ) {
    var dist = travelDistance(currentStar, selectedStar);
    if (typeof engineerSkillTotal === "function") {
      freeRepair(Math.floor(Math.random() * engineerSkillTotal()));
    }
    playerFuel -= dist;
    saveFuelState();
    if (typeof updateFuelBlink === "function") updateFuelBlink();
    advanceTurn();
    currentStar = selectedStar;
    currentStar.replenishCountdown = 4;
    currentStar.visited = true;
    selectedStar = currentStar;
    refreshStarPrices(currentStar);
    if (typeof updateNewsLabel === "function") updateNewsLabel();
    cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: camera.zoom };
    if (routePath.length > 1) {
      var idx = routePath.indexOf(currentStar);
      if (idx === routePath.length - 1) {
        routePath = [];
      } else if (idx >= 0) {
        routePath = routePath.slice(idx);
      } else {
        var dest = routePath[routePath.length - 1];
        routePath = findPath(currentStar, dest);
      }
    }
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
    checkArrivalAlerts();
    if (typeof checkMissionCompletion === "function") checkMissionCompletion();
    if (typeof beginMissionCancelBatch === "function") beginMissionCancelBatch();
    if (typeof checkDeliverCargoIntegrity === "function")
      checkDeliverCargoIntegrity("cargo lost in travel");
    if (typeof sendMissionCancelBatchMail === "function") sendMissionCancelBatchMail();
    if (typeof generateProcMissions === "function")
      generateProcMissions(currentStar);
    if (typeof renderMissionPages === "function") renderMissionPages();
    if (typeof saveState === "function") saveState();
    updateInfoClean();
    updateInfoRoute();
  } else if (selectedStar && selectedStar === currentStar) {
    refreshStarPrices(currentStar);
    cameraTarget = { x: currentStar.x, y: currentStar.y, zoom: camera.zoom };
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
    checkArrivalAlerts();
    updateInfoClean();
    updateInfoRoute();
  }
}
btnInfoTravel.addEventListener("click", function () {
  window._warpPaused = false;
  closeAllOverlays();
  if (
    !selectedStar ||
    selectedStar === currentStar ||
    !starsWithinRange().includes(selectedStar) ||
    (currentStar &&
      currentStar.bridge &&
      currentStar.bridgeExit &&
      selectedStar === currentStar.bridgeExit)
  )
    return;
  document.getElementById("travel-overlay").classList.remove("hidden");
});
btnInfoWormhole.addEventListener("click", function () {
  closeAllOverlays();
  if (!selectedStar || !selectedStar.bridge || !selectedStar.bridgeExit) return;
  var wormholeOverlay = document.getElementById("wormhole-overlay");
  if (wormholeOverlay) wormholeOverlay.classList.remove("hidden");
});
(function () {
  var overlay = document.getElementById("travel-overlay");
  if (!overlay) return;
  var obs = new MutationObserver(function () {
    if (typeof SFX === "undefined") return;
    if (overlay.classList.contains("hidden")) {
      if (typeof SFX.stopTravelTheme === "function") SFX.stopTravelTheme();
    } else {
      if (typeof SFX.playTravelTheme === "function") SFX.playTravelTheme();
    }
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
})();
var _shipScale = (function () {
  var sizes = {
    Flea: 0,
    Gnat: 1,
    Firefly: 1,
    Mosquito: 1,
    Bumblebee: 2,
    Beetle: 2,
    Hornet: 3,
    Grasshopper: 3,
    Termite: 4,
    Wasp: 4,
    Dragonfly: 1,
    Mantis: 4,
    Police: 1,
    Scarab: 3,
    Scorp: 3,
  };
  return {
    sizeOf: function (name) {
      return sizes[name] !== undefined ? sizes[name] : 2;
    },
    factor: function (name) {
      return 0.55 + (this.sizeOf(name) / 4) * 0.5;
    },
    px: function (name) {
      return Math.round(180 * this.factor(name));
    },
  };
})();
window._shipSize = function (name) {
  return _shipScale.sizeOf(name);
};
window._shipPx = function (name) {
  return _shipScale.px(name);
};
var _start = 0,
  _duration = 0,
  _dist = 0,
  _destSystem = "";
var _currentClick = 0;
var WARP_CLICKS = 21;
(function () {
  var shipEl = document.getElementById("travel-ship");
  var overlay = document.getElementById("travel-overlay");
  if (!shipEl || !overlay) return;
  function setShipSize() {
    var p = _shipScale.px(playerShip.name);
    shipEl.style.width = p + "px";
    shipEl.style.height = p + "px";
    shipEl.style.left = "";
    shipEl.style.bottom = "";
    if (playerShip.name === "Mantis" || playerShip.name === "Scorp") {
      if (window.innerWidth > 600) {
        shipEl.style.left = "calc(50% - " + (300 + (p - 144) / 2) + "px)";
      } else {
        shipEl.style.bottom = 140 - (p - 144) + "px";
      }
    }
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
  window.addEventListener("resize", function () {
    if (
      typeof playerShip !== "undefined" &&
      !overlay.classList.contains("hidden")
    ) {
      setShipSize();
    }
  });
})();
(function () {
  var OVERLAY_CFGS = [
    {
      overlayId: "travel-overlay",
      sceneId: "travel-scene",
      shipId: "travel-ship",
      enemyId: "travel-enemy",
    },
    {
      overlayId: "wormhole-overlay",
      sceneId: "wormhole-scene",
      shipId: "wormhole-ship",
      enemyId: null,
    },
  ];
  var canvas = document.createElement("canvas");
  canvas.className = "shield-sky";
  var gl = null,
    prog = null,
    u = {},
    vao = null,
    buf = null;
  var _visible = false;
  var _cloakFade = 1.0;
  var shipEl = null,
    enemyEl = null;
  function initGL() {
    gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) return false;
    prog = createProgram(gl, bgVS, shieldFS);
    u.pos = gl.getAttribLocation(prog, "a_pos");
    u.uTime = gl.getUniformLocation(prog, "u_time");
    u.uRes = gl.getUniformLocation(prog, "u_res");
    u.uShipPos = gl.getUniformLocation(prog, "u_shipPos");
    u.uShipSize = gl.getUniformLocation(prog, "u_shipSize");
    u.uMobile = gl.getUniformLocation(prog, "u_mobile");
    u.uShieldColor = gl.getUniformLocation(prog, "u_shieldColor");
    u.uMirror = gl.getUniformLocation(prog, "u_mirror");
    u.uShieldAlpha = gl.getUniformLocation(prog, "u_shieldAlpha");
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
  var _shieldUt = 0,
    _shieldLastTime = 0;
  function _shieldColor(shields) {
    var r = 0,
      g = 0,
      b = 0;
    for (var i = 0; i < shields.length; i++) {
      var s = shields[i];
      if (s.indexOf("Lightning") !== -1) {
        r += 1.0;
        g += 0.9;
        b += 0.1;
      } else if (s.indexOf("Reflective") !== -1) {
        r += 0.8;
        g += 0.3;
        b += 1.0;
      } else {
        r += 0.3;
        g += 0.7;
        b += 1.0;
      }
    }
    var n = shields.length;
    return [r / n, g / n, b / n];
  }
  function render(time) {
    if (!_visible) return;
    var _s = isFinite(window._resolutionScale) ? window._resolutionScale : 1.0;
    var cw = canvas.clientWidth,
      ch = canvas.clientHeight;
    var w = Math.round(cw * _s),
      h = Math.round(ch * _s);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (w === 0 || h === 0) return;
    var dt = _shieldLastTime ? ((time - _shieldLastTime) / 1000) * 0.1 : 0;
    _shieldUt += dt;
    _shieldLastTime = time;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var isCloaked = shipEl && shipEl.classList.contains("cloak-active");
    if (!isCloaked) _cloakFade = Math.min(1.0, _cloakFade + dt * 20);
    else _cloakFade = Math.max(0.0, _cloakFade - dt * 20);
    if (typeof playerShip !== "undefined" && playerShip.shields.length > 0 && _cloakFade > 0.01) {
      var sc = _shieldColor(playerShip.shields);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      gl.uniform1f(u.uTime, _shieldUt);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform3f(u.uShieldColor, sc[0], sc[1], sc[2]);
      var pa =
        window._playerShieldMax > 0
          ? (window._playerShieldHp || 0) / window._playerShieldMax
          : 0;
      gl.uniform1f(u.uShieldAlpha, pa * _cloakFade);
      gl.uniform1f(u.uMirror, 1.0);
      if (shipEl) {
        var sr = window._getRect(shipEl);
        var cr = window._getRect(canvas);
        gl.uniform2f(
          u.uShipPos,
          (sr.left + sr.width * 0.5 - cr.left) / cw,
          1.0 - (sr.top + sr.height * 0.5 - cr.top) / ch,
        );
        gl.uniform1f(
          u.uShipSize,
          Math.sqrt(sr.width * sr.width + sr.height * sr.height) * 0.4 * _s,
        );
        gl.uniform1f(u.uMobile, window.innerWidth <= 600 ? 1.0 : 0.0);
      }
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
    }
    if (
      typeof window._enemyShields !== "undefined" &&
      window._enemyShields.length > 0
    ) {
      var ec = _shieldColor(window._enemyShields);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      gl.uniform1f(u.uTime, _shieldUt);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform3f(u.uShieldColor, ec[0], ec[1], ec[2]);
      var ea =
        window._enemyShieldMax > 0
          ? (window._enemyShieldHp || 0) / window._enemyShieldMax
          : 0;
      gl.uniform1f(u.uShieldAlpha, ea);
      gl.uniform1f(u.uMirror, -1.0);
      if (enemyEl) {
        var er = window._getRect(enemyEl);
        var cr = window._getRect(canvas);
        gl.uniform2f(
          u.uShipPos,
          (er.left + er.width * 0.5 - cr.left) / cw,
          1.0 - (er.top + er.height * 0.5 - cr.top) / ch,
        );
        gl.uniform1f(
          u.uShipSize,
          Math.sqrt(er.width * er.width + er.height * er.height) * 0.4 * _s,
        );
        gl.uniform1f(u.uMobile, window.innerWidth <= 600 ? 1.0 : 0.0);
      }
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
    }
  }
  function getActiveCfg() {
    for (var i = 0; i < OVERLAY_CFGS.length; i++) {
      var el = document.getElementById(OVERLAY_CFGS[i].overlayId);
      if (el && !el.classList.contains("hidden")) return OVERLAY_CFGS[i];
    }
    return null;
  }
  function start() {
    if (_visible) return;
    var cfg = getActiveCfg();
    if (!cfg) return;
    _visible = true;
    var scene = document.getElementById(cfg.sceneId);
    if (scene && canvas.parentNode !== scene) scene.appendChild(canvas);
    shipEl = document.getElementById(cfg.shipId);
    enemyEl = cfg.enemyId ? document.getElementById(cfg.enemyId) : null;
    _shieldUt = 0;
    _shieldLastTime = 0;
    canvas.style.opacity = "";
    window._playerShieldMax = window._totalShieldPower(
      typeof playerShip !== "undefined" ? playerShip.shields : [],
    );
    window._playerShieldHp = window._playerShieldMax;
    if (!gl) initGL();
    window._registerTravelRender(render);
  }
  function stop() {
    _visible = false;
    _cloakFade = 1.0;
    window._unregisterTravelRender(render);
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }
  var obs = new MutationObserver(function () {
    if (getActiveCfg()) start();
    else stop();
  });
  for (var i = 0; i < OVERLAY_CFGS.length; i++) {
    var el = document.getElementById(OVERLAY_CFGS[i].overlayId);
    if (el) obs.observe(el, { attributes: true, attributeFilter: ["class"] });
  }
  if (getActiveCfg()) start();
})();
(function () {
  var OVERLAY_CFGS = [
    {
      overlayId: "travel-overlay",
      sceneId: "travel-scene",
      shipId: "travel-ship",
    },
    {
      overlayId: "wormhole-overlay",
      sceneId: "wormhole-scene",
      shipId: "wormhole-ship",
    },
  ];
  var canvas = document.createElement("canvas");
  canvas.className = "warp-drive";
  var gl = null,
    prog = null,
    u = {},
    vao = null,
    buf = null;
  var _visible = false;
  var shipEl = null;
  var WARP_POINTS = {
    wasp: [{ x: -0.0104, y: 0.5027, color: [1.0, 0.8824, 0.2078] }],
    beetle: [{ x: 0.1195, y: 0.501, color: [0.7333, 0.3804, 0.8824] }],
    bumblebee: [
      { x: 0.1651, y: 0.1602 },
      { x: 0.1676, y: 0.8418 },
    ],
    firefly: [{ x: 0.1467, y: 0.5111 }],
    flea: [
      { x: 0.2035, y: 0.1722 },
      { x: 0.2085, y: 0.8438 },
    ],
    gnat: [{ x: 0.114, y: 0.5277 }],
    grasshopper: [{ x: -0.0144, y: 0.5053, color: [0.9686, 0.2588, 0.9176] }],
    hornet: [
      { x: 0.1205, y: 0.4786, color: [0.9686, 0.2588, 0.9176] },
      { x: 0.1205, y: 0.6627, color: [0.9686, 0.2588, 0.9176] },
      { x: 0.123, y: 0.292, color: [0.9686, 0.2588, 0.9176] },
    ],
    mosquito: [
      { x: 0.059, y: 0.3923, color: [1.0, 0.8824, 0.2078] },
      { x: 0.0615, y: 0.6237, color: [1.0, 0.8824, 0.2078] },
    ],
    termite: [{ x: 0.1152, y: 0.5044, color: [0.1373, 0.9608, 0.9843] }],
    dragonfly: [{ x: -0.025, y: 0.5062, color: [1.0, 0.8824, 0.2078] }],
    mantis: [{ x: 0.1977, y: 0.5103, color: [0.0, 1.0, 0.0] }],
    police: [{ x: -0.0283, y: 0.5124, color: [1.0, 0.8824, 0.2078] }],
    scarab: [
      { x: 0.0739, y: 0.394, color: [0.9765, 0.2706, 0.4941] },
      { x: 0.0764, y: 0.6328, color: [0.9765, 0.2706, 0.4941] },
      { x: 0.1261, y: 0.5109, color: [0.9765, 0.2706, 0.4941] },
    ],
    scorp: [{ x: 0.1727, y: 0.5002, color: [1.0, 0.8824, 0.2078] }],
  };
  window.WARP_POINTS = WARP_POINTS;
  function initGL() {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return false;
    prog = createProgram(gl, fullQuadVS, warpFS);
    u.uTime = gl.getUniformLocation(prog, "u_time");
    u.uRes = gl.getUniformLocation(prog, "u_res");
    u.uShipPos = gl.getUniformLocation(prog, "u_shipPos");
    u.uShipSize = gl.getUniformLocation(prog, "u_shipSize");
    u.uMobile = gl.getUniformLocation(prog, "u_mobile");
    u.uWarpCount = gl.getUniformLocation(prog, "u_warpCount");
    u.uWarp = [];
    u.uWarpColor = [];
    for (var i = 0; i < 8; i++) {
      u.uWarp[i] = gl.getUniformLocation(prog, "u_warp[" + i + "]");
      u.uWarpColor[i] = gl.getUniformLocation(prog, "u_warpColor[" + i + "]");
    }
    var aPos = gl.getAttribLocation(prog, "a_pos");
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
  function getWarps() {
    if (typeof playerShip === "undefined") return null;
    return WARP_POINTS[playerShip.name.toLowerCase()] || null;
  }
  var _warpUt = 0,
    _warpLastTime = 0,
    _warpSpeed = 1.0;
  var _warpSoundActive = false;
  function render(time) {
    if (!_visible) return;
    if (canvas.style.opacity === "0") {
      if (_warpSoundActive) {
        SFX.stopLoop("warp_loop");
        _warpSoundActive = false;
      }
      return;
    }
    if (!_warpSoundActive) {
      SFX.startLoop("warp_loop", "warp", 0, 0, function () {
        return 1;
      });
      _warpSoundActive = true;
    }
    var _s = isFinite(window._resolutionScale) ? window._resolutionScale : 1.0;
    var cw = canvas.clientWidth,
      ch = canvas.clientHeight;
    var w = Math.round(cw * _s),
      h = Math.round(ch * _s);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (w === 0 || h === 0) return;
    if (!gl && !initGL()) return;
    if (!window._warpPaused) {
      var dt = _warpLastTime ? (time - _warpLastTime) / 1000 : 0;
      _warpUt += dt;
      _warpSpeed = Math.min(1, _warpSpeed + 0.03);
    } else if (_warpSpeed > 0.001) {
      _warpSpeed *= 0.97;
      var dt = _warpLastTime ? ((time - _warpLastTime) / 1000) * _warpSpeed : 0;
      _warpUt += dt;
    }
    _warpLastTime = time;
    var warps = getWarps();
    if (!warps || warps.length === 0) return;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(prog);
    gl.uniform1f(u.uTime, _warpUt);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uMobile, window.innerWidth <= 600 ? 1.0 : 0.0);
    if (shipEl) {
      var sr = window._getRect(shipEl);
      var cr = window._getRect(canvas);
      var shipPx = Math.sqrt(sr.width * sr.width + sr.height * sr.height) * 0.4;
      gl.uniform2f(
        u.uShipPos,
        (sr.left + sr.width * 0.5 - cr.left) / cw,
        1.0 - (sr.top + sr.height * 0.5 - cr.top) / ch,
      );
      gl.uniform1f(u.uShipSize, shipPx * _s);
      var count = Math.min(warps.length, 8);
      gl.uniform1i(u.uWarpCount, count);
      for (var j = 0; j < count; j++) {
        var lx = ((warps[j].x - 0.5) * sr.width) / shipPx;
        var ly = ((0.5 - warps[j].y) * sr.height) / shipPx;
        gl.uniform2f(u.uWarp[j], lx, ly);
        var c = warps[j].color || [0.0, 0.5, 1.0];
        gl.uniform3f(u.uWarpColor[j], c[0], c[1], c[2]);
      }
    }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }
  function getActiveCfg() {
    for (var i = 0; i < OVERLAY_CFGS.length; i++) {
      var el = document.getElementById(OVERLAY_CFGS[i].overlayId);
      if (el && !el.classList.contains("hidden")) return OVERLAY_CFGS[i];
    }
    return null;
  }
  function start() {
    if (_visible) return;
    var cfg = getActiveCfg();
    if (!cfg) return;
    _visible = true;
    _warpSoundActive = false;
    var scene = document.getElementById(cfg.sceneId);
    if (scene && canvas.parentNode !== scene) scene.appendChild(canvas);
    shipEl = document.getElementById(cfg.shipId);
    _warpUt = 0;
    _warpLastTime = 0;
    canvas.style.opacity = "";
    if (!gl) initGL();
    window._registerTravelRender(render);
  }
  function stop() {
    _visible = false;
    shipEl = null;
    if (_warpSoundActive) {
      SFX.stopLoop("warp_loop");
      _warpSoundActive = false;
    }
    window._unregisterTravelRender(render);
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }
  var obs = new MutationObserver(function () {
    if (getActiveCfg()) start();
    else stop();
  });
  for (var i = 0; i < OVERLAY_CFGS.length; i++) {
    var el = document.getElementById(OVERLAY_CFGS[i].overlayId);
    if (el) obs.observe(el, { attributes: true, attributeFilter: ["class"] });
  }
  if (getActiveCfg()) start();
})();
(function () {
  var overlay = document.getElementById("travel-overlay");
  if (!overlay) return;
  var bar = document.getElementById("travel-progress-bar");
  var label = document.getElementById("travel-progress-label");
  function startTravel() {
    if (
      typeof currentStar === "undefined" ||
      typeof selectedStar === "undefined" ||
      !selectedStar
    )
      return;
    var fromEl = document.getElementById("travel-progress-from");
    var toEl = document.getElementById("travel-progress-to");
    if (fromEl)
      fromEl.innerHTML = ICON_MAP_PIN + " " + (currentStar.name || "");
    if (toEl) toEl.innerHTML = (selectedStar.name || "") + " " + ICON_MAP_PIN;
    var pn = document.getElementById("travel-name-player");
    if (pn) {
      pn.textContent = window.commanderName || "Commander";
      pn.classList.add("hidden");
    }
    _dist = travelDistance(currentStar, selectedStar);
    _duration = Math.max(3000, _dist * 1200);
    _destSystem = selectedStar.system || "";
    window._manhuntClick = undefined;
    window._manhuntStar = undefined;
    window._manhuntSpawnNow = false;
    if (typeof getActiveManhuntStar === "function") {
      var manhuntStar = getActiveManhuntStar(
        selectedStar.name,
        currentStar.name,
      );
      if (manhuntStar) {
        window._manhuntStar = manhuntStar;
        window._manhuntClick =
          1 + Math.floor(Math.random() * (WARP_CLICKS - 1));
      }
    }
    window._heroClick = undefined;
    window._heroStar = undefined;
    window._heroSpawnNow = false;
    window._isHeroEnemy = false;
    if (typeof getActiveHeroStar === "function") {
      var heroStar = getActiveHeroStar(selectedStar.name, currentStar.name);
      if (heroStar) {
        window._heroStar = heroStar;
        window._heroClick = 1 + Math.floor(Math.random() * (WARP_CLICKS - 1));
      }
    }
    _start = performance.now();
    var pp = _shipScale.px(playerShip.name);
    var pContainer = document.getElementById("travel-ship");
    if (pContainer) {
      pContainer.style.width = pp + "px";
      pContainer.style.height = pp + "px";
    }
    var ps = document.getElementById("travel-ship");
    if (ps) {
      ps.style.opacity = "";
      ps.style.transition = "";
    }
    window._warpPaused = false;
    window._inspected = false;
    window._playerShieldMax = _totalShieldPower(
      typeof playerShip !== "undefined" ? playerShip.shields : [],
    );
    window._playerShieldHp = window._playerShieldMax;
    _currentClick = 0;
    enemyEl.classList.remove("show", "police");
    encounterBtns.classList.add("hidden");
    var statsLabel = document.getElementById("travel-stats-label");
    if (statsLabel) statsLabel.classList.add("hidden");
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
    var click = Math.floor(pct * WARP_CLICKS);
    if (click > _currentClick) {
      _currentClick = click;
      if (
        typeof playerShip !== "undefined" &&
        playerShip.shields.length > 0 &&
        window._playerShieldHp < window._playerShieldMax
      ) {
        var es =
          typeof engineerSkillTotal === "function" ? engineerSkillTotal() : 0;
        var regen = Math.floor(Math.random() * (es / 2)) * 2;
        if (regen > 0) {
          window._playerShieldHp = Math.min(
            window._playerShieldMax,
            window._playerShieldHp + regen,
          );
          _updateStatusBars();
          document.getElementById("travel-hull-player") &&
            document
              .getElementById("travel-hull-player")
              .classList.remove("visible");
          document.getElementById("travel-shield-player") &&
            document
              .getElementById("travel-shield-player")
              .classList.remove("visible");
        }
      }
      var eng = engineerSkillTotal();
      freeRepair(Math.floor(Math.random() * (eng / 2)));
      var manhuntFired = false;
      if (
        typeof window._manhuntClick === "number" &&
        click >= window._manhuntClick
      ) {
        window._manhuntClick = undefined;
        window._manhuntSpawnNow = true;
        _encounterPct = click / WARP_CLICKS;
        window._warpPaused = true;
        spawnEncounter("pirate");
        manhuntFired = true;
      }
      if (manhuntFired) return;
      if (typeof window._heroClick === "number" && click >= window._heroClick) {
        window._heroClick = undefined;
        window._heroSpawnNow = true;
        _encounterPct = click / WARP_CLICKS;
        window._warpPaused = true;
        spawnEncounter("hero");
        return;
      }
      if (window._heroStar) return;
      var ch = _encounterChance(_destSystem);
      var mult = _policeMult();
      var encounterTest = Math.floor(Math.random() * 40);
      if (typeof playerShip !== "undefined" && playerShip.name === "Flea") {
        encounterTest *= 2;
      }
      var er = isFinite(window._encounterRate) ? window._encounterRate : 1.0;
      var pirateThresh = ch.pirates * er;
      var policeThresh = (ch.pirates + ch.police * mult) * er;
      var traderThresh = policeThresh + ch.traders * er;
      if (encounterTest < traderThresh) {
        var etype;
        if (encounterTest < pirateThresh) etype = "pirate";
        else if (encounterTest < policeThresh) etype = "police";
        else etype = "trader";
        if (
          etype === "trader" &&
          localStorage.getItem("AUTO_IGNORE_TRADERS") === "1"
        )
          return;
        if (etype === "police") {
          if (_isPoliceShip()) return;
          window._policeEncounterSubtype = undefined;
          if (
            typeof policeRecordScore === "undefined" ||
            policeRecordScore >= -5
          ) {
            var policeSub = _determinePoliceSubtype();
            if (
              policeSub === "ignore" ||
              (policeSub === "inspection" && window._inspected)
            )
              return;
            window._policeEncounterSubtype = policeSub;
          }
        }
        _encounterPct = click / WARP_CLICKS;
        window._warpPaused = true;
        spawnEncounter(etype);
        return;
      }
    }
    if (pct >= 1) {
      if (typeof arriveAtStar === "function") arriveAtStar();
      overlay.classList.add("hidden");
    }
  }
  function stop() {
    _encEpoch++;
    window._unregisterTravelRender(tick);
    window._warpPaused = false;
    window._manhuntClick = undefined;
    window._manhuntStar = undefined;
    window._manhuntSpawnNow = false;
    window._isManhuntEnemy = false;
    window._heroClick = undefined;
    window._heroStar = undefined;
    window._heroSpawnNow = false;
    window._isHeroEnemy = false;
    window._enemyWeapons = [];
    window._enemyShields = [];
    window._enemyGadgets = [];
    window._enemyCargo = {};
    window._isEnemyFleeing = false;
    window._enemyOutcomeDecided = false;
    window._enemyNoWeaponResponded = false;
    window._policeAttackPenaltyApplied = false;
    window._policeEncounterSubtype = undefined;
    window._inspected = false;
    encounterBtns.classList.add("hidden");
    var statsLabel = document.getElementById("travel-stats-label");
    if (statsLabel) statsLabel.classList.add("hidden");
    enemyEl.classList.remove("show", "police");
    document.getElementById("travel-hull-enemy").classList.remove("visible");
    document.getElementById("travel-shield-enemy").classList.remove("visible");
    document.getElementById("travel-hull-player").classList.remove("visible");
    document.getElementById("travel-shield-player").classList.remove("visible");
    var pn = document.getElementById("travel-name-player");
    if (pn) pn.classList.add("hidden");
    var en = document.getElementById("travel-name-enemy");
    if (en) en.classList.add("hidden");
    clearTravelMsg();
  }
  var mql = window.matchMedia("(max-width: 600px)");
  mql.addEventListener("change", function () {
    enemyEl.style.transition = "none";
    requestAnimationFrame(function () {
      enemyEl.style.transition = "";
    });
  });
  var obs = new MutationObserver(function () {
    if (overlay.classList.contains("hidden")) stop();
    else startTravel();
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  if (!overlay.classList.contains("hidden")) startTravel();
})();
(function () {
  var overlay = document.getElementById("travel-overlay");
  var scene = document.getElementById("travel-scene");
  if (!overlay || !scene) return;
  var TRAFFIC_POOL = [
    "Flea", "Gnat", "Firefly", "Mosquito", "Bumblebee",
    "Beetle", "Hornet", "Grasshopper", "Termite", "Wasp",
  ];
  var _svgCache = {},
    _visible = false,
    _h = 0,
    _spawnTimer = null;
  function _fallbackSVG(name) {
    var hue =
      (name.charCodeAt(0) * 37 + name.charCodeAt(name.length - 1) * 53) % 360;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="100%" height="100%"><polygon points="2,20 38,2 32,20 38,38" fill="hsl(' +
      hue +
      ',70%,50%)" opacity="0.8"/></svg>'
    );
  }
  function _loadAll() {
    if (typeof shipSvgFor !== "function") {
      TRAFFIC_POOL.forEach(function (n) {
        _svgCache[n] = _fallbackSVG(n);
      });
      return;
    }
    TRAFFIC_POOL.forEach(function (name) {
      shipSvgFor(name).then(function (svg) {
        if (!svg) {
          _svgCache[name] = _fallbackSVG(name);
          return;
        }
        svg = svg.replace(/width="[^"]*"/g, "").replace(/height="[^"]*"/g, "");
        svg = svg.replace("<svg", '<svg width="100%" height="100%"');
        _svgCache[name] = svg;
      });
    });
  }
  function spawnShip() {
    if (!_visible) return;
    if (window._warpPaused) {
      _spawnTimer = setTimeout(spawnShip, 500);
      return;
    }
    var name = TRAFFIC_POOL[Math.floor(Math.random() * TRAFFIC_POOL.length)];
    if (!_svgCache[name]) {
      _spawnTimer = setTimeout(spawnShip, 500);
      return;
    }
    var dir = Math.random() < 0.5 ? -1 : 1;
    var px = typeof window._shipPx === "function" ? window._shipPx(name) : 120;
    var size = Math.round(px * (0.7 + Math.random() * 0.3));
    var isMobile = window.innerWidth <= 600;
    var el = document.createElement("div");
    el.className = "traffic-ship";
    el.style.cssText =
      "position:absolute;left:0;top:0;width:" +
      size +
      "px;height:" +
      size +
      "px;pointer-events:none;z-index:1;opacity:1;will-change:transform";
    var baseTf = isMobile
      ? dir === 1
        ? " rotate(90deg)"
        : " rotate(-90deg)"
      : dir === -1
        ? " scaleX(-1)"
        : "";
    el.style.transform = "translate(0px, 0px)" + baseTf;
    el.innerHTML = _svgCache[name];
    var w = scene.clientWidth;
    var h = _h || scene.clientHeight;
    var wp = window.WARP_POINTS && window.WARP_POINTS[name.toLowerCase()];
    if (wp && wp.length > 0) {
      for (var b = 0; b < wp.length; b++) {
        var blink = document.createElement("div");
        blink.className = "traffic-warp-blink";
        blink.style.left = wp[b].x * size + "px";
        blink.style.top = wp[b].y * size + "px";
        var c = wp[b].color || [0.0, 0.5, 1.0];
        blink.style.setProperty("--blink-r", Math.round(c[0] * 255));
        blink.style.setProperty("--blink-g", Math.round(c[1] * 255));
        blink.style.setProperty("--blink-b", Math.round(c[2] * 255));
        el.appendChild(blink);
      }
    }
    scene.appendChild(el);
    var dur = 2.5 + Math.random() * 2.5;
    if (isMobile) {
      var startY = dir === -1 ? h + size : -size;
      var endY = dir === -1 ? -size - 200 : h + 200;
      var band = w * 0.35;
      var x =
        Math.random() < 0.5
          ? 10 + Math.random() * Math.max(0, band - size - 20)
          : w * 0.65 + Math.random() * Math.max(0, band - size - 20);
      el.style.left = x + "px";
      el.style.transform = "translateY(" + startY + "px)" + baseTf;
      el.style.transition = "transform " + dur + "s linear";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.transform = "translateY(" + endY + "px)" + baseTf;
        });
      });
    } else {
      var startX = dir === -1 ? w + size : -size;
      var endX = dir === -1 ? -size - 200 : w + 200;
      var band = h * 0.35;
      var y =
        Math.random() < 0.5
          ? 10 + Math.random() * Math.max(0, band - size - 20)
          : h * 0.65 + Math.random() * Math.max(0, band - size - 20);
      el.style.top = y + "px";
      el.style.transform = "translateX(" + startX + "px)" + baseTf;
      el.style.transition = "transform " + dur + "s linear";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.transform = "translateX(" + endX + "px)" + baseTf;
        });
      });
    }
    setTimeout(
      function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      },
      (dur + 2) * 1000,
    );
    _spawnTimer = setTimeout(spawnShip, 5000 + Math.random() * 5000);
  }
  function start() {
    if (_visible) return;
    _visible = true;
    _h = scene.clientHeight;
    _loadAll();
    _spawnTimer = setTimeout(spawnShip, 500);
  }
  function stop() {
    _visible = false;
    if (_spawnTimer) clearTimeout(_spawnTimer);
    _spawnTimer = null;
    var els = scene.querySelectorAll(".traffic-ship");
    for (var i = 0; i < els.length; i++) els[i].parentNode.removeChild(els[i]);
  }
  var obs = new MutationObserver(function () {
    if (overlay.classList.contains("hidden")) stop();
    else start();
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  if (!overlay.classList.contains("hidden")) start();
})();
