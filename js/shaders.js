// SPDX-License-Identifier: AGPL-3.0-only
"use strict";

const bgVS = `#version 300 es
in vec2 a_pos;
void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;
const bgFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform vec4 u_freqs;
uniform vec2 u_cam;
uniform float u_zoom;
uniform float u_seed;
float field(in vec3 p, float s) {
    float strength = 7. + .03 * log(1.e-6 + fract(sin(u_time) * 4373.11));
    float accum = s/4.;
    float prev = 0.;
    float tw = 0.;
    for (int i = 0; i < 17; ++i) {
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-.5, -.4, -1.5);
        float w = exp(-float(i) / 7.);
        accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
        tw += w;
        prev = mag;
    }
    return max(0., 5. * accum / tw - .7);
}
float field2(in vec3 p, float s) {
    float strength = 7. + .03 * log(1.e-6 + fract(sin(u_time) * 4373.11));
    float accum = s/4.;
    float prev = 0.;
    float tw = 0.;
    for (int i = 0; i < 11; ++i) {
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-.5, -.4, -1.5);
        float w = exp(-float(i) / 7.);
        accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
        tw += w;
        prev = mag;
    }
    return max(0., 5. * accum / tw - .7);
}
vec3 nrand3(vec2 co) {
    vec3 a = fract(cos(co.x * 8.3e-3 + co.y) * vec3(1.3e5, 4.7e5, 2.9e5));
    vec3 b = fract(sin(co.x * 0.3e-3 + co.y) * vec3(8.1e5, 1.0e5, 0.1e5));
    return mix(a, b, 0.5);
}
void main() {
    vec2 uv = 2. * gl_FragCoord.xy / u_res - 1.;
    vec2 uvs = uv * u_res / max(u_res.x, u_res.y);
    vec2 worldPos;
    worldPos.x = (gl_FragCoord.x - u_res.x * 0.5) / u_zoom + u_cam.x;
    worldPos.y = (u_res.y * 0.5 - gl_FragCoord.y) / u_zoom + u_cam.y;
    vec2 fuv = worldPos / 5000.0;
    float seedPhase = fract(u_seed) * 6.2832;
    vec3 p = vec3(fuv, 0.) + vec3(1., -1.3, 0.);
    p += .2 * vec3(sin(seedPhase + u_time / 64.), sin(seedPhase * 1.7 + u_time / 48.), sin(seedPhase * 0.3 + u_time / 512.));
    float freqs[4];
    freqs[0] = u_freqs.x;
    freqs[1] = u_freqs.y;
    freqs[2] = u_freqs.z;
    freqs[3] = u_freqs.w;
    float t = field(p, freqs[2]);
    float v = (1. - exp((abs(uv.x) - 1.) * 6.)) * (1. - exp((abs(uv.y) - 1.) * 6.));
    float dyn = 4. + sin(u_time * 0.0275) * 0.2 + 0.2 + sin(u_time * 0.0375) * 0.3 + 0.4;
    vec3 p2 = vec3(fuv * 4.0 / dyn, 1.5) + vec3(2., -1.3, -1.);
    p2 += 0.25 * vec3(sin(seedPhase + u_time / 64.), sin(seedPhase * 1.7 + u_time / 48.), sin(seedPhase * 0.3 + u_time / 512.));
    float t2 = field2(p2, freqs[3]);
    vec4 c2 = mix(.4, 1., v) * vec4(1.3 * t2 * t2 * t2 * 0.25, 1.8 * t2 * t2 * 0.25, t2 * freqs[0] * 0.25, t2);
    vec2 seed2 = floor(worldPos * 4.0 / dyn * 2.0 + 1000.0);
    vec3 rnd2 = nrand3(seed2);
    float starBright2 = pow(rnd2.y, 40.0);
    if (starBright2 > 0.0) {
        vec2 delta2 = fract(worldPos * 4.0 / dyn * 2.0) - 0.5;
        float d2 = length(delta2);
        float r2 = 0.25 + rnd2.z * 0.2;
        starBright2 *= smoothstep(r2, 0.0, d2);
    }
    vec4 starcolor = vec4(starBright2);
    fragColor = mix(freqs[3] - .3, 1., v) * vec4(1.5 * freqs[2] * t * t * t * 0.25, 1.2 * freqs[1] * t * t * 0.25, freqs[3] * t * 0.25, 1.0) + c2 + starcolor;
}`;
const ptVS = `#version 300 es
in vec2 a_pos;
in float a_size;
in vec3 a_color;
in float a_bright;
in float a_phase;
in float a_speed;
uniform vec2 u_cam;
uniform float u_zoom;
uniform vec2 u_res;
uniform float u_time;
uniform float u_maxPS;
out vec3 v_col;
out float v_alpha;
void main() {
    vec2 sp = (a_pos - u_cam) * u_zoom + u_res * 0.5;
    gl_Position = vec4(sp / u_res * 2.0 - 1.0, 0.0, 1.0);
    gl_Position.y = -gl_Position.y;
    float tw = 0.7 + 0.3 * sin(u_time * a_speed + a_phase);
    v_alpha = a_bright * tw;
    v_col = a_color;
    gl_PointSize = min(max(1.0, a_size * u_zoom * 0.5), u_maxPS);
}`;
const ptFS = `#version 300 es
precision highp float;
in vec3 v_col;
in float v_alpha;
out vec4 fragColor;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float glow = pow(max(1.0 - d, 0.0), 1.5);
    vec3 col = v_col + glow * 0.5;
    fragColor = vec4(col * glow * 5.0, v_alpha);
}`;
const selVS = `#version 300 es
in vec2 a_pos;
in vec3 a_color;
uniform vec2 u_cam;
uniform float u_zoom;
uniform vec2 u_res;
out vec3 v_color;
void main() {
    vec2 sp = (a_pos - u_cam) * u_zoom + u_res * 0.5;
    gl_Position = vec4(sp / u_res * 2.0 - 1.0, 0.0, 1.0);
    gl_Position.y = -gl_Position.y;
    v_color = a_color;
}`;
const selFS = `#version 300 es
precision highp float;
in vec3 v_color;
uniform float u_time;
out vec4 fragColor;
void main() {
    float a = 0.5 + 0.3 * sin(u_time * 3.0);
    fragColor = vec4(v_color, a);
}`;
const constVS = `#version 300 es
in vec2 a_pos;
uniform vec2 u_cam;
uniform float u_zoom;
uniform vec2 u_res;
void main() {
    vec2 sp = (a_pos - u_cam) * u_zoom + u_res * 0.5;
    gl_Position = vec4(sp / u_res * 2.0 - 1.0, 0.0, 1.0);
    gl_Position.y = -gl_Position.y;
}`;
const constFS = `#version 300 es
precision highp float;
uniform vec3 u_color;
uniform float u_alpha;
out vec4 fragColor;
void main() {
    fragColor = vec4(u_color, u_alpha);
}`;
const cloudFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform sampler2D u_tex0;
void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec4 cloud = texture(u_tex0, uv * 0.25) * 0.5;
    fragColor = pow(max(vec4(0.0), (1.0 - length(uv - 0.5) * 2.0) * cloud), vec4(4.0));
}`;
const combatFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform float u_nebulaTime;
uniform vec2 u_res;
uniform float u_seed;
float fBrightness = 2.5;
float fSteps = 360.0;
float fParticleSize = 0.003;
float fMinDist = 0.8;
float fMaxDist = 5.0;
float fRepeatMin = 0.4;
float fRepeatMax = 1.2;
float fDepthFade = 0.8;
vec3 GetParticleColour( const in vec3 pos, const in vec3 dir )
{
    float d = dot(pos, dir);
    float dist = length(pos - dir * d) / fParticleSize;
    float shade = clamp(1.0 - dist, 0.0, 1.0) * fBrightness / (1.0 + d * fDepthFade);
    return vec3(shade);
}
vec3 GetParticlePos( const in vec3 d, const in float z )
{
	float s = (floor(fract(atan(d.x, d.y) / 6.2832) * 360.0) + 0.5) * 0.00277778;
	float h = fract(s * 43758.5453);
	float r = fMinDist + fract(h * 443.89) * (fMaxDist - fMinDist);
	float p = fRepeatMin + fract(h * 397.30) * (fRepeatMax - fRepeatMin);
	float t = d.z * r / length(d.xy) + z;
	return vec3(sin(s * 6.2832) * r, cos(s * 6.2832) * r, (ceil(t / p) - 0.5) * p - z);
}
vec3 Starfield( const in vec3 vRayDir, const in float fZPos )
{	
	vec3 vParticlePos = GetParticlePos(vRayDir, fZPos);
	return GetParticleColour(vParticlePos, vRayDir);
}
float hash21(vec2 p) {
    p = fract(p * vec2(443.8975, 397.2973));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
}
float n21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm21(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * n21(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}
void main()
{
	vec2 vScreenUV = gl_FragCoord.xy / u_res;
	vec2 vScreenPos = vScreenUV * 2.0 - 1.0;
	vScreenPos.x *= u_res.x / u_res.y;
	vec3 vRayDir = normalize(vec3(vScreenPos, 1.0));
	float sa = sin(u_time * 0.05);
	float ca = cos(u_time * 0.05);
	float rx = vRayDir.x, ry = vRayDir.y, rz = vRayDir.z;
	vRayDir = vec3(ca * -rz + sa * ry, sa * rz + ca * ry, rx);
	float fZPos = mod(5.0 + u_time * 2.0, 200.0);
    float hue = u_seed + u_time * 0.4;
    float sh = sin(hue), ch = cos(hue);
    vec3 vResult = vec3(sh, -0.5 * sh + 0.866 * ch, -0.5 * sh - 0.866 * ch);
    vResult = vResult * vResult * 0.025;
    vResult += Starfield(vRayDir, fZPos);
	vec2 nuv = vScreenUV * 1.5 + vec2(u_seed * 100.0, u_seed * 50.0) + vec2(u_nebulaTime * 0.12, u_nebulaTime * 0.1);
	float nv = fbm21(nuv);
	nv = smoothstep(0.2, 0.65, nv);
	float a = u_seed * 3.0 + u_nebulaTime * 0.02;
	float ca2 = cos(a), sa2 = sin(a);
	vec3 nb = 0.5 + 0.5 * vec3(ca2, -0.5 * ca2 - 0.866 * sa2, -0.5 * ca2 + 0.866 * sa2);
	vec3 nebColor = nb * nv * 0.08;
	vResult += nebColor;
	fragColor = vec4(sqrt(vResult),1.0);
}`;
const combatFSMobile = combatFS.replace(
  "vec3(ca * -rz + sa * ry, sa * rz + ca * ry, rx)",
  "vec3(ca * rx - sa * rz, -sa * rx - ca * rz, ry)",
);
const wormholeFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform sampler2D u_tex0;
uniform float u_mobile;
#define STAR_SCALE 1.75
#define STAR_SPEED 1.8
float pi = atan(1.0)*4.0;
vec4 StarSample(vec2 uv, float dens, vec2 dir)
{
    float threshold = 1.0 - dens;
    vec2 res = vec2(textureSize(u_tex0, 0));
    vec2 cell = floor(uv * res);
    vec2 sub = fract(uv * res) - 0.5;
    vec4 v = vec4(0.0);
    for(int i = -5; i <= 5; i++)
    {
        vec2 c = cell + dir * float(i);
        vec4 n = texture(u_tex0, (c + 0.5) / res);
        float hasStar = step(threshold, n.r);
        vec2 rnd = n.gb - 0.5;
        vec2 delta = sub + dir * float(i) - rnd;
        float along = dot(delta, dir);
        float perp = dot(delta, vec2(1.0) - dir);
        float d = sqrt(along * along * 0.0001 + perp * perp * 2.0);
        float glow = smoothstep(0.8, 0.0, d) * hasStar;
        v = max(v, vec4(glow));
    }
    return v;
}
vec4 StarField(vec2 uv)
{
    vec4 scroll = STAR_SPEED * vec4(1.0, 0.25, 0.11, 0.0625) * u_time;
    vec2 res = vec2(textureSize(u_tex0, 0));
    scroll = floor(scroll * res.x)/res.x;
    vec2 dir = u_mobile > 0.5 ? vec2(0,1) : vec2(1,0);
    float s = 0.0;
    s += StarSample(uv / STAR_SCALE + dir * scroll.x, 0.0005, dir).r * 1.00;
    s += StarSample(uv / STAR_SCALE + dir * scroll.y, 0.0005, dir).g * 0.75;
	return vec4(vec3(s), 1.0);
}
void main()
{
    vec2 res = u_res.xy / u_res.y;
    vec2 uv = gl_FragCoord.xy / u_res.y;
    uv -= res/2.0;
    vec4 stars = StarField(uv);
    vec3 dark = vec3(0.08, 0.0, 0.12);
    vec3 light = vec3(0.6, 0.25, 0.8);
    float t = u_mobile > 0.5 ? (uv.y + 0.5) : (uv.x / res.x + 0.5);
    vec3 bg = mix(dark, light, t);
    fragColor = vec4(mix(bg, stars.rgb, stars.r * 0.35), 1.0);
}`;
const fullQuadVS = `#version 300 es
in vec2 a_pos;
void main(){gl_Position=vec4(a_pos,0,1);}`;
const missVS = `#version 300 es
in vec2 a_pos;in vec2 a_uv;in float a_alpha;out vec2 v_uv;out float v_alpha;void main(){v_uv=a_uv;v_alpha=a_alpha;gl_Position=vec4(a_pos,0,1);}`;
const missFS = `#version 300 es
precision mediump float;in vec2 v_uv;in float v_alpha;uniform sampler2D u_tex0;out vec4 fragColor;void main(){vec4 t=texture(u_tex0,v_uv);fragColor=vec4(t.rgb*v_alpha,t.a*v_alpha);}`;
const laserFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_shipPos;
uniform float u_shipSize;
uniform float u_mobile;
uniform vec2 u_laser[8];
uniform int u_count;
uniform vec2 u_hitPos[8];
uniform float u_seed;
uniform vec3 u_laserColor[8];
uniform float u_shieldHit;
uniform vec3 u_shieldHitColor;
uniform float u_sinT3;
uniform float u_expT3;
uniform float u_expT18;
uniform float u_t2;
uniform float u_fade;
uniform vec4 u_sinT20;
uniform float u_r06;
uniform float u_hit[8];
void main(){
vec2 uv=(gl_FragCoord.xy-u_shipPos*u_res)/u_shipSize;
if(u_mobile>0.5)uv=vec2(uv.y,-uv.x);
vec3 c=vec3(0.0);
for(int i=0;i<8;i++){
if(i>=u_count)break;
vec2 cd=(uv-u_laser[i])*2.0;
float cdl=length(cd);
float cg=0.0;
if(cdl<0.6){ cg=pow((20.0+7.0*u_sinT3)*cdl+0.001,-2.2); }
c+=u_laserColor[i]*cg*u_expT3;
vec2 p=uv-u_laser[i];
vec2 ht=(u_hitPos[i]*u_res-u_shipPos*u_res)/u_shipSize;
if(u_mobile>0.5)ht=vec2(ht.y,-ht.x);
vec2 dir=ht-u_laser[i];
float len=length(dir);
if(len>0.001){
dir/=len;
float proj=clamp(dot(p,dir),0.0,len);
vec2 closest=dir*proj;
float dist=length(p-closest);
float fadeEnd=1.0-smoothstep(0.9,1.0,proj/len);
float beam=0.0;
if(dist<0.035){ beam=exp(-dist*dist*5000.0)*u_expT3*fadeEnd; }
float glow=exp(-dist*dist*0.3)*u_expT18*0.15*fadeEnd;
c+=(beam+glow)*u_laserColor[i];
}
vec2 puv=uv-ht;
if(u_shieldHit>0.5){
float d=length(puv);
float ring=exp(-(d-u_r06)*(d-u_r06)/0.001);
c+=ring*u_fade*u_shieldHitColor;
}else if(u_hit[i]>0.5 && length(puv)<0.30){
float clr=0.0;
            for(float p=0.0;p<4.0;p+=1.0){
float a=fract(sin((u_seed+float(i)*13.7+p*7.3)*127.1+311.7)*43758.5453123)*6.2832;
float r=p*(1.0/32.0)+fract(sin((u_seed*1.7+float(i)*7.7+p*13.3+0.5)*127.1+311.7)*43758.5453123)*0.05;
vec2 tPos=vec2(cos(a),sin(a))*r;
vec2 pPos=vec2(0.0);
pPos.x=tPos.x*u_time;
pPos.y=-0.72*u_t2+tPos.y*u_time;
if(u_mobile>0.5)pPos=vec2(pPos.y,-pPos.x);
float px=1.0/distance(puv,pPos+0.015);
px=smoothstep(0.0,200.0,px);
clr+=px*(u_sinT20[int(p)]+1.0);
}
c+=clr*u_fade*vec3(4.0,0.5,0.1);
}
}
fragColor=vec4(c,clamp(length(c),0.0,1.0));
}`;
const explFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_center;
uniform float u_size;
float gyroid(vec3 p){return dot(cos(p),sin(p.yzx));}
float fbm(vec3 p){float r=0.,a=.5;for(float i=0.;i<8.;++i){p.z+=r*.1;r+=abs(gyroid(p/a)*a);a/=1.7;}return r;}
void main(){vec2 uv=(gl_FragCoord.xy-u_center)/u_size;float id=0.0;float timeline=u_time/2.+id;vec2 anim=vec2(fract(timeline),floor(timeline));float growth=pow(anim.x,.2);float fade=1.-smoothstep(.3,.9,anim.x);float scale=anim.x;float burn=1.-pow(anim.x,.4);float speed=pow(anim.x,.4);vec3 ray=normalize(vec3(uv,.01+scale));ray.z+=speed+anim.y+id*196.128;float noise=fbm(ray);vec3 e=vec3(.1,.1,0.);vec3 normal=normalize(noise-vec3(fbm(ray+e.xzz),fbm(ray+e.zyz),1.));vec3 color=.2+1.*cos(vec3(1,2,3)*5.5+normal.y);float smoke=noise-2.*burn;float shade=(normal.y*.5+.5);color=mix(color,vec3(smoke*shade),smoothstep(.0,.1,smoke));float radius=.4*noise*growth;float shape=smoothstep(.03,.0,length(uv)-radius);float envelope=smoothstep(0.,.15,anim.x)*fade;color=mix(vec3(0.),color,shape*envelope);fragColor=vec4(color,shape*envelope);}`;
const warpFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_shipPos;
uniform float u_shipSize;
uniform float u_mobile;
uniform vec2 u_warp[8];
uniform vec3 u_warpColor[8];
uniform int u_warpCount;
void main(){
vec2 uv=gl_FragCoord.xy-u_shipPos*u_res;
if(u_mobile>0.5)uv=vec2(uv.y,-uv.x);
uv/=u_shipSize;
vec3 col=vec3(0);
for(int i=0;i<8;i++){
if(i>=u_warpCount)break;
vec2 wp=u_warp[i];
vec3 wc=u_warpColor[i];
vec2 d=(uv-wp)*2.0;
float glow=1.0/((20.0+7.0*sin(u_time))*length(d)+0.01);
col+=wc*glow*2.0;
float traily=abs(d.y+0.01*sin(5.0*d.x+40.0*u_time));
float trail=smoothstep(0.025,0.0,traily)*smoothstep(0.0,0.15,-d.x)*step(abs(d.y),0.05);
col+=clamp(wc*1.4,0.0,1.0)*trail;
}
float a=max(max(col.r,col.g),col.b);
fragColor=vec4(col,clamp(a,0.0,1.0));
}`;
const shieldFS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_shipPos;
uniform float u_shipSize;
uniform float u_mobile;
uniform float u_mirror;
uniform vec3 u_shieldColor;
uniform float u_shieldAlpha;
const float PI = 3.14159265;
float sphere(float t, float k)
{
    float d = 1.0+t*t-t*t*k*k;
    if (d <= 0.0)
        return -1.0;
    float x = (k - sqrt(d))/(1.0 + t*t);
    float a = x*t;
    float a2 = a*a;
    return a * (1.0 + a2 * (0.16666667 + a2 * 0.075));
}
void main()
{
    vec2 uv = gl_FragCoord.xy - u_shipPos * u_res;
    if (u_mobile > 0.5) uv = vec2(uv.y, -uv.x);
    uv.x *= u_mirror;
    uv /= u_shipSize;
    float halfMask = smoothstep(-0.6, 1.5, uv.x);
    float len = length(uv);
    float len2 = -sphere(len, sqrt(2.0));
    uv = uv * len2 * 0.5 / len;
    uv = uv + 0.5;
    vec2 pos = uv;
    pos.x += u_time * 0.8;
    float t = u_time;
    float scale1 = 40.0;
    float scale2 = 20.0;
    float val = 0.0;
    val += sin((pos.x*scale1 + t));
    val += sin((pos.y*scale1 + t)/2.0);
    val += sin((pos.x*scale2 + pos.y*scale2 + sin(t))/2.0);
    val += sin((pos.x*scale2 - pos.y*scale2 + t)/2.0);
    val /= 2.0;
    float glow = 0.020 / (0.015 + distance(len, 1.0));
    val = (cos(PI*val) + 1.0) * 0.5;
    vec3 shieldContrib = step(len, 1.0) * 0.5 * u_shieldColor * val + glow * u_shieldColor;
    float alpha = 0.5 * halfMask * (1.0 - smoothstep(1.0, 2.5, len)) * u_shieldAlpha;
    fragColor = vec4(shieldContrib * 2.0 * halfMask, alpha);
}`;
