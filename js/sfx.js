// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

var SFX = {
  _ctx: null,
  _buffers: {},
  _sounds: {},
  _loops: {},
  _masterGain: null,
  _fadeDuration: 30,
  _stopFadeDuration: 60,
  _inited: false,
  _isFile: false,
  _muted: false,
  _musicVolume: isFinite(parseFloat(localStorage.getItem("MUSIC_VOLUME")))
    ? parseFloat(localStorage.getItem("MUSIC_VOLUME"))
    : 0.5,
  _musicNames: { bg: 1, ng: 1, tension: 1, travel: 1, wormhole: 1 },
  _pending: {},
  setMuted: function (val) {
    SFX._muted = val;
    if (SFX._masterGain) {
      SFX._masterGain.gain.value = val ? 0 : 1;
    }
    for (var key in SFX._loops) {
      var entry = SFX._loops[key];
      if (entry.audio) {
        entry.audio.muted = val;
      }
    }
  },
  init: function () {
    if (SFX._inited) return;
    SFX._inited = true;
    SFX._isFile = window.location.protocol === "file:";
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      SFX._ctx = new AC();
      SFX._masterGain = SFX._ctx.createGain();
      SFX._masterGain.gain.value = SFX._muted ? 0 : 1;
      SFX._masterGain.connect(SFX._ctx.destination);
    } catch (e) {
      SFX._ctx = null;
    }
    function resume() {
      if (SFX._ctx && SFX._ctx.state === "suspended") {
        SFX._ctx.resume();
      }
    }
    document.addEventListener("click", resume);
    document.addEventListener("touchstart", resume);
    document.addEventListener("keydown", resume);
  },
  _registry: {},
  load: function (name, path, opts) {
    opts = opts || {};
    SFX._registry[name] = { path: path, loaded: false, opts: opts };
    if (opts.lazy) return;
    SFX._doLoad(name, path);
  },
  _ensureLoaded: function (name) {
    var entry = SFX._registry[name];
    if (!entry || entry.loaded) return;
    entry.loaded = true;
    SFX._doLoad(name, entry.path);
  },
  _doLoad: function (name, path) {
    if (SFX._isFile) {
      if (!SFX._sounds[name]) {
        var a = new Audio(path);
        a.preload = "auto";
        SFX._sounds[name] = a;
      }
      return Promise.resolve();
    }
    if (!SFX._ctx || SFX._buffers[name]) return Promise.resolve();
    return new Promise(function (resolve) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", path, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function () {
        if (xhr.status === 200) {
          SFX._ctx.decodeAudioData(
            xhr.response,
            function (buf) {
              SFX._buffers[name] = buf;
              resolve();
            },
            function () {
              resolve();
            },
          );
        } else {
          resolve();
        }
      };
      xhr.onerror = function () {
        resolve();
      };
      xhr.send();
    });
  },
  preloadAll: function () {
    var priority = ["bg"];
    var promises = [];
    var i, name;
    for (i = 0; i < priority.length; i++) {
      name = priority[i];
      if (SFX._registry[name] && !SFX._registry[name].opts.lazy) {
        SFX._registry[name].loaded = true;
        promises.push(SFX._doLoad(name, SFX._registry[name].path));
      }
    }
    for (name in SFX._registry) {
      if (priority.indexOf(name) !== -1) continue;
      if (!SFX._registry[name].opts.lazy) {
        SFX._registry[name].loaded = true;
        promises.push(SFX._doLoad(name, SFX._registry[name].path));
      }
    }
    return Promise.all(promises);
  },
  play: function (name) {
    SFX._ensureLoaded(name);
    if (!SFX._isFile && SFX._ctx && SFX._buffers[name]) {
      var source = SFX._ctx.createBufferSource();
      source.buffer = SFX._buffers[name];
      var gain = SFX._ctx.createGain();
      gain.gain.value = SFX._musicNames[name] ? SFX._musicVolume : 1;
      source.connect(gain);
      gain.connect(SFX._masterGain);
      source.start(0);
      source.onended = function () {
        source.disconnect();
        gain.disconnect();
      };
      return;
    }
    var a = SFX._sounds[name];
    if (!a) return;
    a.volume = SFX._musicNames[name] ? SFX._musicVolume : 1;
    a.muted = SFX._muted;
    a.currentTime = 0;
    a.play().catch(function () {});
  },
  playUI: function (name) {
    SFX.play(name);
  },
  startLoop: function (key, name, wx, wy, audibleFn) {
    audibleFn =
      audibleFn ||
      function () {
        return 1;
      };
    var existing = SFX._loops[key];
    if (existing) {
      if (existing.state === "fadeout") {
        var vol = (existing.audibleFn || audibleFn)(wx, wy);
        if (vol > 0) {
          existing.state = "fadein";
          existing.fadeTimer = existing.fadeDuration - existing.fadeTimer;
        }
      }
      existing.volTarget = (existing.audibleFn || audibleFn)(wx, wy);
      if (existing.volTarget <= 0 && existing.state !== "fadeout") {
        existing.state = "fadeout";
        existing.fadeTimer = 0;
      }
      return;
    }
    if (wx === undefined) return;
    var vol = audibleFn(wx, wy);
    if (vol <= 0) return;
    if (SFX._ctx && SFX._ctx.state === "suspended") {
      SFX._pending[key] = { name: name, wx: wx, wy: wy, audibleFn: audibleFn };
      return;
    }
    SFX._ensureLoaded(name);
    if (!SFX._isFile && SFX._ctx && SFX._buffers[name]) {
      var source = SFX._ctx.createBufferSource();
      source.buffer = SFX._buffers[name];
      source.loop = true;
      var gain = SFX._ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(SFX._masterGain);
      var offset = 0;
      if (name !== "ng" && source.buffer.duration > 1) {
        offset = Math.random() * source.buffer.duration;
      }
      source.start(0, offset);
      SFX._loops[key] = {
        source: source,
        gain: gain,
        state: "fadein",
        fadeTimer: 0,
        fadeDuration: SFX._fadeDuration,
        volTarget: vol,
        audibleFn: audibleFn,
        name: name,
      };
      return;
    }
    var a = SFX._sounds[name];
    if (!a) return;
    var loop = a.cloneNode();
    loop.loop = true;
    loop.volume = 0;
    loop.muted = SFX._muted;
    if (name !== "ng" && a.duration > 1) {
      loop.currentTime = Math.random() * a.duration;
    }
    var entry = {
      audio: loop,
      state: "fadein",
      fadeTimer: 0,
      fadeDuration: SFX._fadeDuration,
      volTarget: vol,
      audibleFn: audibleFn,
      name: name,
    };
    SFX._loops[key] = entry;
    var p = loop.play();
    if (p) p.catch(function () {});
  },
  stopLoop: function (key) {
    var entry = SFX._loops[key];
    if (!entry) return;
    if (entry.state === "fadeout") return;
    if (entry.state === "fadein") {
      var t = Math.min(entry.fadeTimer / entry.fadeDuration, 1);
      entry.volTarget = entry.volTarget * t;
    }
    entry.state = "fadeout";
    entry.fadeTimer = 0;
    entry.fadeDuration = SFX._stopFadeDuration;
  },
  _stopThemeLoops: function () {
    SFX.stopLoop("bg_loop");
    SFX.stopLoop("ng_loop");
    SFX.stopLoop("travel_loop");
    SFX.stopLoop("tension_loop");
    SFX.stopLoop("wormhole_loop");
  },
  playNewGameTheme: function () {
    SFX._stopThemeLoops();
    _bgRequested = false;
    SFX.startLoop("ng_loop", "ng", 0, 0, function () {
      return 1;
    });
  },
  stopNewGameTheme: function () {
    var wasPlaying = !!SFX._loops["ng_loop"];
    SFX.stopLoop("ng_loop");
    if (wasPlaying) {
      _bgRequested = true;
    }
  },
  playTravelTheme: function () {
    SFX._stopThemeLoops();
    _bgRequested = false;
    SFX.startLoop("travel_loop", "travel", 0, 0, function () {
      return 1;
    });
  },
  stopTravelTheme: function () {
    var wasPlaying =
      !!SFX._loops["travel_loop"] || !!SFX._loops["tension_loop"];
    SFX.stopLoop("travel_loop");
    SFX.stopLoop("tension_loop");
    if (wasPlaying && !SFX._loops["ng_loop"]) {
      _bgRequested = true;
    }
  },
  playWormholeTheme: function () {
    SFX._stopThemeLoops();
    _bgRequested = false;
    SFX.startLoop("wormhole_loop", "wormhole", 0, 0, function () {
      return 1;
    });
  },
  stopWormholeTheme: function () {
    var wasPlaying = !!SFX._loops["wormhole_loop"];
    SFX.stopLoop("wormhole_loop");
    if (wasPlaying && !SFX._loops["ng_loop"]) {
      _bgRequested = true;
    }
  },
  playFightTheme: function () {
    SFX._stopThemeLoops();
    _bgRequested = false;
    SFX.startLoop("tension_loop", "tension", 0, 0, function () {
      return 1;
    });
  },
  stopFightTheme: function () {
    SFX.stopLoop("tension_loop");
    var overlay = document.getElementById("travel-overlay");
    if (overlay && !overlay.classList.contains("hidden")) {
      SFX.playTravelTheme();
    } else {
      _bgRequested = true;
    }
  },
  tick: function (dt) {
    if (SFX._ctx && SFX._ctx.state === "running") {
      for (var pk in SFX._pending) {
        var pend = SFX._pending[pk];
        delete SFX._pending[pk];
        SFX.startLoop(pk, pend.name, pend.wx, pend.wy, pend.audibleFn);
      }
    }
    for (var key in SFX._loops) {
      var entry = SFX._loops[key];
      entry.fadeTimer += dt;
      var t = entry.fadeTimer / entry.fadeDuration;
      var vol;
      if (entry.state === "fadein") {
        if (t >= 1) {
          entry.state = "playing";
          vol = entry.volTarget;
        } else vol = entry.volTarget * t;
      } else if (entry.state === "fadeout") {
        vol = entry.volTarget * Math.max(0, 1 - t);
        if (t >= 1) {
          if (entry.source) {
            try {
              entry.source.stop(0);
            } catch (e) {}
            entry.source.disconnect();
            entry.gain.disconnect();
          } else if (entry.audio) {
            entry.audio.pause();
            entry.audio.currentTime = 0;
          }
          delete SFX._loops[key];
          continue;
        }
      } else {
        vol = entry.volTarget;
      }
      vol = Math.max(
        0,
        Math.min(1, vol * (SFX._musicNames[entry.name] ? SFX._musicVolume : 1)),
      );
      if (entry.gain) {
        entry.gain.gain.value = vol;
      } else if (entry.audio) {
        entry.audio.volume = vol;
      }
    }
  },
};
SFX.init();
SFX.load("bg", "sfx/bg.ogg");
SFX.load("btn", "sfx/btn.ogg");
SFX.load("ng", "sfx/ng.ogg");
SFX.load("travel", "sfx/travel.ogg");
SFX.load("tension", "sfx/tension.ogg");
SFX.load("wormhole", "sfx/wormhole.ogg");
SFX.load("pew", "sfx/pew.ogg");
SFX.load("boom", "sfx/boom.ogg");
SFX.load("warp", "sfx/warp.ogg");
SFX.load("granted", "sfx/granted.ogg");
SFX.load("denied", "sfx/denied.ogg");
window.SFX = SFX;
var _bgRequested = false;
var _sfxLast = performance.now();
function _sfxLoop(t) {
  var dt = Math.min((t - _sfxLast) / 16.667, 3);
  _sfxLast = t;
  if (_bgRequested && !SFX._loops["bg_loop"]) {
    SFX.startLoop("bg_loop", "bg", 0, 0, function () {
      return 1;
    });
  }
  SFX.tick(dt);
  requestAnimationFrame(_sfxLoop);
}
requestAnimationFrame(_sfxLoop);
document.addEventListener("click", function (e) {
  if (e.target.closest("button")) SFX.playUI("btn");
});
document.getElementById("start-btn").addEventListener("click", function () {
  _bgRequested = true;
});
