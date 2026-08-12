// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

(function () {
  document.querySelectorAll(".combat-sky").forEach(function (canvas) {
    var gl = null;
    var progCloud = null,
      progCombat = null,
      progCombatMobile = null;
    var vao = null;
    var buf = null;
    var uCloud = {},
      uCombat = {},
      uCombatMobile = {};
    var _noiseTex = null,
      _fbTex = null,
      _fb = null;
    var _combatSeed = Math.random();
    canvas._visible = false;
    function initGL() {
      gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
      if (!gl) return false;
      progCloud = createProgram(gl, bgVS, cloudFS);
      progCombat = createProgram(gl, bgVS, combatFS);
      progCombatMobile = createProgram(gl, bgVS, combatFSMobile);
      if (!progCloud || !progCombat || !progCombatMobile) return false;
      function getUniforms(prog, dst) {
        dst.pos = gl.getAttribLocation(prog, "a_pos");
        dst.uTime = gl.getUniformLocation(prog, "u_time");
        dst.uNebulaTime = gl.getUniformLocation(prog, "u_nebulaTime");
        dst.uRes = gl.getUniformLocation(prog, "u_res");
        dst.uTex0 = gl.getUniformLocation(prog, "u_tex0");
        dst.uSeed = gl.getUniformLocation(prog, "u_seed");
      }
      getUniforms(progCloud, uCloud);
      getUniforms(progCombat, uCombat);
      getUniforms(progCombatMobile, uCombatMobile);
      var texSize = 256;
      var texData = new Uint8Array(texSize * texSize * 4);
      var oct = 5;
      var lats = [];
      for (var o = 0; o < oct; o++) {
        var n = (texSize >> o) + 1;
        var lat = new Float32Array(n * n);
        for (var i = 0; i < n * n; i++) lat[i] = Math.random();
        lats.push(lat);
      }
      function sampleNoise(x, y, o) {
        var s = texSize >> o;
        var n = s + 1;
        var lat = lats[o];
        var ix = Math.floor(x),
          iy = Math.floor(y);
        var dx = x - ix,
          dy = y - iy;
        var sx = dx * dx * (3 - 2 * dx);
        var sy = dy * dy * (3 - 2 * dy);
        ix = ((ix % n) + n) % n;
        iy = ((iy % n) + n) % n;
        return (
          (1 - sx) * (1 - sy) * lat[iy * n + ix] +
          sx * (1 - sy) * lat[iy * n + ix + 1] +
          (1 - sx) * sy * lat[((iy + 1) % n) * n + ix] +
          sx * sy * lat[((iy + 1) % n) * n + ix + 1]
        );
      }
      function fbm(x, y) {
        var v = 0,
          a = 0.5;
        for (var o = 0; o < oct; o++) {
          v += a * sampleNoise(x, y, o);
          x *= 2;
          y *= 2;
          a *= 0.5;
        }
        return v;
      }
      for (var y = 0; y < texSize; y++) {
        for (var x = 0; x < texSize; x++) {
          var v = Math.floor(fbm(x, y) * 255);
          texData[(y * texSize + x) * 4] = v;
          texData[(y * texSize + x) * 4 + 1] = v;
          texData[(y * texSize + x) * 4 + 2] = v;
          texData[(y * texSize + x) * 4 + 3] = 255;
        }
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
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      _fbTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, _fbTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      _fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        _fbTex,
        0,
      );
      var fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (fbStatus !== gl.FRAMEBUFFER_COMPLETE)
        console.error("FB incomplete:", fbStatus);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(uCloud.pos);
      gl.vertexAttribPointer(uCloud.pos, 2, gl.FLOAT, false, 0, 0);
      [uCombat, uCombatMobile].forEach(function (u) {
        if (u.pos >= 0 && u.pos !== uCloud.pos) {
          gl.enableVertexAttribArray(u.pos);
          gl.vertexAttribPointer(u.pos, 2, gl.FLOAT, false, 0, 0);
        }
      });
      gl.bindVertexArray(null);
      return true;
    }
    function resizeFB() {
      var w = canvas.width,
        h = canvas.height;
      if (w === 0 || h === 0) return;
      gl.bindTexture(gl.TEXTURE_2D, _fbTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        w,
        h,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
    function resize() {
      var cw = canvas.clientWidth,
        ch = canvas.clientHeight;
      var s = window._resolutionScale || 1.0;
      var pw = Math.round(cw * s),
        ph = Math.round(ch * s);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        if (canvas.width > 0 && canvas.height > 0) resizeFB();
      }
    }
    var _ut = 0,
      _nebulaUt = 0,
      _lastTime = 0,
      _speed = 1.0;
    function render(time) {
      if (!canvas._visible) return;
      resize();
      var w = canvas.width,
        h = canvas.height;
      if (w === 0 || h === 0) return;
      if (!window._warpPaused) {
        var dt = _lastTime ? ((time - _lastTime) / 1000) * 0.1 : 0;
        _ut += dt;
        _speed = Math.min(1, _speed + 0.03);
      } else if (_speed > 0.001) {
        _speed *= 0.97;
        var dt = _lastTime ? ((time - _lastTime) / 1000) * 0.1 * _speed : 0;
        _ut += dt;
      }
      var nebDt = _lastTime ? ((time - _lastTime) / 1000) * 0.1 : 0;
      _nebulaUt += nebDt;
      _lastTime = time;
      var ut = _ut;
      var nut = _nebulaUt;
      gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);
      gl.viewport(0, 0, w, h);
      gl.useProgram(progCloud);
      gl.uniform1f(uCloud.uTime, ut);
      gl.uniform2f(uCloud.uRes, w, h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, _noiseTex);
      gl.uniform1i(uCloud.uTex0, 0);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      var useMobile = window.innerWidth <= 600;
      var curProg = useMobile ? progCombatMobile : progCombat;
      var curU = useMobile ? uCombatMobile : uCombat;
      gl.useProgram(curProg);
      gl.uniform1f(curU.uTime, ut);
      if (curU.uNebulaTime !== null) gl.uniform1f(curU.uNebulaTime, nut);
      gl.uniform2f(curU.uRes, w, h);
      if (curU.uSeed !== null) gl.uniform1f(curU.uSeed, _combatSeed);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, _fbTex);
      gl.uniform1i(curU.uTex0, 0);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    }
    function start() {
      if (canvas._visible) return;
      canvas._visible = true;
      if (typeof window.pauseMap === "function") window.pauseMap();
      _ut = 0;
      _nebulaUt = 0;
      _lastTime = 0;
      if (!gl) initGL();
      resize();
      window._registerTravelRender(render);
    }
    function stop() {
      canvas._visible = false;
      if (typeof window.resumeMap === "function") window.resumeMap();
      window._unregisterTravelRender(render);
    }
    var overlay = canvas.parentElement;
    while (
      overlay &&
      overlay !== document.body &&
      !overlay.classList.contains("hidden")
    ) {
      overlay = overlay.parentElement;
    }
    if (overlay && overlay !== document.body) {
      var obs = new MutationObserver(function () {
        if (overlay.classList.contains("hidden")) {
          stop();
        } else {
          _combatSeed = Math.random();
          start();
        }
      });
      obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
      if (!overlay.classList.contains("hidden")) {
        start();
      }
    }
  });
})();
(function () {
  var overlay = document.getElementById("travel-overlay");
  var scene = document.getElementById("travel-scene");
  var shipEl = document.getElementById("travel-ship");
  var enemyEl = document.getElementById("travel-enemy");
  if (!overlay || !scene || !shipEl) return;
  var canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:6;";
  scene.appendChild(canvas);
  var gl = null,
    prog = null,
    u = {},
    vao = null,
    buf = null,
    _startT = 0,
    _curPos = [],
    _hitPos = [],
    _hitFlags = [],
    _shotSeed = 0;
  var _srcEl = null,
    _srcWeapons = null;
  var _shieldHit = false,
    _shieldHitColor = [0.3, 0.7, 1.0];
  var _explProg = null,
    _explU = {},
    _explEl = null,
    _explStart = 0;
  var _explCenterX = 0,
    _explCenterY = 0,
    _explSize = 0;
  var _missProg = null,
    _missU = {},
    _missBuf = null,
    _missTex = null,
    _missTexW = 160,
    _missTexH = 40,
    _misses = [];
  var _MISS_FONT = "bold 26px Orbitron, sans-serif";
  var CANNON = {
    wasp: [
      { x: 0.9179, y: 0.5025 },
      { x: 0.6343, y: 0.2537 },
      { x: 0.6368, y: 0.7562 },
    ],
    gnat: [{ x: 0.9353, y: 0.5274 }],
    firefly: [{ x: 0.908, y: 0.51 }],
    mosquito: [
      { x: 0.9204, y: 0.5075 },
      { x: 0.5398, y: 0.1244 },
      { x: 0.5373, y: 0.893 },
    ],
    bumblebee: [{ x: 0.8408, y: 0.5 }],
    hornet: [
      { x: 0.9925, y: 0.4876 },
      { x: 0.7139, y: 0.1716 },
      { x: 0.7139, y: 0.8035 },
    ],
    grasshopper: [
      { x: 0.9055, y: 0.505 },
      { x: 0.505, y: 0.1866 },
      { x: 0.505, y: 0.8333 },
    ],
    termite: [{ x: 0.8159, y: 0.5025 }],
    dragonfly: [
      { x: 0.9428, y: 0.5 },
      { x: 0.3159, y: 0.9428 },
      { x: 0.3109, y: 0.0597 },
    ],
    mantis: [
      { x: 0.8905, y: 0.5149 },
      { x: 0.5398, y: 0.1866 },
      { x: 0.5398, y: 0.8458 },
    ],
    police: [
      { x: 0.9502, y: 0.5149 },
      { x: 0.4726, y: 0.1667 },
      { x: 0.4801, y: 0.8557 },
    ],
    scarab: [
      { x: 0.9279, y: 0.5124 },
      { x: 0.5323, y: 0.2363 },
      { x: 0.5323, y: 0.7811 },
    ],
    scorp: [
      { x: 0.9104, y: 0.5025 },
      { x: 0.704, y: 0.0721 },
      { x: 0.699, y: 0.9279 },
      { x: 0.5299, y: 0.5025 },
    ],
  };
  function initGL() {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) return false;
    function getLaserUniforms(p, dst) {
      dst.uTime = gl.getUniformLocation(p, "u_time");
      dst.uRes = gl.getUniformLocation(p, "u_res");
      dst.uShipPos = gl.getUniformLocation(p, "u_shipPos");
      dst.uShipSize = gl.getUniformLocation(p, "u_shipSize");
      dst.uMobile = gl.getUniformLocation(p, "u_mobile");
      dst.uEnemyPos = gl.getUniformLocation(p, "u_enemyPos");
      dst.uLaser = [];
      dst.uHitPos = [];
      for (var i = 0; i < 8; i++)
        dst.uLaser[i] = gl.getUniformLocation(p, "u_laser[" + i + "]");
      for (var i = 0; i < 8; i++)
        dst.uHitPos[i] = gl.getUniformLocation(p, "u_hitPos[" + i + "]");
      dst.uCount = gl.getUniformLocation(p, "u_count");
      dst.uSeed = gl.getUniformLocation(p, "u_seed");
      dst.uLaserColor = [];
      for (var i = 0; i < 8; i++)
        dst.uLaserColor[i] = gl.getUniformLocation(
          p,
          "u_laserColor[" + i + "]",
        );
      dst.uShieldHit = gl.getUniformLocation(p, "u_shieldHit");
      dst.uShieldHitColor = gl.getUniformLocation(p, "u_shieldHitColor");
      dst.uSinT3 = gl.getUniformLocation(p, "u_sinT3");
      dst.uExpT3 = gl.getUniformLocation(p, "u_expT3");
      dst.uExpT18 = gl.getUniformLocation(p, "u_expT18");
      dst.uT2 = gl.getUniformLocation(p, "u_t2");
      dst.uFade = gl.getUniformLocation(p, "u_fade");
      dst.uSinT20 = gl.getUniformLocation(p, "u_sinT20");
      dst.uR06 = gl.getUniformLocation(p, "u_r06");
      dst.uHit = [];
      for (var i = 0; i < 8; i++)
        dst.uHit[i] = gl.getUniformLocation(p, "u_hit[" + i + "]");
    }
    prog = createProgram(gl, fullQuadVS, laserFS);
    getLaserUniforms(prog, u);
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
    _explProg = createProgram(gl, fullQuadVS, explFS);
    _explU.uTime = gl.getUniformLocation(_explProg, "u_time");
    _explU.uRes = gl.getUniformLocation(_explProg, "u_res");
    _explU.uCenter = gl.getUniformLocation(_explProg, "u_center");
    _explU.uSize = gl.getUniformLocation(_explProg, "u_size");
    _missProg = createProgram(gl, missVS, missFS);
    _missU.aPos = gl.getAttribLocation(_missProg, "a_pos");
    _missU.aUv = gl.getAttribLocation(_missProg, "a_uv");
    _missU.aAlpha = gl.getAttribLocation(_missProg, "a_alpha");
    _missU.uTex0 = gl.getUniformLocation(_missProg, "u_tex0");
    _missBuf = gl.createBuffer();
    function _makeMissTexture() {
      var mc = document.createElement("canvas");
      var mctx = mc.getContext("2d");
      if (!mctx) return;
      mc.width = _missTexW;
      mc.height = _missTexH;
      mctx.font = _MISS_FONT;
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      mctx.shadowColor = "rgba(255,255,0,0.8)";
      mctx.shadowBlur = 6;
      mctx.fillStyle = "#ff0";
      mctx.fillText("Miss!", _missTexW / 2, _missTexH / 2);
      if (_missTex) gl.deleteTexture(_missTex);
      _missTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, _missTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mc);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    _makeMissTexture();
    if (document.fonts && document.fonts.load) {
      try {
        document.fonts
          .load(_MISS_FONT)
          .then(function () {
            if (gl) _makeMissTexture();
          })
          .catch(function () {});
      } catch (e) {}
    }
    return true;
  }
  function _effectiveWeaponPower(dmg, weapons, defenderName) {
    var isScarab = (defenderName || "") === "Scarab";
    var totalPower = 0;
    for (var w = 0; w < weapons.length; w++) {
      var wn = weapons[w];
      if (
        isScarab &&
        wn.indexOf("Pulse") === -1 &&
        wn.indexOf("Morgan") === -1
      )
        continue;
      totalPower += dmg[wn] || 0;
    }
    return totalPower;
  }
  function _laserColor(weapons) {
    if (!weapons || weapons.length === 0) return [1.0, 0.85, 0.2];
    var r = 0,
      g = 0,
      b = 0;
    for (var i = 0; i < weapons.length; i++) {
      var w = weapons[i];
      if (w.indexOf("Pulse") !== -1) {
        r += 0.3;
        g += 0.7;
        b += 1.0;
      } else if (w.indexOf("Beam") !== -1) {
        r += 1.0;
        g += 0.9;
        b += 0.1;
      } else if (w.indexOf("Military") !== -1) {
        r += 0.8;
        g += 0.3;
        b += 1.0;
      } else if (w.indexOf("Morgan") !== -1) {
        r += 1.0;
        g += 0.4;
        b += 0.4;
      } else {
        r += 1.0;
        g += 0.85;
        b += 0.2;
      }
    }
    var n = weapons.length;
    return [r / n, g / n, b / n];
  }
  function render(t) {
    if (_misses.length)
      _misses = _misses.filter(function (m) {
        return (t - m.t) / 1000 < 0.8;
      });
    if (!_startT && !_explStart && !_misses.length) return;
    var le = _startT ? (t - _startT) / 1000 : -1;
    if (le > 1.0) _startT = 0;
    var ee = _explStart ? (t - _explStart) / 1000 : -1;
    if (ee > 2.0) {
      _explStart = 0;
      _explEl = null;
    }
    if (!_startT && !_explStart && !_misses.length) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
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
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    if (_startT) {
      gl.useProgram(prog);
      gl.uniform1f(u.uTime, le);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uSinT3, Math.sin(le * 3.0));
      gl.uniform1f(u.uExpT3, Math.exp(-le * 3.0));
      gl.uniform1f(u.uExpT18, Math.exp(-le * 1.8));
      gl.uniform1f(u.uT2, le * le);
      gl.uniform1f(u.uFade, 1.0 - le);
      gl.uniform4f(
        u.uSinT20,
        Math.sin(le * 20.0),
        Math.sin(le * 20.0 + 1.0),
        Math.sin(le * 20.0 + 2.0),
        Math.sin(le * 20.0 + 3.0),
      );
      gl.uniform1f(u.uR06, le * 0.6);
      var useEl = _srcEl || shipEl;
      var sr = window._getRect(useEl);
      var cr = window._getRect(canvas);
      var shipPx = Math.sqrt(sr.width * sr.width + sr.height * sr.height) * 0.4;
      gl.uniform1f(u.uShipSize, shipPx * _s);
      gl.uniform1f(u.uMobile, window.innerWidth <= 600 ? 1.0 : 0.0);
      gl.uniform2f(
        u.uShipPos,
        (sr.left + sr.width * 0.5 - cr.left) / cw,
        1.0 - (sr.top + sr.height * 0.5 - cr.top) / ch,
      );
      var enemyPx = 0,
        enemyPy = 0.5;
      if (enemyEl) {
        var er = window._getRect(enemyEl);
        if (er.width > 0 && er.height > 0) {
          enemyPx = (er.left + er.width * 0.5 - cr.left) / cw;
          enemyPy = 1.0 - (er.top + er.height * 0.5 - cr.top) / ch;
        }
      }
      gl.uniform2f(u.uEnemyPos, enemyPx, enemyPy);
      gl.uniform1f(u.uSeed, _shotSeed);
      var weapons =
        _srcWeapons ||
        (typeof playerShip !== "undefined" ? playerShip.weapons : []);
      var ct = Math.min(_curPos.length, 8);
      gl.uniform1i(u.uCount, ct);
      for (var j = 0; j < ct; j++) {
        var lx = ((_curPos[j].x - 0.5) * sr.width) / shipPx;
        var ly = ((0.5 - _curPos[j].y) * sr.height) / shipPx;
        if (window.innerWidth <= 600) ly = -ly;
        gl.uniform2f(u.uLaser[j], lx, ly);
        if (j < _hitPos.length)
          gl.uniform2f(u.uHitPos[j], _hitPos[j].x, _hitPos[j].y);
        gl.uniform1f(u.uHit[j], j < _hitFlags.length ? _hitFlags[j] : 0.0);
        var wc = _laserColor(weapons[j] ? [weapons[j]] : []);
        gl.uniform3f(u.uLaserColor[j], wc[0], wc[1], wc[2]);
      }
      gl.uniform1f(u.uShieldHit, _shieldHit ? 1.0 : 0.0);
      gl.uniform3f(
        u.uShieldHitColor,
        _shieldHitColor[0],
        _shieldHitColor[1],
        _shieldHitColor[2],
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    }
    if (_explStart && _explEl) {
      gl.useProgram(_explProg);
      gl.uniform1f(_explU.uTime, ee);
      gl.uniform2f(_explU.uRes, w, h);
      gl.uniform2f(_explU.uCenter, _explCenterX * w, _explCenterY * h);
      gl.uniform1f(_explU.uSize, _explSize * _s);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    }
    if (_misses.length) {
      gl.useProgram(_missProg);
      gl.uniform1i(_missU.uTex0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, _missTex);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      var quadH = 20 * _s;
      var quadW = 80 * _s;
      gl.bindBuffer(gl.ARRAY_BUFFER, _missBuf);
      gl.enableVertexAttribArray(_missU.aPos);
      gl.vertexAttribPointer(_missU.aPos, 2, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(_missU.aUv);
      gl.vertexAttribPointer(_missU.aUv, 2, gl.FLOAT, false, 20, 8);
      gl.enableVertexAttribArray(_missU.aAlpha);
      gl.vertexAttribPointer(_missU.aAlpha, 1, gl.FLOAT, false, 20, 16);
      for (var mi = 0; mi < _misses.length; mi++) {
        var m = _misses[mi];
        var age = (t - m.t) / 1000;
        var alpha = Math.min(1, age / 0.05);
        if (age > 0.5) alpha = Math.max(0, 1 - (age - 0.5) / 0.3);
        if (alpha <= 0) continue;
        var mc2 = m.x * w,
          mcy = (1 - m.y) * h;
        var cc = Math.cos(m.ang),
          ss = Math.sin(m.ang);
        var hw2 = quadW / 2,
          hh2 = quadH / 2;
        var corners = [
          [-hw2, hh2],
          [hw2, hh2],
          [-hw2, -hh2],
          [hw2, -hh2],
        ];
        var uvs = [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ];
        var verts = [];
        for (var mk = 0; mk < 4; mk++) {
          var rx = corners[mk][0] * cc - corners[mk][1] * ss;
          var ry = corners[mk][0] * ss + corners[mk][1] * cc;
          var px = mc2 + rx,
            py = mcy + ry;
          verts.push(
            (px / w) * 2 - 1,
            (1 - py / h) * 2 - 1,
            uvs[mk][0],
            uvs[mk][1],
            alpha,
          );
        }
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(verts),
          gl.DYNAMIC_DRAW,
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.bindVertexArray(null);
    }
    gl.disable(gl.BLEND);
  }
  function _hitCheck(fighter, pilot, shipSize, isFleeing) {
    var attackRoll = Math.floor(Math.random() * (fighter + shipSize));
    var dodgeRoll =
      (isFleeing ? 2 : 1) *
      Math.floor(Math.random() * (5 + Math.floor(pilot / 2)));
    return attackRoll >= dodgeRoll;
  }
  function _showMissLabel(hx, hy) {
    if (!gl || !_missTex) {
      var missEl = document.createElement("span");
      missEl.textContent = "Miss!";
      var ang = Math.random() * 60 - 30;
      missEl.style.cssText =
        "position:absolute;left:" +
        hx * 100 +
        "%;top:" +
        (1 - hy) * 100 +
        "%;color:#ff0;font-size:12px;font-weight:bold;pointer-events:none;z-index:30;transform:rotate(" +
        ang +
        "deg);text-shadow:0 0 4px rgba(255,255,0,0.8);opacity:0;transition:opacity 0.15s ease;";
      scene.appendChild(missEl);
      requestAnimationFrame(function () {
        missEl.style.opacity = "1";
      });
      setTimeout(function () {
        missEl.style.opacity = "0";
        setTimeout(function () {
          missEl.remove();
        }, 300);
      }, 500);
      return;
    }
    _misses.push({
      x: hx,
      y: hy,
      ang: ((Math.random() * 60 - 30) * Math.PI) / 180,
      t: performance.now(),
    });
    if (_misses.length > 16) _misses.splice(0, _misses.length - 16);
  }
  function _hitShieldColor(shields) {
    if (!shields || shields.length === 0) return [0.3, 0.7, 1.0];
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
  function _shieldHitPos(er, cr) {
    var cx = (er.left + er.width * 0.5 - cr.left) / canvas.clientWidth;
    var cy = 1.0 - (er.top + er.height * 0.5 - cr.top) / canvas.clientHeight;
    var radius = Math.sqrt(er.width * er.width + er.height * er.height) * 0.4;
    var angle = Math.random() * Math.PI * 2;
    var r = radius * (0.7 + Math.random() * 0.3);
    return {
      x: cx + (Math.cos(angle) * r) / canvas.clientWidth,
      y: cy + (Math.sin(angle) * r) / canvas.clientHeight,
    };
  }
  function _triggerExplosion(shipEl) {
    SFX.play("boom");
    if (!shipEl) return;
    var er = shipEl.getBoundingClientRect();
    var cr = canvas.getBoundingClientRect();
    _explCenterX =
      (er.left + er.width * 0.5 - cr.left) / (canvas.clientWidth || 1);
    _explCenterY =
      1.0 - (er.top + er.height * 0.5 - cr.top) / (canvas.clientHeight || 1);
    _explSize = Math.max(er.width, er.height) * 1.6;
    shipEl.style.transition = "opacity 0.6s ease";
    shipEl.style.opacity = "0";
    _explEl = shipEl;
    _explStart = performance.now();
    if (!gl) initGL();
  }
  window._triggerExplosion = _triggerExplosion;
  window._triggerLaser = function (ship) {
    SFX.play("pew");
    _srcEl = null;
    _srcWeapons = null;
    _curPos = CANNON[ship] || [];
    if (_curPos.length === 0) return;
    var n = typeof playerShip !== "undefined" ? playerShip.weapons.length : 0;
    if (n === 0) return;
    if (_curPos.length > 2) {
      if (n === 1) _curPos = [_curPos[0]];
      else if (n === 2) _curPos = [_curPos[1], _curPos[2]];
      else _curPos = _curPos.slice(0, n);
    } else {
      _curPos = _curPos.slice(0, Math.min(n, _curPos.length));
    }
    if (!gl && !initGL()) return;
    _shotSeed = Math.random() * 1000;
    _hitPos = [];
    _hitFlags = [];
    _shieldHit = false;
    if (enemyEl) {
      var er = window._getRect(enemyEl);
      if (er.width > 0 && er.height > 0) {
        var cr = window._getRect(canvas);
        var hasShield =
          typeof window._enemyShields !== "undefined" &&
          window._enemyShields.length > 0;
        if (hasShield) _shieldHitColor = _hitShieldColor(window._enemyShields);
        var st = window._lastStrike;
        var _hit, shieldActive;
        if (st) {
          _hit = st.hit;
          shieldActive = st.shieldActive;
        } else {
          var dmg = window.WEAPON_DMG || {};
          var weapons =
            _srcWeapons ||
            (typeof playerShip !== "undefined" ? playerShip.weapons : []);
          var _playerFighter =
            typeof fighterSkillTotal === "function" ? fighterSkillTotal() : 5;
          var _enemyPilot = window._enemyPilot || 1;
          var _enemySize =
            typeof window._shipSize === "function"
              ? window._shipSize(window._enemyShipName)
              : 2;
          var _playerEng =
            typeof engineerSkillTotal === "function" ? engineerSkillTotal() : 5;
          var _attackScale = (100 + 2 * _playerFighter) / 100;
          var totalPower = _effectiveWeaponPower(
            dmg,
            weapons,
            window._enemyShipName,
          );
          var droll = Math.floor(Math.random() * totalPower * _attackScale);
          shieldActive = hasShield && (window._enemyShieldHp || 0) > 0;
          _hit =
            droll > 0 &&
            _hitCheck(_playerFighter, _enemyPilot, _enemySize, false);
        }
        _shieldHit = _hit && shieldActive;
        var _pcx =
          (window._getRect(shipEl).left +
            window._getRect(shipEl).width * 0.5 -
            cr.left) /
          canvas.clientWidth;
        var _pcy =
          1.0 -
          (window._getRect(shipEl).top +
            window._getRect(shipEl).height * 0.5 -
            cr.top) /
            canvas.clientHeight;
        var _ecx = (er.left + er.width * 0.5 - cr.left) / canvas.clientWidth;
        var _ecy =
          1.0 - (er.top + er.height * 0.5 - cr.top) / canvas.clientHeight;
        var _dx = _ecx - _pcx;
        var _dy = _ecy - _pcy;
        for (var k = 0; k < _curPos.length; k++) {
          if (_hit) {
            if (shieldActive) {
              _hitPos.push(_shieldHitPos(er, cr));
            } else {
              _hitPos.push({
                x:
                  (er.left + er.width * (0.3 + Math.random() * 0.4) - cr.left) /
                  canvas.clientWidth,
                y:
                  1.0 -
                  (er.top + er.height * (0.3 + Math.random() * 0.4) - cr.top) /
                    canvas.clientHeight,
              });
            }
          } else {
            _hitPos.push({ x: _ecx + _dx * 100, y: _ecy + _dy * 100 });
          }
          _hitFlags.push(_hit ? 1.0 : 0.0);
        }
        if (!_hit) {
          _showMissLabel(
            (er.left + er.width * (0.3 + Math.random() * 0.4) - cr.left) /
              canvas.clientWidth,
            1.0 -
              (er.top + er.height * (0.3 + Math.random() * 0.4) - cr.top) /
                canvas.clientHeight,
          );
        }
        if (typeof window._updateStatusBars === "function")
          window._updateStatusBars();
      }
    }
    _startT = performance.now();
  };
  window._triggerEnemyLaser = function (ship) {
    SFX.play("pew");
    _srcEl = enemyEl;
    _srcWeapons = window._enemyWeapons || [];
    _curPos = (CANNON[ship] || []).map(function (p) {
      return { x: 1 - p.x, y: p.y };
    });
    if (_curPos.length === 0) return;
    var n =
      typeof window._enemyWeapons !== "undefined"
        ? window._enemyWeapons.length
        : 0;
    if (n === 0) return;
    if (_curPos.length > 2) {
      if (n === 1) _curPos = [_curPos[0]];
      else if (n === 2) _curPos = [_curPos[1], _curPos[2]];
      else _curPos = _curPos.slice(0, n);
    } else {
      _curPos = _curPos.slice(0, Math.min(n, _curPos.length));
    }
    if (!gl && !initGL()) return;
    _shotSeed = Math.random() * 1000;
    _hitPos = [];
    _hitFlags = [];
    _shieldHit = false;
    if (shipEl) {
      var sr = window._getRect(shipEl);
      if (sr.width > 0 && sr.height > 0) {
        var cr = window._getRect(canvas);
        var hasShield =
          typeof playerShip !== "undefined" && playerShip.shields.length > 0;
        if (hasShield) _shieldHitColor = _hitShieldColor(playerShip.shields);
        var st = window._lastEnemyStrike;
        var _hit, shieldActive;
        if (st) {
          _hit = st.hit;
          shieldActive = st.shieldActive;
        } else {
          var dmg = window.WEAPON_DMG || {};
          var _enemyFighter = window._enemyFighter || 1;
          var _playerPilot =
            typeof pilotSkillTotal === "function" ? pilotSkillTotal() : 5;
          var _playerSize =
            typeof window._shipSize === "function"
              ? window._shipSize(
                  typeof playerShip !== "undefined" ? playerShip.name : "Flea",
                )
              : 2;
          var _isFleeing = !!window._isEscaping;
          var _eEng = window._enemyEngineer || 1;
          var _eAttackScale = (100 + 2 * _enemyFighter) / 100;
          var enemyWeapons = window._enemyWeapons || [];
          var totalPower = _effectiveWeaponPower(
            dmg,
            enemyWeapons,
            typeof playerShip !== "undefined" ? playerShip.name : "Flea",
          );
          var droll = Math.floor(Math.random() * totalPower * _eAttackScale);
          shieldActive = hasShield && (window._playerShieldHp || 0) > 0;
          _hit =
            droll > 0 &&
            _hitCheck(_enemyFighter, _playerPilot, _playerSize, _isFleeing);
        }
        _shieldHit = _hit && shieldActive;
        var _ecx =
          (window._getRect(enemyEl).left +
            window._getRect(enemyEl).width * 0.5 -
            cr.left) /
          canvas.clientWidth;
        var _ecy =
          1.0 -
          (window._getRect(enemyEl).top +
            window._getRect(enemyEl).height * 0.5 -
            cr.top) /
            canvas.clientHeight;
        var _pcx = (sr.left + sr.width * 0.5 - cr.left) / canvas.clientWidth;
        var _pcy =
          1.0 - (sr.top + sr.height * 0.5 - cr.top) / canvas.clientHeight;
        var _dx = _pcx - _ecx;
        var _dy = _pcy - _ecy;
        for (var k = 0; k < _curPos.length; k++) {
          if (_hit) {
            if (shieldActive) {
              _hitPos.push(_shieldHitPos(sr, cr));
            } else {
              _hitPos.push({
                x:
                  (sr.left + sr.width * (0.3 + Math.random() * 0.4) - cr.left) /
                  canvas.clientWidth,
                y:
                  1.0 -
                  (sr.top + sr.height * (0.3 + Math.random() * 0.4) - cr.top) /
                    canvas.clientHeight,
              });
            }
          } else {
            _hitPos.push({ x: _pcx + _dx * 100, y: _pcy + _dy * 100 });
          }
          _hitFlags.push(_hit ? 1.0 : 0.0);
        }
        if (!_hit) {
          _showMissLabel(
            (sr.left + sr.width * (0.3 + Math.random() * 0.4) - cr.left) /
              canvas.clientWidth,
            1.0 -
              (sr.top + sr.height * (0.3 + Math.random() * 0.4) - cr.top) /
                canvas.clientHeight,
          );
        }
        if (typeof window._updateStatusBars === "function")
          window._updateStatusBars();
        if (
          typeof playerShip !== "undefined" &&
          playerShip.hull <= 0 &&
          !window._deathHandled
        ) {
          window._deathHandled = true;
          _triggerExplosion(shipEl);
          if (typeof die === "function") {
            setTimeout(die, 1200);
          }
        }
      }
    }
    _startT = performance.now();
  };
  window._playerStrike = function () {
    if (!enemyEl || (window._enemyHull || 0) <= 0) return;
    var er = window._getRect(enemyEl);
    if (!(er.width > 0 && er.height > 0)) return;
    var dmg = window.WEAPON_DMG || {};
    var weapons =
      typeof playerShip !== "undefined" ? playerShip.weapons : [];
    if (!weapons || weapons.length === 0) return;
    var _playerFighter =
      typeof fighterSkillTotal === "function" ? fighterSkillTotal() : 5;
    var _enemyPilot = window._enemyPilot || 1;
    var _enemySize =
      typeof window._shipSize === "function"
        ? window._shipSize(window._enemyShipName)
        : 2;
    var _playerEng =
      typeof engineerSkillTotal === "function" ? engineerSkillTotal() : 5;
    var _attackScale = (100 + 2 * _playerFighter) / 100;
    var totalPower = _effectiveWeaponPower(dmg, weapons, window._enemyShipName);
    var d = Math.floor(Math.random() * totalPower * _attackScale);
    var hasShield =
      typeof window._enemyShields !== "undefined" &&
      window._enemyShields.length > 0;
    var shieldActive = hasShield && (window._enemyShieldHp || 0) > 0;
    var _hit = d > 0 && _hitCheck(_playerFighter, _enemyPilot, _enemySize, false);
    window._lastStrike = { hit: _hit, shieldActive: shieldActive };
    if (_hit) {
      if (shieldActive) {
        _shieldHit = true;
        if (d > (window._enemyShieldHp || 0)) {
          var overDamage = d - (window._enemyShieldHp || 0);
          window._enemyShieldHp = 0;
          var eEng = window._enemyEngineer || 1;
          overDamage -= Math.floor(Math.random() * eEng);
          overDamage = Math.max(1, overDamage);
          overDamage = Math.min(
            overDamage,
            Math.floor((window._enemyMaxHull || 100) / 2),
          );
          window._enemyHull = Math.max(0, (window._enemyHull || 0) - overDamage);
        } else {
          window._enemyShieldHp = Math.max(
            0,
            (window._enemyShieldHp || 0) - d,
          );
        }
      } else {
        var eEng2 = window._enemyEngineer || 1;
        d -= Math.floor(Math.random() * eEng2);
        d = Math.max(1, d);
        d = Math.min(d, Math.floor((window._enemyMaxHull || 100) / 2));
        window._enemyHull = Math.max(0, (window._enemyHull || 0) - d);
      }
    }
    if (typeof window._updateStatusBars === "function")
      window._updateStatusBars();
  };
  window._enemyStrike = function () {
    if (!shipEl) return;
    var sr = window._getRect(shipEl);
    if (!(sr.width > 0 && sr.height > 0)) return;
    var enemyWeapons = window._enemyWeapons || [];
    if (enemyWeapons.length === 0) return;
    var dmg = window.WEAPON_DMG || {};
    var _enemyFighter = window._enemyFighter || 1;
    var _playerPilot =
      typeof pilotSkillTotal === "function" ? pilotSkillTotal() : 5;
    var _playerSize =
      typeof window._shipSize === "function"
        ? window._shipSize(
            typeof playerShip !== "undefined" ? playerShip.name : "Flea",
          )
        : 2;
    var _eEng = window._enemyEngineer || 1;
    var _eAttackScale = (100 + 2 * _enemyFighter) / 100;
    var totalPower = _effectiveWeaponPower(
      dmg,
      enemyWeapons,
      typeof playerShip !== "undefined" ? playerShip.name : "Flea",
    );
    var d = Math.floor(Math.random() * totalPower * _eAttackScale);
    var hasShield =
      typeof playerShip !== "undefined" && playerShip.shields.length > 0;
    var shieldActive = hasShield && (window._playerShieldHp || 0) > 0;
    var _hit =
      d > 0 &&
      _hitCheck(_enemyFighter, _playerPilot, _playerSize, !!window._isEscaping);
    window._lastEnemyStrike = { hit: _hit, shieldActive: shieldActive };
    if (_hit) {
      if (shieldActive) {
        _shieldHit = true;
        if (d > (window._playerShieldHp || 0)) {
          var overDamage = d - (window._playerShieldHp || 0);
          window._playerShieldHp = 0;
          var pEng =
            typeof engineerSkillTotal === "function"
              ? engineerSkillTotal()
              : 5;
          overDamage -= Math.floor(Math.random() * pEng);
          overDamage = Math.max(1, overDamage);
          var maxH = typeof maxHull === "function" ? maxHull() : 100;
          overDamage = Math.min(overDamage, Math.floor(maxH / 3));
          if (typeof playerShip !== "undefined") {
            playerShip.hull = Math.max(
              0,
              (playerShip.hull != null ? playerShip.hull : maxH) - overDamage,
            );
            if (typeof savePlayerShip === "function") savePlayerShip();
          }
        } else {
          window._playerShieldHp = Math.max(
            0,
            (window._playerShieldHp || 0) - d,
          );
        }
      } else {
        var pEng2 =
          typeof engineerSkillTotal === "function"
            ? engineerSkillTotal()
            : 5;
        d -= Math.floor(Math.random() * pEng2);
        d = Math.max(1, d);
        var maxH2 = typeof maxHull === "function" ? maxHull() : 100;
        d = Math.min(d, Math.floor(maxH2 / 3));
        if (typeof playerShip !== "undefined") {
          playerShip.hull = Math.max(
            0,
            (playerShip.hull != null ? playerShip.hull : maxH2) - d,
          );
          if (typeof savePlayerShip === "function") savePlayerShip();
        }
      }
    }
    if (typeof window._updateStatusBars === "function")
      window._updateStatusBars();
    if (
      typeof playerShip !== "undefined" &&
      playerShip.hull <= 0 &&
      !window._deathHandled
    ) {
      window._deathHandled = true;
      _triggerExplosion(shipEl);
      if (typeof die === "function") {
        setTimeout(die, 1200);
      }
    }
  };
  var _combatVisible = false;
  function _combatStart() {
    if (_combatVisible) return;
    _combatVisible = true;
    if (!gl) initGL();
    window._registerTravelRender(render);
  }
  function _combatStop() {
    if (!_combatVisible) return;
    _combatVisible = false;
    _startT = 0;
    _explStart = 0;
    _explEl = null;
    _explCenterX = 0;
    _explCenterY = 0;
    _explSize = 0;
    _misses.length = 0;
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    window._unregisterTravelRender(render);
  }
  var obs = new MutationObserver(function () {
    if (overlay.classList.contains("hidden")) {
      _combatStop();
    } else {
      _combatStart();
    }
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  if (!overlay.classList.contains("hidden")) _combatStart();
})();
