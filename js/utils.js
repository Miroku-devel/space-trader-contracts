// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

function compileShader(gl, src, type) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    var info = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(info);
  }
  return s;
}
function createProgram(gl, vsSrc, fsSrc) {
  var vs = compileShader(gl, vsSrc, gl.VERTEX_SHADER);
  var fs = compileShader(gl, fsSrc, gl.FRAGMENT_SHADER);
  var p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    var info = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(info);
  }
  return p;
}
