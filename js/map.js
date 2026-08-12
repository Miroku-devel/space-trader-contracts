// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const STAR_COUNT = 800;
const GALAXY_RADIUS = 600;
const PARSEC_SCALE = 0.3;
const SPECTRAL = [
  { label: "O", mass: 0.1 },
  { label: "B", mass: 0.15 },
  { label: "A", mass: 0.2 },
  { label: "F", mass: 0.25 },
  { label: "G", mass: 0.18 },
  { label: "K", mass: 0.1 },
  { label: "M", mass: 0.02 },
];
let stars = [];
let sortedStarIndices = [];
let selectedStar = null;
let currentStar = null;
function rebuildSortedIndices() {
  sortedStarIndices = stars
    .map((_, i) => i)
    .sort((a, b) => stars[b].size - stars[a].size);
}
let prevCamX = 0,
  prevCamY = 0,
  prevCamZoom = 1;
let prevInfoHTML = "";
let prevSelStar = null,
  prevCurStar = null,
  prevRouteLen = 0;
let camera = { x: 0, y: 0, zoom: 1 };
let cameraTarget = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let cameraStart = { x: 0, y: 0 };
let nameIndex = 0;
const PREFIXES = [
  "Al", "Bet", "Cap", "Del", "Eps", "Zet", "Eta", "The", "Iot", "Kap",
  "Lam", "Mu", "Nu", "Xi", "Omi", "Pi", "Rho", "Sig", "Tau", "Ups",
  "Phi", "Chi", "Psi", "Ome", "Aql", "Ari", "Aur", "Boo", "Cam", "Cas",
  "Cen", "Cet", "Com", "Cor", "Cyg", "Dra", "Eri", "Gem", "Her", "Hya",
  "Leo", "Lep", "Lib", "Lyr", "Mon", "Oph", "Ori", "Peg", "Per", "Psc",
];
const SUFFIXES = [
  "aris", "on", "us", "a", "um", "is", "or", "en", "ax", "an",
  "iel", "ael", "orium", "aris", "onis", "enor", "ith", "os", "eon", "ias",
];
function generateStarName() {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  nameIndex++;
  const name = `${p}${s} ${nameIndex}`;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
function spectralClass(mass) {
  let cumulative = 0;
  for (const s of SPECTRAL) {
    cumulative += s.mass;
    if (mass <= cumulative) return s;
  }
  return SPECTRAL[SPECTRAL.length - 1];
}
function generateStars() {
  window._nebulaSeed = (Math.random() - 0.5) * 4.0;
  stars = [];
  let attempts = 0;
  while (stars.length < STAR_COUNT && attempts < STAR_COUNT * 10) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * GALAXY_RADIUS * 0.85;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const mass = Math.random();
    const spectral = spectralClass(mass);
    const size = 2.5;
    const brightness = 0.8 + Math.random() * 0.2;
    let overlap = false;
    for (const s of stars) {
      const dx = s.x - x;
      const dy = s.y - y;
      const minDist = (s.size + size) * 0.7 + 4;
      if (dx * dx + dy * dy < minDist * minDist) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;
    const spectralColors = {
      O: [0.2, 0.1, 1.0],
      B: [0.3, 0.3, 1.0],
      A: [0.5, 0.6, 1.0],
      F: [1.0, 0.8, 0.2],
      G: [1.0, 0.6, 0.1],
      K: [1.0, 0.3, 0.0],
      M: [0.9, 0.1, 0.0],
    };
    const base = spectralColors[spectral.label];
    const vary = 0.4;
    const planetColor = [Math.random(), Math.random(), Math.random()];
    stars.push({
      x,
      y,
      size,
      brightness,
      spectral,
      mass,
      color: [
        Math.max(0, Math.min(1, base[0] + (Math.random() - 0.5) * vary)),
        Math.max(0, Math.min(1, base[1] + (Math.random() - 0.5) * vary)),
        Math.max(0, Math.min(1, base[2] + (Math.random() - 0.5) * vary)),
      ],
      name: generateStarName(),
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 2,
      system: (function () {
        var t = Math.floor(Math.random() * 8);
        var ps = POLITICAL_SYSTEMS.filter(function (p) {
          return POLITICS_MIN_TECH[p] <= t && POLITICS_MAX_TECH[p] >= t;
        });
        return ps[Math.floor(Math.random() * ps.length)];
      })(),
      status: STATUS_EVENTS.Uneventful,
      visited: false,
      bookmark: false,
      resource:
        Math.random() < 0.4
          ? RESOURCE_NAMES[
              1 + Math.floor(Math.random() * (RESOURCE_NAMES.length - 1))
            ]
          : "None",
      planetClass: Math.random() < 0.02 ? "Habitable Moon" : null,
      techLevel: Math.floor(Math.random() * 8),
      systemSize: Math.floor(Math.random() * 5),
      planetColor,
    });
  }
  for (const star of stars) randomizeStarStatus(star);
  for (const star of stars) {
    if (star.planetClass === "Habitable Moon") {
      star.size = 0.5 + Math.random() * 1.0;
    } else {
      const cls = ["Tiny", "Small", "Medium", "Large", "Huge"][
        Math.floor(star.mass * 5)
      ];
      const sizes = {
        Tiny: [0.5, 1.0],
        Small: [1.0, 1.5],
        Medium: [1.5, 2.5],
        Large: [2.5, 3.5],
        Huge: [3.5, 4.5],
      };
      const r = sizes[cls];
      star.size = r[0] + Math.random() * (r[1] - r[0]);
    }
  }
  rebuildSortedIndices();
  const minPx = 13 / PARSEC_SCALE;
  const minD2 = minPx * minPx;
  const target = minPx * 0.85;
  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (let i = 0; i < stars.length; i++) {
      let nearestJ = -1;
      let nearestD2 = Infinity;
      for (let j = 0; j < stars.length; j++) {
        if (i === j) continue;
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearestD2) {
          nearestD2 = d2;
          nearestJ = j;
        }
      }
      if (nearestD2 > minD2 && nearestJ >= 0) {
        const dx = stars[nearestJ].x - stars[i].x;
        const dy = stars[nearestJ].y - stars[i].y;
        const dist = Math.sqrt(nearestD2);
        const frac = 1 - target / dist;
        stars[i].x += dx * frac;
        stars[i].y += dy * frac;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const maxJumpDist = 20 / PARSEC_SCALE;
  const sqMaxJump = maxJumpDist * maxJumpDist;
  for (let iter = 0; iter < 100; iter++) {
    const visited = new Uint8Array(stars.length);
    const queue = [0];
    visited[0] = 1;
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      const us = stars[u];
      for (let v = 0; v < stars.length; v++) {
        if (visited[v]) continue;
        const dx = stars[v].x - us.x;
        const dy = stars[v].y - us.y;
        if (dx * dx + dy * dy <= sqMaxJump) {
          visited[v] = 1;
          queue.push(v);
        }
      }
    }
    let allConnected = true;
    for (let i = 0; i < stars.length; i++) {
      if (!visited[i]) {
        allConnected = false;
        let nearestJ = -1;
        let nearestD2 = Infinity;
        for (let j = 0; j < stars.length; j++) {
          if (i === j || !visited[j]) continue;
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < nearestD2) {
            nearestD2 = d2;
            nearestJ = j;
          }
        }
        if (nearestJ >= 0) {
          const dx = stars[nearestJ].x - stars[i].x;
          const dy = stars[nearestJ].y - stars[i].y;
          const dist = Math.sqrt(nearestD2);
          const frac = Math.min(1, (maxJumpDist * 0.9) / dist);
          stars[i].x += dx * frac;
          stars[i].y += dy * frac;
        }
        break;
      }
    }
    if (allConnected) break;
  }
}
const POLITICAL_SYSTEMS = [
  "Anarchy", "Capitalist", "Communist", "Confederacy", "Corporate",
  "Cybernetic", "Democracy", "Dictatorship", "Fascist", "Feudal",
  "Military", "Monarchy", "Pacifist", "Socialist", "Technocracy",
  "Theocracy",
];
const POLITICS_MIN_TECH = {
  Anarchy: 0, Capitalist: 4, Communist: 1, Confederacy: 1,
  Corporate: 4, Cybernetic: 6, Democracy: 3, Dictatorship: 0,
  Fascist: 4, Feudal: 0, Military: 2, Monarchy: 0,
  Pacifist: 0, Socialist: 0, Technocracy: 4, Theocracy: 0,
};
const POLITICS_MAX_TECH = {
  Anarchy: 5, Capitalist: 7, Communist: 5, Confederacy: 6,
  Corporate: 7, Cybernetic: 7, Democracy: 7, Dictatorship: 7,
  Fascist: 7, Feudal: 3, Military: 7, Monarchy: 5,
  Pacifist: 3, Socialist: 5, Technocracy: 7, Theocracy: 4,
};
const RESOURCE_NAMES = [
  "None", "MineralRich", "MineralPoor", "Desert", "SweetwaterOceans",
  "RichFauna", "Lifeless", "WeirdMushrooms", "SpecialHerbs", "Artistic",
  "Warlike", "RichSoil", "PoorSoil",
];
function classifyStar(star) {
  if (star.bridge) return "Wormhole";
  if (star.planetClass) return star.planetClass;
  const classes = ["Tiny", "Small", "Medium", "Large", "Huge"];
  return classes[Math.floor(star.mass * classes.length)];
}
const TECH_NAMES = [
  "Pre-Agricultural", "Agricultural", "Medieval", "Renaissance",
  "Early Industrial", "Industrial", "Post-Industrial", "Hi-Tech",
];
const STATUS_EVENTS = {
  Uneventful: 0,
  AtWar: 1,
  Plague: 2,
  Drought: 3,
  Boredom: 4,
  ColdSpell: 5,
  CropFailure: 6,
  LackWorkers: 7,
  Count: 8,
};
function randomizeStarStatus(star) {
  const hasStatus = star.status !== STATUS_EVENTS.Uneventful;
  if (Math.random() < 0.15) {
    star.status = hasStatus
      ? STATUS_EVENTS.Uneventful
      : 1 + Math.floor(Math.random() * (STATUS_EVENTS.Count - 1));
  }
}
const STATUS_STR = [
  "Uneventful", "At war", "Ravaged by plague", "Suffering from drought",
  "Extreme boredom", "Cold spell", "Crop failure", "Lack of workers",
];
function getTechLevel(star) {
  return star.techLevel != null
    ? star.techLevel
    : Math.floor(Math.random() * 8);
}
function worldToScreen(wx, wy) {
  return {
    x: (wx - camera.x) * camera.zoom + canvas.width / 2,
    y: (wy - camera.y) * camera.zoom + canvas.height / 2,
  };
}
function screenToWorld(sx, sy) {
  var r = canvas.width / canvas.clientWidth;
  return {
    x: (sx * r - canvas.width / 2) / camera.zoom + camera.x,
    y: (sy * r - canvas.height / 2) / camera.zoom + camera.y,
  };
}
function clampCamera() {
  const halfW = canvas.width / 2 / camera.zoom;
  const halfH = canvas.height / 2 / camera.zoom;
  const limit = Math.max(0, GALAXY_RADIUS * 2 - Math.min(halfW, halfH));
  camera.x = Math.max(-limit, Math.min(limit, camera.x));
  camera.y = Math.max(-limit, Math.min(limit, camera.y));
}
let constPath = [];
let starGraph = {};
let routePath = [];
let constVerts = null;
let ptDataNeedsUpdate = true;
function planetColor(star) {
  if (star.bridge) return [0.5, 0.0, 0.8];
  if (star.planetClass === "Habitable Moon") return [0.3, 0.9, 0.6];
  return star.planetColor || [0.3, 0.3, 0.8];
}
function fillPointBuffer() {
  const data = new Float32Array(stars.length * STRIDE);
  let off = 0;
  for (const s of stars) {
    const pc = planetColor(s);
    data[off] = s.x;
    data[off + 1] = s.y;
    data[off + 2] = s.size;
    data[off + 3] = pc[0];
    data[off + 4] = pc[1];
    data[off + 5] = pc[2];
    data[off + 6] = s.brightness;
    data[off + 7] = s.twinklePhase;
    data[off + 8] = s.twinkleSpeed;
    off += STRIDE;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  ptDataNeedsUpdate = false;
}
function buildConstellation() {
  const n = stars.length;
  if (n === 0) {
    constPath = [];
    return;
  }
  const inMST = new Uint8Array(n);
  const minDist = new Float32Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  inMST[0] = 1;
  const sx0 = stars[0].x,
    sy0 = stars[0].y;
  for (let i = 1; i < n; i++) {
    const d = Math.hypot(stars[i].x - sx0, stars[i].y - sy0);
    if (d < minDist[i]) {
      minDist[i] = d;
      parent[i] = 0;
    }
  }
  const pairs = [];
  for (let step = 1; step < n; step++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (inMST[i]) continue;
      if (minDist[i] < best) {
        best = minDist[i];
        u = i;
      }
    }
    if (u === -1) break;
    inMST[u] = 1;
    if (parent[u] !== -1) {
      pairs.push(stars[parent[u]]);
      pairs.push(stars[u]);
    }
    const sx = stars[u].x,
      sy = stars[u].y;
    for (let i = 0; i < n; i++) {
      if (inMST[i]) continue;
      const d = Math.hypot(stars[i].x - sx, stars[i].y - sy);
      if (d < minDist[i]) {
        minDist[i] = d;
        parent[i] = u;
      }
    }
  }
  constPath = pairs;
  starGraph = {};
  for (let i = 0; i < n; i++) starGraph[i] = [];
  for (let i = 0; i < n; i++) {
    if (parent[i] !== -1) {
      starGraph[i].push(parent[i]);
      starGraph[parent[i]].push(i);
    }
  }
  const hasExistingBridges = stars.some((s) => s.bridge && s.bridgeExit);
  if (!hasExistingBridges) {
    const wormholeCount = 8;
    const wormholeIndices = [];
    const shuffled = Array.from({ length: stars.length }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < wormholeCount; i++) wormholeIndices.push(shuffled[i]);
    for (let i = 0; i < wormholeCount; i++) {
      const a = wormholeIndices[i];
      const b = wormholeIndices[(i + 1) % wormholeCount];
      stars[a].bridge = true;
      stars[b].bridge = true;
      stars[a].bridgeExit = stars[b];
    }
  }
  for (let i = 0; i < n; i++) {
    if (stars[i].bridge && stars[i].bridgeExit) {
      const j = stars.indexOf(stars[i].bridgeExit);
      if (j !== -1 && !starGraph[i].includes(j)) {
        starGraph[i].push(j);
      }
    }
  }
  const verts = new Float32Array(pairs.length * 2);
  for (let i = 0; i < pairs.length; i++) {
    verts[i * 2] = pairs[i].x;
    verts[i * 2 + 1] = pairs[i].y;
  }
  constVerts = verts;
  gl.bindBuffer(gl.ARRAY_BUFFER, constBuf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
}
function findPath(fromStar, toStar) {
  if (fromStar === toStar) return [fromStar];
  const fromIdx = stars.indexOf(fromStar);
  const toIdx = stars.indexOf(toStar);
  if (fromIdx === -1 || toIdx === -1) return [];
  const maxFuel =
    typeof maxFuelCapacity === "function"
      ? maxFuelCapacity()
      : typeof playerFuel !== "undefined"
        ? playerFuel
        : 0;
  const sqRange = (Math.max(1, maxFuel) / PARSEC_SCALE) ** 2;
  const visited = new Uint8Array(stars.length);
  const prev = new Int32Array(stars.length).fill(-1);
  const queue = [fromIdx];
  visited[fromIdx] = 1;
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    if (u === toIdx) break;
    const uStar = stars[u];
    for (let v = 0; v < stars.length; v++) {
      if (visited[v]) continue;
      const dx = stars[v].x - uStar.x;
      const dy = stars[v].y - uStar.y;
      const isBridge = uStar.bridge && uStar.bridgeExit === stars[v];
      if (dx * dx + dy * dy <= sqRange || isBridge) {
        visited[v] = 1;
        prev[v] = u;
        queue.push(v);
      }
    }
  }
  if (!visited[toIdx]) return [];
  const path = [];
  let cur = toIdx;
  while (cur !== -1) {
    path.push(stars[cur]);
    cur = prev[cur];
  }
  path.reverse();
  return path;
}
const BOOKMARK_MAX = 6;
function toggleBookmark(star, btn) {
  if (!star.bookmark) {
    const favCount = stars.reduce((n, s) => n + (s.bookmark ? 1 : 0), 0);
    if (favCount >= BOOKMARK_MAX) {
      btn.classList.remove("btn-fav-flash");
      void btn.offsetWidth;
      btn.classList.add("btn-fav-flash");
      return;
    }
  }
  const wasBookmarked = star.bookmark;
  star.bookmark = !star.bookmark;
  if (typeof saveState === "function") saveState();
  if (!wasBookmarked) {
    if (typeof openSearch === "function") {
      if (!document.getElementById("search-overlay").classList.contains("hidden")) {
        if (typeof renderBookmarks === "function") renderBookmarks();
      } else {
        openSearch();
      }
    }
  } else {
    if (typeof closeSearch === "function") closeSearch();
  }
}
document.getElementById("star-info").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-fav");
  if (!btn) return;
  const name = btn.dataset.name;
  const star = stars.find((s) => s.name === name);
  if (!star) return;
  toggleBookmark(star, btn);
});
