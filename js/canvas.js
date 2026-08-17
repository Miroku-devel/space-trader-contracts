// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function _glNoop() {
  var noop = function () {};
  return new Proxy(
    {},
    {
      get: function (t, key) {
        if (key === "getParameter") return function () { return [1, 1]; };
        if (key === "getShaderParameter") return function () { return true; };
        if (key === "getProgramParameter") return function () { return true; };
        if (key === "getShaderInfoLog") return function () { return ""; };
        if (key === "getProgramInfoLog") return function () { return ""; };
        if (key === "getAttribLocation") return function () { return -1; };
        if (key === "getUniformLocation") return function () { return null; };
        if (key === "createShader") return function () { return {}; };
        if (key === "createProgram") return function () { return {}; };
        if (key === "createBuffer") return function () { return {}; };
        if (key === "createVertexArray") return function () { return {}; };
        if (key === "createTexture") return function () { return {}; };
        return noop;
      },
    },
  );
}
var _glReal = canvas.getContext("webgl2", { alpha: false, antialias: true });
if (!_glReal) {
  var _glWrap = document.createElement("div");
  _glWrap.className = "gl-error-wrap";
  _glWrap.style.cssText = "position:fixed;inset:0;z-index:99999;";
  _glWrap.innerHTML = `
        <div class="gl-error-box">
            <h2 class="gl-error-title">WebGL 2 required</h2>
            <p class="gl-error-hint">Try a modern browser like Firefox, Chrome or Safari.</p>
        </div>`;
  document.body.appendChild(_glWrap);
  window._glUnsupported = true;
}
const gl = _glReal || _glNoop();
const bgProg = createProgram(gl, bgVS, bgFS);
const ptProg = createProgram(gl, ptVS, ptFS);
const selProg = createProgram(gl, selVS, selFS);
const constProg = createProgram(gl, constVS, constFS);
const maxPointSize = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
const bgU = {
  pos: gl.getAttribLocation(bgProg, "a_pos"),
  uTime: gl.getUniformLocation(bgProg, "u_time"),
  uRes: gl.getUniformLocation(bgProg, "u_res"),
  uFreqs: gl.getUniformLocation(bgProg, "u_freqs"),
  uCam: gl.getUniformLocation(bgProg, "u_cam"),
  uZoom: gl.getUniformLocation(bgProg, "u_zoom"),
  uSeed: gl.getUniformLocation(bgProg, "u_seed"),
};
const ptU = {
  pos: gl.getAttribLocation(ptProg, "a_pos"),
  size: gl.getAttribLocation(ptProg, "a_size"),
  col: gl.getAttribLocation(ptProg, "a_color"),
  bright: gl.getAttribLocation(ptProg, "a_bright"),
  phase: gl.getAttribLocation(ptProg, "a_phase"),
  speed: gl.getAttribLocation(ptProg, "a_speed"),
  uCam: gl.getUniformLocation(ptProg, "u_cam"),
  uZoom: gl.getUniformLocation(ptProg, "u_zoom"),
  uRes: gl.getUniformLocation(ptProg, "u_res"),
  uTime: gl.getUniformLocation(ptProg, "u_time"),
  uMaxPS: gl.getUniformLocation(ptProg, "u_maxPS"),
};
const selU = {
  pos: gl.getAttribLocation(selProg, "a_pos"),
  col: gl.getAttribLocation(selProg, "a_color"),
  uCam: gl.getUniformLocation(selProg, "u_cam"),
  uZoom: gl.getUniformLocation(selProg, "u_zoom"),
  uRes: gl.getUniformLocation(selProg, "u_res"),
  uTime: gl.getUniformLocation(selProg, "u_time"),
};
const constU = {
  pos: gl.getAttribLocation(constProg, "a_pos"),
  uCam: gl.getUniformLocation(constProg, "u_cam"),
  uZoom: gl.getUniformLocation(constProg, "u_zoom"),
  uRes: gl.getUniformLocation(constProg, "u_res"),
  uCol: gl.getUniformLocation(constProg, "u_color"),
  uAlpha: gl.getUniformLocation(constProg, "u_alpha"),
};
const quadVAO = gl.createVertexArray();
gl.bindVertexArray(quadVAO);
const quadBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
  gl.STATIC_DRAW,
);
gl.enableVertexAttribArray(bgU.pos);
gl.vertexAttribPointer(bgU.pos, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);
const STRIDE = 9;
const ptVAO = gl.createVertexArray();
gl.bindVertexArray(ptVAO);
const ptBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
const S = STRIDE * 4;
gl.enableVertexAttribArray(ptU.pos);
gl.vertexAttribPointer(ptU.pos, 2, gl.FLOAT, false, S, 0);
gl.enableVertexAttribArray(ptU.size);
gl.vertexAttribPointer(ptU.size, 1, gl.FLOAT, false, S, 8);
gl.enableVertexAttribArray(ptU.col);
gl.vertexAttribPointer(ptU.col, 3, gl.FLOAT, false, S, 12);
gl.enableVertexAttribArray(ptU.bright);
gl.vertexAttribPointer(ptU.bright, 1, gl.FLOAT, false, S, 24);
gl.enableVertexAttribArray(ptU.phase);
gl.vertexAttribPointer(ptU.phase, 1, gl.FLOAT, false, S, 28);
gl.enableVertexAttribArray(ptU.speed);
gl.vertexAttribPointer(ptU.speed, 1, gl.FLOAT, false, S, 32);
gl.bindVertexArray(null);
const selVAO = gl.createVertexArray();
const selBuf = gl.createBuffer();
const constVAO = gl.createVertexArray();
gl.bindVertexArray(constVAO);
const constBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, constBuf);
gl.enableVertexAttribArray(constU.pos);
gl.vertexAttribPointer(constU.pos, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);
function resize() {
  var s = isFinite(window._resolutionScale) ? window._resolutionScale : 1.0;
  canvas.width = Math.round(window.innerWidth * s);
  canvas.height = Math.round(window.innerHeight * s);
  gl.viewport(0, 0, canvas.width, canvas.height);
  labelCanvas.width = canvas.width;
  labelCanvas.height = canvas.height;
}
const textWidthCache = new Map();
const labelFont = "11px Orbitron, sans-serif";
function measureTextWidth(text) {
  let w = textWidthCache.get(text);
  if (w === undefined) {
    labelCtx.font = labelFont;
    w = labelCtx.measureText(text).width;
    textWidthCache.set(text, w);
  }
  return w;
}
function wormholeToll() {
  if (typeof fuelCostPerUnit === "function") return fuelCostPerUnit() * 25;
  return 250;
}
function renderLabels() {
  const w = canvas.width;
  const h = canvas.height;
  labelCtx.clearRect(0, 0, w, h);
  const alpha = Math.min(1, Math.max(0, (camera.zoom - 4.0) / 5.0));
  if (alpha === 0) return;
  const bgStyle = `rgba(0,0,0,${(0.55 * alpha).toFixed(3)})`;
  const fgStyle = `rgba(255,255,255,${(0.85 * alpha).toFixed(3)})`;
  const tollStyle = `rgba(255,220,80,${(0.85 * alpha).toFixed(3)})`;
  const zoomHalf = camera.zoom * 0.5;
  const tollFont = "10px Orbitron, sans-serif";
  labelCtx.font = labelFont;
  labelCtx.textAlign = "center";
  labelCtx.textBaseline = "top";
  let drawn = 0;
  for (const idx of sortedStarIndices) {
    if (drawn >= 100) break;
    const star = stars[idx];
    const sp = worldToScreen(star.x, star.y);
    if (sp.x < -50 || sp.x > w + 50 || sp.y < -50 || sp.y > h + 50) continue;
    const isWormhole = star.bridge;
    const nameText = star.name;
    const toll = wormholeToll();
    const canPay =
      typeof playerCredits === "undefined" || playerCredits >= toll;
    const tollText = isWormhole
      ? canPay
        ? "Toll to " +
          (star.bridgeExit ? star.bridgeExit.name : "?") +
          ": " +
          toll +
          " cr"
        : "Insufficient Credits for Toll"
      : null;
    labelCtx.font = labelFont;
    const tw1 = measureTextWidth(nameText) + 10;
    labelCtx.font = tollFont;
    const tw2 = tollText ? measureTextWidth(tollText) + 10 : 0;
    const tw = Math.max(tw1, tw2);
    const ly = sp.y + star.size * zoomHalf + 3;
    const bh = tollText ? 28 : 16;
    const bx = sp.x - tw / 2;
    labelCtx.fillStyle = bgStyle;
    labelCtx.beginPath();
    labelCtx.roundRect(bx, ly - 2, tw, bh, 3);
    labelCtx.fill();
    labelCtx.font = labelFont;
    labelCtx.fillStyle = fgStyle;
    labelCtx.fillText(nameText, sp.x, ly);
    if (tollText) {
      labelCtx.font = tollFont;
      labelCtx.fillStyle = canPay ? tollStyle : "#ff6666";
      labelCtx.fillText(tollText, sp.x, ly + 13);
    }
    drawn++;
  }
}
function render(time) {
  const t = time / 1000;
  const w = canvas.width;
  const h = canvas.height;
  if (cameraTarget && !isDragging) {
    const dt = Math.min(0.05, (time - (window._lastFrameTime || time)) / 1000);
    window._lastFrameTime = time;
    const t = 1 - Math.exp(-25 * dt);
    camera.x += (cameraTarget.x - camera.x) * t;
    camera.y += (cameraTarget.y - camera.y) * t;
    camera.zoom += (cameraTarget.zoom - camera.zoom) * t;
    if (
      Math.abs(cameraTarget.x - camera.x) < 0.1 &&
      Math.abs(cameraTarget.y - camera.y) < 0.1 &&
      Math.abs(cameraTarget.zoom - camera.zoom) < 0.001
    ) {
      camera.x = cameraTarget.x;
      camera.y = cameraTarget.y;
      camera.zoom = cameraTarget.zoom;
      cameraTarget = null;
    }
  }
  const camChanged =
    camera.x !== prevCamX ||
    camera.y !== prevCamY ||
    camera.zoom !== prevCamZoom;
  if (camChanged) {
    prevCamX = camera.x;
    prevCamY = camera.y;
    prevCamZoom = camera.zoom;
  }
  if (ptDataNeedsUpdate) fillPointBuffer();
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  gl.useProgram(bgProg);
  gl.uniform1f(bgU.uTime, t * 0.1);
  gl.uniform2f(bgU.uRes, w, h);
  gl.uniform2f(bgU.uCam, camera.x, camera.y);
  gl.uniform1f(bgU.uZoom, camera.zoom);
  gl.uniform1f(bgU.uSeed, window._nebulaSeed);
  gl.uniform4f(
    bgU.uFreqs,
    0.5 + 0.1 * Math.sin(t * 0.03),
    0.5 + 0.1 * Math.sin(t * 0.05 + 1.0),
    0.5 + 0.1 * Math.sin(t * 0.07 + 2.0),
    0.5 + 0.1 * Math.sin(t * 0.09 + 3.0),
  );
  gl.bindVertexArray(quadVAO);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
  if (constPath.length > 0) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(constProg);
    gl.uniform2f(constU.uCam, camera.x, camera.y);
    gl.uniform1f(constU.uZoom, camera.zoom);
    gl.uniform2f(constU.uRes, w, h);
    gl.uniform3f(constU.uCol, 1, 0.84, 0);
    gl.uniform1f(constU.uAlpha, 0.3);
    gl.bindVertexArray(constVAO);
    gl.drawArrays(gl.LINES, 0, constPath.length);
    gl.bindVertexArray(null);
  }
  if (routePath.length > 1) {
    const dashLen = 8;
    const gapLen = 5;
    const step = dashLen + gapLen;
    const speed = 40;
    const verts = [];
    let cumDist = 0;
    for (let i = 0; i < routePath.length - 1; i++) {
      const x0 = routePath[i].x,
        y0 = routePath[i].y;
      const x1 = routePath[i + 1].x,
        y1 = routePath[i + 1].y;
      const dx = x1 - x0,
        dy = y1 - y0;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const offset = (((cumDist - t * speed) % step) + step) % step;
      for (let d = -offset; d < len + dashLen; d += step) {
        const t0 = Math.max(0, d / len);
        const t1 = Math.min(1, (d + dashLen) / len);
        if (t0 < t1) {
          verts.push(x0 + dx * t0, y0 + dy * t0);
          verts.push(x0 + dx * t1, y0 + dy * t1);
        }
      }
      cumDist += len;
    }
    if (verts.length > 0) {
      const routeVerts = new Float32Array(verts);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(constProg);
      gl.uniform2f(constU.uCam, camera.x, camera.y);
      gl.uniform1f(constU.uZoom, camera.zoom);
      gl.uniform2f(constU.uRes, w, h);
      gl.uniform3f(constU.uCol, 0, 1, 0.5);
      gl.uniform1f(constU.uAlpha, 0.8);
      gl.bindVertexArray(constVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, constBuf);
      gl.bufferData(gl.ARRAY_BUFFER, routeVerts, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.LINES, 0, routeVerts.length / 2);
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, constBuf);
      gl.bufferData(gl.ARRAY_BUFFER, constVerts, gl.STATIC_DRAW);
    }
  }
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.useProgram(ptProg);
  gl.uniform2f(ptU.uCam, camera.x, camera.y);
  gl.uniform1f(ptU.uZoom, camera.zoom);
  gl.uniform2f(ptU.uRes, w, h);
  gl.uniform1f(ptU.uTime, t);
  gl.uniform1f(ptU.uMaxPS, maxPointSize);
  gl.bindVertexArray(ptVAO);
  gl.drawArrays(gl.POINTS, 0, stars.length);
  renderLabels();
  if (selectedStar) {
    const rad = (selectedStar.size * camera.zoom * 0.5 + 8) / camera.zoom;
    const segs = 48;
    const verts = new Float32Array((segs + 1) * 5);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      verts[i * 5] = selectedStar.x + Math.cos(a) * rad;
      verts[i * 5 + 1] = selectedStar.y + Math.sin(a) * rad;
      verts[i * 5 + 2] = 1;
      verts[i * 5 + 3] = 0.84;
      verts[i * 5 + 4] = 0;
    }
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(selProg);
    gl.uniform2f(selU.uCam, camera.x, camera.y);
    gl.uniform1f(selU.uZoom, camera.zoom);
    gl.uniform2f(selU.uRes, w, h);
    gl.uniform1f(selU.uTime, t);
    gl.bindVertexArray(selVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, selBuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    const stride = 5 * 4;
    gl.vertexAttribPointer(selU.pos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(selU.pos);
    gl.vertexAttribPointer(selU.col, 3, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(selU.col);
    gl.drawArrays(gl.LINE_LOOP, 0, segs + 1);
    gl.disableVertexAttribArray(selU.pos);
    gl.disableVertexAttribArray(selU.col);
    let infoHTML;
    if (selectedStar === currentStar) {
      infoHTML = `<span class="star-current">${selectedStar.name}<button class="btn-fav" data-name="${selectedStar.name}">${selectedStar.bookmark ? ICON_STAR_FILLED : ICON_STAR}</button>${selectedStar.visited ? " " + ICON_CHECK : ""}</span><br><span class="star-dist">Current location</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ${classifyStar(selectedStar)}</span><br><span class="star-dist"><span class="star-label-route">System:</span> ${selectedStar.system}</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ${TECH_NAMES[getTechLevel(selectedStar)]}</span><br><span class="star-dist"><span class="star-label-route">Status:</span> ${selectedStar.status != null ? STATUS_STR[selectedStar.status] : "Uneventful"}</span>`;
    } else {
      let totalDist,
        suffix = "";
      if (routePath.length > 1) {
        totalDist = 0;
        for (let i = 0; i < routePath.length - 1; i++) {
          totalDist += Math.hypot(
            routePath[i + 1].x - routePath[i].x,
            routePath[i + 1].y - routePath[i].y,
          );
        }
        suffix = ` (${routePath.length - 1} warps)`;
      } else {
        totalDist = Math.hypot(
          selectedStar.x - currentStar.x,
          selectedStar.y - currentStar.y,
        );
      }
      const routeParsecs = (totalDist * PARSEC_SCALE).toFixed(1);
      const visitedIcon = selectedStar.visited ? " " + ICON_CHECK : "";
      const statusLine = `<br><span class="star-dist"><span class="star-label-route">Status:</span> ${selectedStar.visited ? (selectedStar.status != null ? STATUS_STR[selectedStar.status] : "Uneventful") : "Unknown"}</span>`;
      infoHTML = `<span class="star-highlight">${selectedStar.name}<button class="btn-fav" data-name="${selectedStar.name}">${selectedStar.bookmark ? ICON_STAR_FILLED : ICON_STAR}</button>${visitedIcon}</span><br><span class="star-dist"><span class="star-label-route">Distance:</span> ${routeParsecs} pc${suffix}</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ${classifyStar(selectedStar)}</span><br><span class="star-dist"><span class="star-label-route">System:</span> ${selectedStar.system}</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ${TECH_NAMES[getTechLevel(selectedStar)]}</span>${statusLine}`;
    }
    if (infoHTML !== prevInfoHTML) {
      starInfo.innerHTML = infoHTML;
      prevInfoHTML = infoHTML;
    }
  } else if (currentStar) {
    const infoHTML = `<span class="star-current">${currentStar.name}<button class="btn-fav" data-name="${currentStar.name}">${currentStar.bookmark ? ICON_STAR_FILLED : ICON_STAR}</button> ${ICON_CHECK}</span><br><span class="star-dist">Current location</span><br><span class="star-dist"><span class="star-label-route">Class:</span> ${classifyStar(currentStar)}</span><br><span class="star-dist"><span class="star-label-route">System:</span> ${currentStar.system}</span><br><span class="star-dist"><span class="star-label-route">Tech Level:</span> ${TECH_NAMES[getTechLevel(currentStar)]}</span><br><span class="star-dist"><span class="star-label-route">Status:</span> ${currentStar.status != null ? STATUS_STR[currentStar.status] : "Uneventful"}</span>`;
    if (infoHTML !== prevInfoHTML) {
      starInfo.innerHTML = infoHTML;
      prevInfoHTML = infoHTML;
    }
  } else {
    const infoHTML = "Select a star";
    if (infoHTML !== prevInfoHTML) {
      starInfo.innerHTML = infoHTML;
      prevInfoHTML = infoHTML;
    }
  }
  if (
    selectedStar !== prevSelStar ||
    currentStar !== prevCurStar ||
    routePath.length !== prevRouteLen
  ) {
    updateInfoRoute();
    prevSelStar = selectedStar;
    prevCurStar = currentStar;
    prevRouteLen = routePath.length;
  }
  for (const star of stars) {
    if (!star.bridge) continue;
    const rad = (star.size * camera.zoom * 0.5 + 6) / camera.zoom;
    const segs = 64;
    const turns = 3;
    const verts = new Float32Array((segs + 1) * 5);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const a = t * Math.PI * 2 * turns - time * 0.0003;
      const r = rad * t;
      verts[i * 5] = star.x - Math.cos(a) * r;
      verts[i * 5 + 1] = star.y + Math.sin(a) * r;
      const mix = t;
      verts[i * 5 + 2] = 1 - mix * 0.5;
      verts[i * 5 + 3] = 1 - mix;
      verts[i * 5 + 4] = 1 - mix * 0.2;
    }
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(selProg);
    gl.uniform2f(selU.uCam, camera.x, camera.y);
    gl.uniform1f(selU.uZoom, camera.zoom);
    gl.uniform2f(selU.uRes, w, h);
    gl.uniform1f(selU.uTime, t);
    gl.bindVertexArray(selVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, selBuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    const stride = 5 * 4;
    gl.vertexAttribPointer(selU.pos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(selU.pos);
    gl.vertexAttribPointer(selU.col, 3, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(selU.col);
    gl.drawArrays(gl.LINE_STRIP, 0, segs + 1);
    gl.disableVertexAttribArray(selU.pos);
    gl.disableVertexAttribArray(selU.col);
  }
  if (currentStar) {
    const rad = (currentStar.size * camera.zoom * 0.5 + 10) / camera.zoom;
    const segs = 32;
    const verts = new Float32Array((segs + 1) * 5);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      verts[i * 5] = currentStar.x + Math.cos(a) * rad;
      verts[i * 5 + 1] = currentStar.y + Math.sin(a) * rad;
      verts[i * 5 + 2] = 0;
      verts[i * 5 + 3] = 1;
      verts[i * 5 + 4] = 0.5;
    }
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(selProg);
    gl.uniform2f(selU.uCam, camera.x, camera.y);
    gl.uniform1f(selU.uZoom, camera.zoom);
    gl.uniform2f(selU.uRes, w, h);
    gl.uniform1f(selU.uTime, t);
    gl.bindVertexArray(selVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, selBuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    const stride = 5 * 4;
    gl.vertexAttribPointer(selU.pos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(selU.pos);
    gl.vertexAttribPointer(selU.col, 3, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(selU.col);
    gl.drawArrays(gl.LINE_LOOP, 0, segs + 1);
    gl.disableVertexAttribArray(selU.pos);
    gl.disableVertexAttribArray(selU.col);
    const fuelRange =
      typeof playerFuel !== "undefined" ? playerFuel / PARSEC_SCALE : 0;
    if (fuelRange > 0) {
      const rsegs = 64;
      const rverts = new Float32Array((rsegs + 1) * 5);
      for (let i = 0; i <= rsegs; i++) {
        const a = (i / rsegs) * Math.PI * 2;
        rverts[i * 5] = currentStar.x + Math.cos(a) * fuelRange;
        rverts[i * 5 + 1] = currentStar.y + Math.sin(a) * fuelRange;
        rverts[i * 5 + 2] = 1;
        rverts[i * 5 + 3] = 1;
        rverts[i * 5 + 4] = 1;
      }
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(selProg);
      gl.uniform2f(selU.uCam, camera.x, camera.y);
      gl.uniform1f(selU.uZoom, camera.zoom);
      gl.uniform2f(selU.uRes, w, h);
      gl.uniform1f(selU.uTime, t);
      gl.bindVertexArray(selVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, selBuf);
      gl.bufferData(gl.ARRAY_BUFFER, rverts, gl.STREAM_DRAW);
      const stride = 5 * 4;
      gl.vertexAttribPointer(selU.pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(selU.pos);
      gl.vertexAttribPointer(selU.col, 3, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(selU.col);
      gl.drawArrays(gl.LINE_LOOP, 0, rsegs + 1);
      gl.disableVertexAttribArray(selU.pos);
      gl.disableVertexAttribArray(selU.col);
    }
  }
  if (routePath.length > 1) {
    const dest = routePath[routePath.length - 1];
    const rad = (dest.size * camera.zoom * 0.5 + 8) / camera.zoom;
    const segs = 16;
    const dashLen = 0.5;
    const verts = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + dashLen) / segs) * Math.PI * 2;
      verts.push(
        dest.x + Math.cos(a0) * rad,
        dest.y + Math.sin(a0) * rad,
        0,
        1,
        0.5,
      );
      verts.push(
        dest.x + Math.cos(a1) * rad,
        dest.y + Math.sin(a1) * rad,
        0,
        1,
        0.5,
      );
    }
    const dashVerts = new Float32Array(verts);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(selProg);
    gl.uniform2f(selU.uCam, camera.x, camera.y);
    gl.uniform1f(selU.uZoom, camera.zoom);
    gl.uniform2f(selU.uRes, w, h);
    gl.uniform1f(selU.uTime, t);
    gl.bindVertexArray(selVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, selBuf);
    gl.bufferData(gl.ARRAY_BUFFER, dashVerts, gl.STREAM_DRAW);
    const stride = 5 * 4;
    gl.vertexAttribPointer(selU.pos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(selU.pos);
    gl.vertexAttribPointer(selU.col, 3, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(selU.col);
    gl.drawArrays(gl.LINES, 0, dashVerts.length / 5);
    gl.disableVertexAttribArray(selU.pos);
    gl.disableVertexAttribArray(selU.col);
  }
  if (selectedStar && selectedStar.bridgeExit) {
    const exit = selectedStar.bridgeExit;
    const sp = worldToScreen(selectedStar.x, selectedStar.y);
    const ep = worldToScreen(exit.x, exit.y);
    labelCtx.save();
    labelCtx.strokeStyle = "rgba(51, 128, 255, 0.9)";
    labelCtx.lineWidth = 2;
    labelCtx.setLineDash([8, 5]);
    labelCtx.lineDashOffset = -t * 40;
    labelCtx.beginPath();
    labelCtx.moveTo(sp.x, sp.y);
    labelCtx.lineTo(ep.x, ep.y);
    labelCtx.stroke();
    labelCtx.restore();
  }
  gl.bindVertexArray(null);
  gl.useProgram(null);
}
let _mapAnimId = null;
let _mapPaused = false;
function animate(time) {
  if (!_mapPaused) {
    render(time);
    copyOpenPanelBg();
    _mapAnimId = requestAnimationFrame(animate);
  } else {
    _mapAnimId = null;
  }
}
function _mapCanvas(show) {
  var s = document.getElementById("canvas");
  var l = document.getElementById("labels");
  if (s) s.style.display = show ? "" : "none";
  if (l) l.style.display = show ? "" : "none";
}
window.pauseMap = function () {
  if (_mapPaused) return;
  _mapPaused = true;
  window._mapPaused = true;
  _mapCanvas(false);
};
window.resumeMap = function () {
  if (!_mapPaused) return;
  _mapPaused = false;
  window._mapPaused = false;
  _mapCanvas(true);
  if (!_mapAnimId) _mapAnimId = requestAnimationFrame(animate);
};
const _panelBgState = {};
function copyPanelBg(overlayId, panelId, srcEl) {
  const st = _panelBgState[overlayId];
  const tradeOverlay = document.getElementById(overlayId);
  const tradePanel = document.getElementById(panelId);
  const tradeWrap = document.getElementById(panelId + "-bg-wrap");
  const tradeBg = document.getElementById(panelId + "-bg");
  const tradeSrc = srcEl || document.getElementById("canvas");
  if (!st || !st.open || !tradeOverlay || !tradePanel || !tradeWrap || !tradeBg || !tradeSrc) return;
  const r = tradePanel.getBoundingClientRect();
  const margin = 10;
  const dw = r.width + margin * 2;
  const dh = r.height + margin * 2;
  tradeWrap.style.left = r.left + "px";
  tradeWrap.style.top = r.top + "px";
  tradeWrap.style.width = r.width + "px";
  tradeWrap.style.height = r.height + "px";
  const s = tradeSrc.getBoundingClientRect();
  const scaleX = tradeSrc.width / s.width;
  const scaleY = tradeSrc.height / s.height;
  const sw = Math.max(1, Math.round(dw * scaleX));
  const sh = Math.max(1, Math.round(dh * scaleY));
  if (tradeBg.width !== sw) tradeBg.width = sw;
  if (tradeBg.height !== sh) tradeBg.height = sh;
  tradeBg.style.left = -margin + "px";
  tradeBg.style.top = -margin + "px";
  tradeBg.style.width = dw + "px";
  tradeBg.style.height = dh + "px";
  const ctx = tradeBg.getContext("2d");
  const W = tradeBg.width;
  const H = tradeBg.height;
  ctx.clearRect(0, 0, W, H);
  let sx = (r.left - margin) * scaleX;
  let sy = (r.top - margin) * scaleY;
  let sww = dw * scaleX;
  let shh = dh * scaleY;
  let dx = 0;
  let dy = 0;
  if (sx < 0) {
    dx = -sx;
    sww += sx;
    sx = 0;
  }
  if (sy < 0) {
    dy = -sy;
    shh += sy;
    sy = 0;
  }
  if (sx + sww > tradeSrc.width) sww = tradeSrc.width - sx;
  if (sy + shh > tradeSrc.height) shh = tradeSrc.height - sy;
  if (sww > 0 && shh > 0) {
    ctx.drawImage(tradeSrc, sx, sy, sww, shh, dx, dy, sww, shh);
  }
  if (dy > 0) ctx.drawImage(tradeSrc, sx, 0, sww, 1, 0, 0, W, dy);
  if (dx > 0) ctx.drawImage(tradeSrc, 0, sy, 1, shh, 0, dy, dx, shh);
  if (dx + sww < W)
    ctx.drawImage(tradeSrc, tradeSrc.width - 1, sy, 1, shh, dx + sww, dy, W - dx - sww, shh);
  if (dy + shh < H)
    ctx.drawImage(tradeSrc, sx, tradeSrc.height - 1, sww, 1, dx, dy + shh, sww, H - dy - shh);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, W, H);
}
function copyOpenPanelBg() {
  for (const id in _panelBgState) {
    if (_panelBgState[id].open) {
      const pid = _panelBgState[id].panelId;
      if (pid) copyPanelBg(id, pid, _panelBgState[id].src);
    }
  }
}
function travelCopy() {
  for (const id in _panelBgState) {
    const st = _panelBgState[id];
    if (st.open && st.src) copyPanelBg(id, st.panelId, st.src);
  }
}
window.updatePanelBlur = function (overlayId, panelId, open, srcEl) {
  const overlay = document.getElementById(overlayId);
  const panel = document.getElementById(panelId);
  const bg = document.getElementById(panelId + "-bg");
  const wrap = document.getElementById(panelId + "-bg-wrap");
  const src = srcEl || document.getElementById("canvas");
  if (!overlay || !panel || !bg || !wrap || !src) return;
  const st = _panelBgState[overlayId] || (_panelBgState[overlayId] = { open: false, panelId: panelId, src: null });
  st.src = srcEl || null;
  if (open && !st.open) {
    st.open = true;
    copyPanelBg(overlayId, panelId, st.src);
    requestAnimationFrame(() => bg.classList.add("blur-bg"));
    if (st.src && window._registerTravelRender) window._registerTravelRender(travelCopy);
  } else if (!open && st.open) {
    st.open = false;
    bg.classList.remove("blur-bg");
    if (window._unregisterTravelRender) window._unregisterTravelRender(travelCopy);
  }
};
