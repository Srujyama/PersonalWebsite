// TerrainHero.jsx — a sculpted topographic relief, full-bleed.
//
// The contour lines are NOT drawn as ink. A height field is carved with
// grooves and then lit, so every ring has a shadowed wall and a lit wall and
// the surface reads as pressed sand / letterpressed paper rather than a
// printed map. Two normals come off the same gradient: a groove-perturbed
// one (via chain rule, so no finite differences cross the sharp groove walls)
// drives the fine line emboss, and the smooth one drives a broad hillshade on
// the hill bodies. All colour comes from shading a single base tone, which is
// what keeps it monochrome and calm enough to set type over.
//
// Props: { onLost?: () => void } — called on WebGL context loss.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

const NUM_PEAKS = 9;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2  uResolution;
  uniform vec2  uCursor;        // 0..1 screen space
  uniform float uCursorActive;  // 0..1
  uniform float uTime;
  uniform vec4  uPeaks[${NUM_PEAKS}];  // xy = centre, z = amplitude, w = invWidth
  uniform vec2  uTilt;
  uniform vec3  uBase;          // paper
  uniform vec3  uDeep;          // groove shadow
  uniform vec3  uLight;         // groove highlight
  uniform vec3  uBodyShade;     // broad hill-body shadow
  uniform float uBodyStrength;

  float hash(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.07;
      a *= 0.5;
    }
    return v;
  }

  // Height field: global tilt (so far-field contours never run parallel to a
  // screen edge) + Gaussian summits + soft ridgelines between neighbours +
  // gentle FBM so rings are never perfect circles.
  float terrain(vec2 p){
    float h = dot(uTilt, p);

    for (int i = 0; i < ${NUM_PEAKS}; i++) {
      vec4 pk = uPeaks[i];
      vec2 dp = p - pk.xy;
      h += pk.z * exp(-dot(dp, dp) * pk.w);
    }

    // Ridgelines: connect each peak to the next so summits chain into
    // ranges instead of sitting as isolated bullseyes.
    for (int i = 0; i < ${NUM_PEAKS}; i++) {
      int j = i + 1; if (j >= ${NUM_PEAKS}) j = 0;
      vec2 a = uPeaks[i].xy;
      vec2 ab = uPeaks[j].xy - a;
      float len2 = max(dot(ab, ab), 1e-4);
      if (len2 > 1.4) continue;                 // only near neighbours
      float t = clamp(dot(p - a, ab) / len2, 0.0, 1.0);
      vec2 dr = p - (a + t * ab);
      float ridgeH = min(uPeaks[i].z, uPeaks[j].z) * 0.22;
      h += ridgeH * exp(-dot(dr, dr) * 26.0);
    }

    h += (fbm(p * 3.5 + vec2(7.3, 2.1)) - 0.5) * 0.18;

    // Slow domain-warped breathing so the surface is quietly alive.
    float t = uTime * 0.015;
    float wx = fbm(p * 2.0 + vec2(1.7 + t, 8.3));
    float wy = fbm(p * 2.0 + vec2(6.1, 0.4 - t));
    h += (fbm((p + vec2(wx, wy) * 0.09) * 4.0) - 0.5) * 0.09;

    return h;
  }

  void main(){
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    float h = terrain(p);

    // Cursor crater — presses ~5 concentric rings into the surface.
    vec2 cp = (uCursor - 0.5) * vec2(aspect, 1.0);
    vec2 dc = p - cp;
    h += -exp(-dot(dc, dc) / (0.075 * 0.075)) * 0.55 * uCursorActive;

    // ── carve grooves ──
    float bands = 20.0;
    float c  = h * bands;
    float fc = fract(c);
    float d  = abs(fc - 0.5);                  // 0 at a contour, 0.5 between
    float w  = max(fwidth(c), 1e-4);
    float halfWidth = w * 3.5;
    float t = clamp(1.0 - d / halfWidth, 0.0, 1.0);
    float grooveDepth = 0.055;

    // Analytical normal perturbation (chain rule) instead of differencing the
    // carved height — differencing across a groove wall stair-steps badly.
    //   d(profile)/dd · dd/d(fc) · d(fc)/dh · bands
    // At a groove centre t=1 so t(1-t)=0 and the sign() discontinuity is
    // always multiplied away.
    float hx = dFdx(h);
    float hy = dFdy(h);
    float grooveFactor = grooveDepth * 6.0 * t * (1.0 - t)
      * bands * sign(fc - 0.5) / halfWidth;

    vec3 n      = normalize(vec3(-hx * (1.0 + grooveFactor) * 110.0,
                                 -hy * (1.0 + grooveFactor) * 110.0, 1.0));
    vec3 n_body = normalize(vec3(-hx * 110.0, -hy * 110.0, 1.0));
    vec3 L = normalize(vec3(-0.5, 0.65, 0.7));

    // Signed shade about a flat-ground baseline so the body of the map stays
    // near uBase and only walls swing toward shadow/highlight.
    float shade     = clamp((dot(n,      L) - 0.65) * 2.5, -1.0, 1.0);
    float shadeBody = clamp((dot(n_body, L) - 0.65) * 2.5, -1.0, 1.0);

    vec3 col = uBase;
    // Broad hill-body shadow underneath, then the fine groove emboss on top.
    col = mix(col, uBodyShade, max(-shadeBody, 0.0) * uBodyStrength);
    float shadeContour = mix(shade, shade - shadeBody, uBodyStrength);
    col = mix(col, uDeep,  max(-shadeContour, 0.0));
    col = mix(col, uLight, max( shadeContour, 0.0));

    // Manual sRGB encode — ShaderMaterial doesn't get three's auto chunk, and
    // without it the warm cream skews olive on the lit side.
    vec3 outCol = mix(
      12.92 * col,
      1.055 * pow(max(col, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
      step(vec3(0.0031308), col)
    );
    gl_FragColor = vec4(outCol, 1.0);
  }
`;

/* Peak layout: coarse Poisson-ish scatter across a wide field so summits
   fill the viewport at any aspect without clustering. Slope stays inside a
   budget (amplitude vs width) so ring spacing never collapses to moiré. */
function buildPeaks() {
  const peaks = [];
  const rand = (a, b) => a + Math.random() * (b - a);
  let guard = 0;
  while (peaks.length < NUM_PEAKS && guard++ < 400) {
    const x = rand(-1.05, 1.05);
    const y = rand(-0.62, 0.62);
    if (peaks.some((q) => (q.x - x) ** 2 + (q.y - y) ** 2 < 0.085)) continue;
    const amp = rand(0.42, 1.05) * (Math.random() < 0.25 ? -1 : 1); // some basins
    const width = rand(0.16, 0.34); // sigma
    peaks.push({ x, y, amp, invWidth: 1 / (width * width) });
  }
  while (peaks.length < NUM_PEAKS) peaks.push({ x: 9, y: 9, amp: 0, invWidth: 1 });
  return peaks;
}

function TerrainPlane({ palette }) {
  const uniforms = useMemo(() => {
    const peaks = buildPeaks();
    const sign = () => (Math.random() < 0.5 ? -1 : 1);
    return {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCursor: { value: new THREE.Vector2(0.5, 0.5) },
      uCursorActive: { value: 0 },
      uTime: { value: 0 },
      uPeaks: {
        value: peaks.map((k) => new THREE.Vector4(k.x, k.y, k.amp, k.invWidth)),
      },
      uTilt: {
        value: new THREE.Vector2(
          sign() * (0.1 + Math.random() * 0.1),
          sign() * (0.1 + Math.random() * 0.1),
        ),
      },
      uBase: { value: new THREE.Color(palette.base) },
      uDeep: { value: new THREE.Color(palette.deep) },
      uLight: { value: new THREE.Color(palette.light) },
      uBodyShade: { value: new THREE.Color(palette.bodyShade) },
      uBodyStrength: { value: palette.bodyStrength },
    };
  }, []); // built once; palette changes are pushed in the effect below

  // Theme swap: repaint in the new palette without rebuilding the terrain.
  useEffect(() => {
    uniforms.uBase.value.set(palette.base);
    uniforms.uDeep.value.set(palette.deep);
    uniforms.uLight.value.set(palette.light);
    uniforms.uBodyShade.value.set(palette.bodyShade);
    uniforms.uBodyStrength.value = palette.bodyStrength;
  }, [palette, uniforms]);

  const target = useRef(new THREE.Vector2(0.5, 0.5));
  const activeTarget = useRef(0);

  useEffect(() => {
    const onMove = (e) => {
      target.current.set(
        e.clientX / window.innerWidth,
        1 - e.clientY / window.innerHeight,
      );
      activeTarget.current = 1;
    };
    const release = () => {
      activeTarget.current = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", release);
    // Touch: a finger lifting fires none of the above, so the crater would
    // stay pressed at the last tap point.
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("touchend", release, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", release);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("touchend", release);
    };
  }, []);

  useFrame((state, dt) => {
    const u = uniforms;
    u.uTime.value = performance.now() / 1000;
    u.uResolution.value.set(state.size.width, state.size.height);
    const k = 1 - Math.exp(-9 * Math.min(dt, 0.05));
    u.uCursor.value.lerp(target.current, k);
    u.uCursorActive.value +=
      (activeTarget.current - u.uCursorActive.value) * (1 - Math.exp(-5 * Math.min(dt, 0.05)));
  });

  // The material is constructed here and mounted via <primitive> rather than
  // as <shaderMaterial uniforms={...}>. R3F's applyProps copies the uniforms
  // object entry-by-entry ({...uniform}), which shares object values but
  // copies NUMBERS by value — silently detaching every scalar uniform from
  // the material, so uTime / uCursorActive / uBodyStrength would never reach
  // the GPU. Owning the material keeps `uniforms` the material's own object.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function TerrainHero({ palette, onLost }) {
  return (
    <div className="terrain-hero-wrap" aria-hidden="true">
      <Canvas
        orthographic
        flat
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 1], near: 0.01, far: 10, zoom: 1 }}
        // preserveDrawingBuffer: the intro reads this canvas back with
        // drawImage to find the contour grooves its dots settle onto. Without
        // it the buffer may be cleared before the copy and the read comes back
        // blank, which silently drops the intro to its fallback exit.
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        onCreated={(state) => {
          state.gl.setClearColor(new THREE.Color(palette.base), 1);
          state.gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              onLost?.();
            },
            { once: true },
          );
        }}
      >
        <TerrainPlane palette={palette} />
      </Canvas>
    </div>
  );
}
