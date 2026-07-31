// World3D.jsx — the explorable hero. A floating island in the site palette
// with clickable stations; drag to orbit, click a station and the camera
// flies in while a content panel opens. Esc / close flies back out.
// Desktop-only (App falls back to classic on mobile / reduced motion).
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  CameraControls,
  Float,
  Html,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import { STATIONS, OVERVIEW } from "./worldStations";

/* The 2D site is monochrome; the world keeps its colour. */
const NAVY = "#003262";
const GOLD = "#FDB515";
const PURPLE = "#583c8c";
const TEAL = "#2d8f8f";
const INK = "#1c2430";
const STONE = "#ece8de";
const GRANITE = "#ded8ca"; // Sather Tower / Doe Library stone
const GRANITE_D = "#c3bcab"; // its shadowed planes
const GLASS = "#7fa8c9"; // curtain wall
const GLASS_D = "#2d4f6b"; // curtain wall in shadow
const STEEL = "#b9c2c9";

/* The world is the site's front door, so the island reads in whichever theme
   the visitor is in. Only the neutral ground tones swap — the saturated props
   (navy/gold/purple/teal) hold up on both. */
const WORLD = {
  light: {
    ground: "#fdfbf6",
    under: STONE,
    rings: "#d8d2c4",
    rock: "#d9d4c8",
    water: "#cfe0dd",
    path: "#ebe4d3",
    ambient: 1.05,
    sun: 1.25,
    rim: 0.32,
    rimColor: PURPLE,
    skyLight: "#ffffff",
    // Kept light: a saturated ground bounce casts a tan film over the island.
    bounce: "#f4eee2",
    sparkle: PURPLE,
    lamp: GOLD,
    lampGlow: 0.4,
  },
  dark: {
    ground: "#33302b",
    under: "#221f1b",
    rings: "#4d4840",
    rock: "#463f37",
    water: "#1c2f30",
    path: "#443e35",
    ambient: 0.5,
    sun: 0.95,
    rim: 0.5,
    rimColor: "#6f5bb0",
    skyLight: "#48453d",
    bounce: "#181613",
    sparkle: GOLD,
    lamp: GOLD,
    lampGlow: 1.6,
  },
};

/* ─── Station wrapper: hover lift + gold ring + label ─── */
function Station({ id, hovered, setHovered, onOpen, labelY = 2.1, children }) {
  const def = STATIONS[id];
  const inner = useRef(null);
  const isHovered = hovered === id;

  useFrame((_, dt) => {
    if (!inner.current) return;
    const s = THREE.MathUtils.damp(
      inner.current.scale.x,
      isHovered ? 1.07 : 1,
      8,
      dt,
    );
    inner.current.scale.setScalar(s);
  });

  return (
    <group position={def.position}>
      <group
        ref={inner}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered((h) => (h === id ? null : h));
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(id);
        }}
      >
        {children}
        <Html position={[0, labelY, 0]} center zIndexRange={[30, 10]}>
          <button
            type="button"
            className={`world-label ${isHovered ? "world-label-on" : ""}`}
            onClick={() => onOpen(id)}
            tabIndex={-1}
          >
            {def.title}
          </button>
        </Html>
      </group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} visible={isHovered}>
        <ringGeometry args={[1.05, 1.18, 48]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

/* ─── Geometry: DNA helix centerpiece ─── */
function DnaCenterpiece() {
  const group = useRef(null);
  const steps = 13;
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const y = 0.5 + t * 2.1;
      const a = t * Math.PI * 2.2;
      arr.push({ y, a });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.25;
  });

  const R = 0.52;
  return (
    <group ref={group}>
      <mesh castShadow receiveShadow position-y={0.12}>
        <cylinderGeometry args={[0.95, 1.1, 0.24, 32]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      {items.map(({ y, a }, i) => {
        const x1 = Math.cos(a) * R;
        const z1 = Math.sin(a) * R;
        const x2 = Math.cos(a + Math.PI) * R;
        const z2 = Math.sin(a + Math.PI) * R;
        const rungColor = i % 2 === 0 ? PURPLE : TEAL;
        return (
          <group key={i}>
            <mesh castShadow position={[x1, y, z1]}>
              <sphereGeometry args={[0.085, 14, 14]} />
              <meshStandardMaterial color={NAVY} roughness={0.5} />
            </mesh>
            <mesh castShadow position={[x2, y, z2]}>
              <sphereGeometry args={[0.085, 14, 14]} />
              <meshStandardMaterial color={GOLD} roughness={0.5} />
            </mesh>
            <mesh
              position={[(x1 + x2) / 2, y, (z1 + z2) / 2]}
              rotation={[0, -a, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.028, 0.028, R * 2, 8]} />
              <meshStandardMaterial color={rungColor} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ─── Geometry: Sather Tower (education) ───
   The Campanile, built to its real proportions: a ~9:1 slender battered
   granite shaft on a stepped plinth, a string course, clock faces on all four
   sides, an open belfry of three arched openings per face (you can see through
   it to the bells), a projecting cornice and parapet, then the steep pyramid
   roof. */
function SatherTower() {
  const H = {
    plinth: 0.16,
    shaftTop: 2.08,
    clockTop: 2.42,
    belfryTop: 2.9,
    parapetTop: 3.02,
    roofTop: 3.36,
  };

  const faces = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  // Clock: white dial, bronze bezel, hands at ten-past-ten.
  const clockFace = (ry) => (
    <group key={`c${ry}`} rotation-y={ry}>
      <mesh position={[0, 2.25, 0.222]}>
        <circleGeometry args={[0.115, 32]} />
        <meshStandardMaterial color="#f8f5ec" roughness={0.75} />
      </mesh>
      <mesh position={[0, 2.25, 0.224]}>
        <ringGeometry args={[0.105, 0.126, 32]} />
        <meshStandardMaterial color={GOLD} metalness={0.55} roughness={0.35} />
      </mesh>
      {/* hour marks */}
      {[0, 1, 2, 3].map((q) => (
        <mesh
          key={q}
          position={[0, 2.25, 0.226]}
          rotation-z={(q * Math.PI) / 2}
        >
          <planeGeometry args={[0.012, 0.19]} />
          <meshStandardMaterial color="#8e8778" />
        </mesh>
      ))}
      <mesh position={[0, 2.272, 0.229]}>
        <planeGeometry args={[0.011, 0.062]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      <mesh position={[-0.026, 2.25, 0.229]} rotation-z={Math.PI / 2.6}>
        <planeGeometry args={[0.009, 0.05]} />
        <meshStandardMaterial color={INK} />
      </mesh>
    </group>
  );

  // One belfry face: two intermediate piers make three openings, each capped
  // with a semicircular arch.
  const belfryFace = (ry) => {
    const y0 = H.clockTop + 0.02;
    const h = H.belfryTop - y0 - 0.06;
    return (
      <group key={`b${ry}`} rotation-y={ry}>
        {[-0.075, 0.075].map((x) => (
          <mesh key={x} castShadow position={[x, y0 + h / 2, 0.2]}>
            <boxGeometry args={[0.045, h, 0.055]} />
            <meshStandardMaterial color={GRANITE} roughness={0.9} />
          </mesh>
        ))}
        {[-0.15, 0, 0.15].map((x) => (
          <mesh key={`a${x}`} position={[x, y0 + h - 0.055, 0.212]}>
            <ringGeometry args={[0.036, 0.055, 16, 1, 0, Math.PI]} />
            <meshStandardMaterial color={GRANITE} roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  };

  return (
    <group>
      {/* stepped plinth */}
      <mesh castShadow receiveShadow position-y={0.045}>
        <boxGeometry args={[0.78, 0.09, 0.78]} />
        <meshStandardMaterial color={GRANITE_D} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position-y={0.125}>
        <boxGeometry args={[0.6, 0.09, 0.6]} />
        <meshStandardMaterial color={GRANITE} roughness={0.95} />
      </mesh>
      {/* arched entry on the south face */}
      <mesh position={[0, 0.235, 0.213]}>
        <planeGeometry args={[0.11, 0.19]} />
        <meshStandardMaterial color="#40382c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.33, 0.214]}>
        <ringGeometry args={[0.055, 0.075, 16, 1, 0, Math.PI]} />
        <meshStandardMaterial color={GRANITE_D} roughness={0.9} />
      </mesh>

      {/* battered shaft — 4 sides, subtly wider at the base */}
      <mesh castShadow receiveShadow position-y={(H.plinth + H.shaftTop) / 2}>
        <cylinderGeometry
          args={[0.178, 0.212, H.shaftTop - H.plinth, 4, 1]}
        />
        <meshStandardMaterial color={GRANITE} roughness={0.92} flatShading />
      </mesh>
      {/* corner quoins give the shaft an edge to catch light */}
      {[
        [0.19, 0.19],
        [-0.19, 0.19],
        [0.19, -0.19],
        [-0.19, -0.19],
      ].map(([x, z], i) => (
        <mesh
          key={i}
          castShadow
          position={[x * 0.82, (H.plinth + H.shaftTop) / 2, z * 0.82]}
        >
          <boxGeometry args={[0.03, H.shaftTop - H.plinth - 0.05, 0.03]} />
          <meshStandardMaterial color={GRANITE_D} roughness={0.9} />
        </mesh>
      ))}
      {/* string course */}
      <mesh castShadow position-y={H.shaftTop}>
        <boxGeometry args={[0.44, 0.035, 0.44]} />
        <meshStandardMaterial color={GRANITE_D} roughness={0.85} />
      </mesh>

      {/* clock stage */}
      <mesh castShadow receiveShadow position-y={(H.shaftTop + H.clockTop) / 2}>
        <boxGeometry args={[0.42, H.clockTop - H.shaftTop, 0.42]} />
        <meshStandardMaterial color={GRANITE} roughness={0.9} />
      </mesh>
      {faces.map(clockFace)}

      {/* belfry: dark interior box so the arcade reads as open, then the
          piers and arches in front of it */}
      <mesh position-y={(H.clockTop + H.belfryTop) / 2}>
        <boxGeometry args={[0.33, H.belfryTop - H.clockTop - 0.08, 0.33]} />
        <meshStandardMaterial color="#2f2a22" roughness={1} />
      </mesh>
      {/* the bells, lit from within */}
      <mesh position-y={H.clockTop + 0.2}>
        <coneGeometry args={[0.075, 0.13, 12]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.55}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          castShadow
          position={[
            i % 2 ? 0.185 : -0.185,
            (H.clockTop + H.belfryTop) / 2,
            i < 2 ? 0.185 : -0.185,
          ]}
        >
          <boxGeometry args={[0.06, H.belfryTop - H.clockTop, 0.06]} />
          <meshStandardMaterial color={GRANITE} roughness={0.9} />
        </mesh>
      ))}
      {faces.map(belfryFace)}

      {/* cornice + open parapet */}
      <mesh castShadow position-y={H.belfryTop}>
        <boxGeometry args={[0.52, 0.05, 0.52]} />
        <meshStandardMaterial color={GRANITE_D} roughness={0.85} />
      </mesh>
      <mesh castShadow position-y={H.parapetTop - 0.035}>
        <boxGeometry args={[0.47, 0.07, 0.47]} />
        <meshStandardMaterial color={GRANITE} roughness={0.9} />
      </mesh>

      {/* steep pyramid roof + finial */}
      <mesh
        castShadow
        position-y={(H.parapetTop + H.roofTop) / 2}
        rotation-y={Math.PI / 4}
      >
        <coneGeometry
          args={[0.335, H.roofTop - H.parapetTop, 4]}
        />
        <meshStandardMaterial color="#8fa39c" roughness={0.65} flatShading />
      </mesh>
      <mesh position-y={H.roofTop + 0.045}>
        <coneGeometry args={[0.032, 0.09, 8]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/* ─── Geometry: office towers (experience) ───
   Two real buildings. One World Trade Center is the interesting one: its
   square base chamfers into eight elongated isosceles triangles so the plan is
   a perfect octagon at mid-height and a square rotated 45° at the roof. That
   is an antiprism, which three has no primitive for, so the hull is built by
   hand. Salesforce Tower is a tapering rounded-square obelisk under an open
   crown of vertical fins. */

/* Antiprism hull: bottom square rotated 45° from the top square, side surface
   made of 8 triangles. This is what gives 1WTC its twist. */
function useAntiprism(rBottom, rTop, height) {
  return useMemo(() => {
    const B = [], T = [];
    for (let i = 0; i < 4; i++) {
      const ab = (i * Math.PI) / 2 + Math.PI / 4;
      const at = (i * Math.PI) / 2;
      B.push(new THREE.Vector3(Math.cos(ab) * rBottom, 0, Math.sin(ab) * rBottom));
      T.push(new THREE.Vector3(Math.cos(at) * rTop, height, Math.sin(at) * rTop));
    }
    const pos = [];
    const push = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let i = 0; i < 4; i++) {
      const bPrev = B[(i + 3) % 4];
      const b = B[i];
      const t = T[i];
      const tNext = T[(i + 1) % 4];
      // upward-pointing triangle, then the downward one between it and the next
      push(bPrev, b, t);
      push(b, tNext, t);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, [rBottom, rTop, height]);
}

function OneWorldTrade() {
  const roofH = 2.16;
  const base = 0.34;
  const rB = 0.33;
  const rT = 0.235;
  const hull = useAntiprism(rB, rT, roofH - base);

  // Floor bands. The cross-section morphs from a square to a 45°-rotated
  // square, so its circumradius shrinks linearly — a thin ring at the
  // interpolated radius reads as a curtain-wall spandrel at every height.
  const bands = [];
  const N = 13;
  for (let i = 1; i < N; i++) {
    const t = i / N;
    const r = rB + (rT - rB) * t;
    bands.push(
      <mesh
        key={i}
        position-y={base + (roofH - base) * t}
        rotation={[-Math.PI / 2, 0, Math.PI / 8]}
      >
        <ringGeometry args={[r * 0.9, r * 0.975, 8]} />
        <meshStandardMaterial
          color={GLASS_D}
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>,
    );
  }

  return (
    <group>
      {/* windowless podium with its patterned screen */}
      <mesh castShadow receiveShadow position-y={base / 2}>
        <boxGeometry args={[0.5, base, 0.5]} />
        <meshStandardMaterial color="#8e9aa4" roughness={0.5} metalness={0.35} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry) => (
        <group key={ry} rotation-y={ry}>
          {[0.09, 0.18, 0.27].map((y) => (
            <mesh key={y} position={[0, y, 0.252]}>
              <planeGeometry args={[0.44, 0.022]} />
              <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* the twisting shaft — square base, octagon at mid-height, square
          rotated 45° at the roof */}
      <mesh castShadow receiveShadow geometry={hull} position-y={base}>
        <meshStandardMaterial
          color={GLASS}
          roughness={0.12}
          metalness={0.55}
          flatShading
          side={THREE.DoubleSide}
        />
      </mesh>
      {bands}

      {/* roof parapet + the spire */}
      <mesh castShadow position-y={roofH} rotation-y={Math.PI / 4}>
        <boxGeometry args={[rT * 1.42, 0.035, rT * 1.42]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh castShadow position-y={roofH + 0.36}>
        <cylinderGeometry args={[0.01, 0.026, 0.7, 10]} />
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position-y={roofH + 0.73}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={1.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function SalesforceTower() {
  // One smooth tapering mass, not a stack. The real plan is a square with
  // corners rounded so hard it reads almost circular, so a many-sided frustum
  // is both closer to the silhouette and far cleaner than stacked boxes.
  const bodyH = 1.86;
  const rB = 0.255;
  const rT = 0.15;

  const bands = [];
  const N = 15;
  for (let i = 1; i < N; i++) {
    const t = i / N;
    const r = rB + (rT - rB) * t;
    bands.push(
      <mesh key={i} position-y={0.12 + bodyH * t} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[r * 0.955, r * 1.012, 28]} />
        <meshStandardMaterial
          color={GLASS_D}
          metalness={0.4}
          roughness={0.35}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>,
    );
  }

  // Crown: the open lattice above the top occupied floor, lit from within.
  const crownBase = 0.12 + bodyH;
  const fins = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    fins.push(
      <mesh
        key={i}
        position={[Math.cos(a) * rT * 0.94, crownBase + 0.14, Math.sin(a) * rT * 0.94]}
        rotation-y={Math.PI / 2 - a}
      >
        <boxGeometry args={[0.016, 0.28, 0.012]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.75}
          roughness={0.35}
        />
      </mesh>,
    );
  }

  return (
    <group>
      {/* podium */}
      <mesh castShadow receiveShadow position-y={0.06}>
        <cylinderGeometry args={[0.3, 0.33, 0.12, 28]} />
        <meshStandardMaterial color="#7d8894" roughness={0.6} />
      </mesh>
      {/* the shaft */}
      <mesh castShadow receiveShadow position-y={0.12 + bodyH / 2}>
        <cylinderGeometry args={[rT, rB, bodyH, 28, 1]} />
        <meshStandardMaterial color={GLASS} roughness={0.14} metalness={0.6} />
      </mesh>
      {bands}
      {/* crown */}
      <mesh position-y={crownBase + 0.01}>
        <cylinderGeometry args={[rT * 0.98, rT, 0.02, 28]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
      </mesh>
      {fins}
      <mesh position-y={crownBase + 0.29}>
        <cylinderGeometry args={[rT * 0.7, rT * 0.9, 0.02, 28]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* A low-rise so the cluster reads as a skyline, not two lone towers. */
function LowRise() {
  return (
    <group>
      <RoundedBox
        castShadow
        receiveShadow
        args={[0.46, 0.6, 0.46]}
        radius={0.018}
        smoothness={3}
        position-y={0.3}
      >
        <meshStandardMaterial color={PURPLE} roughness={0.62} />
      </RoundedBox>
      {/* ribbon glazing rather than a barcode of white bars */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry) => (
        <group key={ry} rotation-y={ry}>
          {[0.2, 0.4].map((y) => (
            <mesh key={y} position={[0, y, 0.2315]}>
              <planeGeometry args={[0.38, 0.075]} />
              <meshStandardMaterial
                color="#2b2140"
                emissive="#c9b6ee"
                emissiveIntensity={0.35}
                roughness={0.3}
                metalness={0.3}
              />
            </mesh>
          ))}
        </group>
      ))}
      <mesh castShadow position-y={0.62}>
        <boxGeometry args={[0.5, 0.03, 0.5]} />
        <meshStandardMaterial color="#3d3357" roughness={0.7} />
      </mesh>
      <mesh castShadow position-y={0.66}>
        <boxGeometry args={[0.14, 0.06, 0.14]} />
        <meshStandardMaterial color="#2b313d" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Buildings() {
  return (
    <group>
      <group position={[-0.44, 0, -0.06]}>
        <OneWorldTrade />
      </group>
      <group position={[0.34, 0, -0.34]}>
        <SalesforceTower />
      </group>
      <group position={[0.42, 0, 0.44]} rotation-y={-0.2}>
        <LowRise />
      </group>
      {/* plaza the cluster shares */}
      <mesh receiveShadow position-y={0.012} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.12, 40]} />
        <meshStandardMaterial color="#e9e2d1" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Laptop() {
  const BODY = "#2b2b2f"; // Space Black anodised aluminium
  const BODY_D = "#1f1f23";

  // Keyboard: a full-size layout with a half-height function row, in a well.
  const keys = [];
  const rows = [
    { z: -0.152, h: 0.036, n: 13 }, // function row
    { z: -0.098, h: 0.062, n: 13 },
    { z: -0.03, h: 0.062, n: 13 },
    { z: 0.038, h: 0.062, n: 12 },
    { z: 0.106, h: 0.062, n: 11 },
  ];
  rows.forEach((r, ri) => {
    for (let c = 0; c < r.n; c++) {
      const w = 0.066;
      const x = (c - (r.n - 1) / 2) * 0.0715;
      keys.push(
        <mesh key={`${ri}-${c}`} position={[x, 0.0805, r.z]}>
          <boxGeometry args={[w, 0.008, r.h]} />
          <meshStandardMaterial color="#3a3a3f" roughness={0.85} />
        </mesh>,
      );
    }
  });
  // space bar
  keys.push(
    <mesh key="space" position={[0, 0.0805, 0.174]}>
      <boxGeometry args={[0.33, 0.008, 0.062]} />
      <meshStandardMaterial color="#3a3a3f" roughness={0.85} />
    </mesh>,
  );

  return (
    <group rotation-y={-0.5}>
      {/* base — uniform thickness, squared-off sides, like the M-series chassis */}
      <RoundedBox
        castShadow
        receiveShadow
        args={[1.28, 0.062, 0.9]}
        radius={0.02}
        smoothness={5}
        position-y={0.045}
      >
        <meshStandardMaterial color={BODY} roughness={0.42} metalness={0.6} />
      </RoundedBox>
      {/* keyboard well */}
      <mesh position={[0, 0.0765, 0.006]}>
        <boxGeometry args={[0.98, 0.004, 0.44]} />
        <meshStandardMaterial color={BODY_D} roughness={0.9} />
      </mesh>
      {keys}
      {/* the big trackpad */}
      <mesh position={[0, 0.0775, 0.306]}>
        <boxGeometry args={[0.44, 0.004, 0.29]} />
        <meshStandardMaterial color="#33333a" roughness={0.32} metalness={0.35} />
      </mesh>
      {/* speaker grilles either side of the keyboard */}
      {[-0.555, 0.555].map((x) => (
        <mesh key={x} position={[x, 0.0765, 0.006]}>
          <boxGeometry args={[0.06, 0.004, 0.42]} />
          <meshStandardMaterial color="#232327" roughness={0.95} />
        </mesh>
      ))}
      {/* MagSafe + ports on the left flank */}
      {[-0.16, 0, 0.16].map((z) => (
        <mesh key={z} position={[-0.641, 0.045, z]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.05, 0.012]} />
          <meshStandardMaterial color="#141416" roughness={1} />
        </mesh>
      ))}
      {/* feet */}
      {[
        [-0.55, -0.36],
        [0.55, -0.36],
        [-0.55, 0.36],
        [0.55, 0.36],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.011, z]}>
          <cylinderGeometry args={[0.026, 0.026, 0.022, 12]} />
          <meshStandardMaterial color="#121214" roughness={0.9} />
        </mesh>
      ))}

      {/* lid */}
      <group position={[0, 0.076, -0.45]} rotation-x={-Math.PI / 2.42}>
        <RoundedBox
          castShadow
          args={[1.28, 0.88, 0.032]}
          radius={0.018}
          smoothness={5}
          position-y={0.44}
        >
          <meshStandardMaterial color={BODY} roughness={0.42} metalness={0.6} />
        </RoundedBox>
        {/* near-edge-to-edge display: thin bezel, then the panel */}
        <mesh position={[0, 0.44, 0.018]}>
          <planeGeometry args={[1.235, 0.838]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.432, 0.02]}>
          <planeGeometry args={[1.2, 0.79]} />
          <meshStandardMaterial
            color="#0e1a1f"
            emissive="#7fbfd0"
            emissiveIntensity={0.4}
            roughness={0.22}
          />
        </mesh>
        {/* the notch */}
        <mesh position={[0, 0.836, 0.022]}>
          <planeGeometry args={[0.17, 0.03]} />
          <meshStandardMaterial color="#0a0a0c" />
        </mesh>
        {/* editor: sidebar, tab strip, code */}
        <mesh position={[-0.51, 0.432, 0.022]}>
          <planeGeometry args={[0.18, 0.79]} />
          <meshStandardMaterial color="#0b2a30" emissive="#0b2a30" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0.09, 0.795, 0.022]}>
          <planeGeometry args={[1.02, 0.042]} />
          <meshStandardMaterial color="#123c44" emissive="#123c44" emissiveIntensity={0.4} />
        </mesh>
        {[
          [0.0, 0.73, 0.42],
          [0.05, 0.675, 0.3],
          [0.1, 0.62, 0.36],
          [0.1, 0.565, 0.22],
          [0.05, 0.51, 0.33],
          [0.0, 0.455, 0.26],
          [0.05, 0.4, 0.4],
          [0.1, 0.345, 0.19],
          [0.05, 0.29, 0.31],
          [0.0, 0.235, 0.24],
        ].map(([indent, y, len], i) => (
          <mesh key={i} position={[-0.38 + indent + len / 2, y, 0.023]}>
            <planeGeometry args={[len, 0.026]} />
            <meshStandardMaterial
              color={i % 4 === 0 ? GOLD : "#9fe8dd"}
              emissive={i % 4 === 0 ? GOLD : "#9fe8dd"}
              emissiveIntensity={0.55}
            />
          </mesh>
        ))}
        {/* sidebar file rows */}
        {[0.75, 0.7, 0.65, 0.6, 0.55].map((y, i) => (
          <mesh key={`s${i}`} position={[-0.52, y, 0.023]}>
            <planeGeometry args={[0.12, 0.018]} />
            <meshStandardMaterial color="#5f9fa8" emissive="#5f9fa8" emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ─── Geometry: Doe Memorial Library + poster session (publications) ───
   Beaux-Arts granite: a wide podium reached by steps, a colonnade of engaged
   columns with an entablature and projecting cornice, a low attic storey, and
   tall windows in the bays between columns. A conference poster on an easel
   stands out front with a stack of handouts. */
function DoeLibrary() {
  const W = 1.66;
  const D = 0.8;
  const colH = 0.56;
  const nCols = 8;
  const bay = W / nCols;
  const WALL = "#b6ae9d"; // recessed wall, darker so the pale columns read
  const podTop = 0.28;

  const columns = [];
  const windows = [];
  for (let i = 0; i < nCols; i++) {
    const x = (i - (nCols - 1) / 2) * bay;
    columns.push(
      <group key={i} position={[x, 0, D / 2 - 0.015]}>
        <mesh castShadow position-y={podTop + 0.018}>
          <boxGeometry args={[0.098, 0.036, 0.098]} />
          <meshStandardMaterial color={GRANITE} roughness={0.9} />
        </mesh>
        <mesh castShadow position-y={podTop + 0.036 + colH / 2}>
          <cylinderGeometry args={[0.039, 0.044, colH, 16]} />
          <meshStandardMaterial color={GRANITE} roughness={0.85} />
        </mesh>
        <mesh castShadow position-y={podTop + 0.036 + colH + 0.026}>
          <boxGeometry args={[0.096, 0.052, 0.096]} />
          <meshStandardMaterial color="#f0ebdd" roughness={0.82} />
        </mesh>
      </group>,
    );
    if (i < nCols - 1) {
      windows.push(
        <mesh key={i} position={[x + bay / 2, podTop + 0.32, D / 2 - 0.115]}>
          <planeGeometry args={[bay * 0.5, 0.46]} />
          <meshStandardMaterial
            color="#2c3d47"
            emissive={GOLD}
            emissiveIntensity={0.3}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>,
      );
    }
  }

  return (
    <group rotation-y={0.18}>
      {/* broad steps */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={[0, 0.035 + i * 0.058, D / 2 + 0.24 - i * 0.06]}
        >
          <boxGeometry args={[W * 0.46 + i * 0.06, 0.058, 0.135 - i * 0.018]} />
          <meshStandardMaterial color={GRANITE_D} roughness={0.95} />
        </mesh>
      ))}

      {/* rusticated ground storey */}
      <mesh castShadow receiveShadow position-y={podTop / 2}>
        <boxGeometry args={[W, podTop, D]} />
        <meshStandardMaterial color={GRANITE_D} roughness={0.94} />
      </mesh>
      {[0.09, 0.19].map((y) => (
        <mesh key={y} position={[0, y, D / 2 + 0.002]}>
          <planeGeometry args={[W - 0.02, 0.012]} />
          <meshStandardMaterial color="#a9a190" roughness={0.95} />
        </mesh>
      ))}

      {/* recessed wall behind the colonnade — darker, so the columns read as
          standing in front of it rather than melting into it */}
      <mesh castShadow receiveShadow position-y={podTop + (colH + 0.09) / 2}>
        <boxGeometry args={[W, colH + 0.09, D - 0.19]} />
        <meshStandardMaterial color={WALL} roughness={0.93} />
      </mesh>
      {windows}
      {columns}

      {/* projecting central entrance bay */}
      <mesh castShadow receiveShadow position={[0, podTop + 0.2, D / 2 + 0.055]}>
        <boxGeometry args={[bay * 1.9, 0.4, 0.11]} />
        <meshStandardMaterial color={GRANITE} roughness={0.9} />
      </mesh>
      <mesh position={[0, podTop + 0.16, D / 2 + 0.112]}>
        <planeGeometry args={[bay * 0.85, 0.26]} />
        <meshStandardMaterial color="#33291f" roughness={0.95} />
      </mesh>
      <mesh position={[0, podTop + 0.3, D / 2 + 0.112]}>
        <ringGeometry args={[bay * 0.42, bay * 0.5, 18, 1, 0, Math.PI]} />
        <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* entablature + projecting cornice */}
      <mesh castShadow position-y={podTop + 0.036 + colH + 0.082}>
        <boxGeometry args={[W + 0.03, 0.062, D + 0.03]} />
        <meshStandardMaterial color={GRANITE} roughness={0.85} />
      </mesh>
      <mesh castShadow position-y={podTop + 0.036 + colH + 0.132}>
        <boxGeometry args={[W + 0.09, 0.038, D + 0.09]} />
        <meshStandardMaterial color="#f0ebdd" roughness={0.85} />
      </mesh>

      {/* low attic storey with its small windows */}
      <mesh castShadow receiveShadow position-y={podTop + 0.036 + colH + 0.205}>
        <boxGeometry args={[W - 0.08, 0.108, D - 0.08]} />
        <meshStandardMaterial color={GRANITE} roughness={0.9} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (i - 4.5) * (W / 11),
            podTop + 0.036 + colH + 0.205,
            (D - 0.08) / 2 + 0.003,
          ]}
        >
          <planeGeometry args={[0.048, 0.055]} />
          <meshStandardMaterial color="#2c3d47" roughness={0.5} />
        </mesh>
      ))}
      <mesh position-y={podTop + 0.036 + colH + 0.268}>
        <boxGeometry args={[W - 0.04, 0.018, D - 0.04]} />
        <meshStandardMaterial color={GRANITE_D} roughness={0.95} />
      </mesh>

      {/* ── poster session on the plaza in front ── */}
      <group position={[W / 2 - 0.02, 0, D / 2 + 0.46]} rotation-y={-0.6}>
        {/* tripod easel, feet on the ground */}
        {[-0.16, 0.16].map((x) => (
          <mesh key={x} castShadow position={[x, 0.29, 0.01]} rotation-z={x * 0.14}>
            <boxGeometry args={[0.02, 0.58, 0.02]} />
            <meshStandardMaterial color={INK} roughness={0.7} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.24, -0.11]} rotation-x={0.36}>
          <boxGeometry args={[0.018, 0.52, 0.018]} />
          <meshStandardMaterial color={INK} roughness={0.7} />
        </mesh>
        {/* board */}
        <mesh castShadow position={[0, 0.6, 0.015]} rotation-x={-0.06}>
          <boxGeometry args={[0.5, 0.38, 0.016]} />
          <meshStandardMaterial color="#fbf9f3" roughness={0.92} />
        </mesh>
        <group position={[0, 0.6, 0.025]} rotation-x={-0.06}>
          <mesh position={[0, 0.148, 0]}>
            <planeGeometry args={[0.42, 0.034]} />
            <meshStandardMaterial color={NAVY} />
          </mesh>
          <mesh position={[-0.125, 0.055, 0]}>
            <planeGeometry args={[0.16, 0.1]} />
            <meshStandardMaterial color={TEAL} />
          </mesh>
          <mesh position={[0.085, 0.055, 0]}>
            <circleGeometry args={[0.05, 24]} />
            <meshStandardMaterial color={PURPLE} />
          </mesh>
          {[0.028, 0.046, 0.032, 0.058, 0.042].map((h, i) => (
            <mesh key={i} position={[-0.16 + i * 0.042, -0.072 + h / 2, 0]}>
              <planeGeometry args={[0.028, h]} />
              <meshStandardMaterial color={GOLD} />
            </mesh>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`t${i}`} position={[0.105, -0.042 - i * 0.024, 0]}>
              <planeGeometry args={[0.18, 0.01]} />
              <meshStandardMaterial color="#9aa0a6" />
            </mesh>
          ))}
        </group>
        {/* handouts on a small table */}
        <mesh castShadow position={[0.33, 0.16, 0.1]}>
          <boxGeometry args={[0.26, 0.014, 0.2]} />
          <meshStandardMaterial color="#8d7f6b" roughness={0.85} />
        </mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} castShadow position={[0.33 + x, 0.08, 0.1]}>
            <boxGeometry args={[0.016, 0.16, 0.016]} />
            <meshStandardMaterial color={INK} roughness={0.8} />
          </mesh>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[0.33, 0.174 + i * 0.011, 0.1]} rotation-y={i * 0.2}>
            <boxGeometry args={[0.17, 0.011, 0.13]} />
            <meshStandardMaterial color="#fbf9f3" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ─── Geometry: golf green (ventures) ───
   A domed green with a mown ring, a sand bunker, a sunk cup with the pin, a
   flag that actually has a curve to it, and a ball mid-putt. */
function GolfGreen() {
  const flag = useMemo(() => {
    // A gently waving flag: a segmented plane bent along its length.
    const g = new THREE.PlaneGeometry(0.44, 0.24, 12, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const t = (x + 0.22) / 0.44; // 0 at the pole, 1 at the free edge
      p.setZ(i, Math.sin(t * Math.PI * 1.5) * 0.05 * t);
      p.setY(i, p.getY(i) - t * 0.03); // droop
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      {/* domed green */}
      <mesh castShadow receiveShadow position-y={0.03} scale={[1, 0.17, 1]}>
        <sphereGeometry args={[1.02, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#41a066" roughness={0.95} />
      </mesh>
      {/* skirt so it reads as raised turf, not a sticker */}
      <mesh receiveShadow position-y={0.04}>
        <cylinderGeometry args={[1.02, 1.1, 0.1, 40]} />
        <meshStandardMaterial color="#33804f" roughness={0.95} />
      </mesh>
      {/* mown ring */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.176}>
        <ringGeometry args={[0.62, 0.78, 48]} />
        <meshStandardMaterial color="#4bb173" roughness={0.95} transparent opacity={0.75} />
      </mesh>
      {/* bunker */}
      <mesh receiveShadow position={[-0.66, 0.1, 0.5]} scale={[1, 0.35, 0.72]}>
        <sphereGeometry args={[0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e8d9b0" roughness={1} />
      </mesh>

      {/* cup */}
      <mesh position={[0.25, 0.171, 0.15]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.062, 20]} />
        <meshStandardMaterial color="#0e0e0d" roughness={1} />
      </mesh>
      <mesh position={[0.25, 0.16, 0.15]}>
        <cylinderGeometry args={[0.062, 0.062, 0.06, 20, 1, true]} />
        <meshStandardMaterial color="#1a1a18" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* pin */}
      <mesh castShadow position={[0.25, 0.93, 0.15]}>
        <cylinderGeometry args={[0.016, 0.019, 1.5, 12]} />
        <meshStandardMaterial color="#f6f5f0" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh
        castShadow
        geometry={flag}
        position={[0.47, 1.53, 0.15]}
        rotation-y={0.12}
      >
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.22}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ball + a faint putting line toward the cup */}
      <mesh castShadow position={[-0.34, 0.2, 0.36]}>
        <sphereGeometry args={[0.055, 18, 18]} />
        <meshStandardMaterial color="#ffffff" roughness={0.28} />
      </mesh>
      <mesh position={[-0.05, 0.174, 0.255]} rotation={[-Math.PI / 2, 0, -0.34]}>
        <planeGeometry args={[0.62, 0.012]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ─── Geometry: mailbox (contact) ───
   Rounded tunnel body with a seamed door, handle, raised flag, braced post,
   and a letter poking out of the slot. */
function Mailbox() {
  return (
    <group rotation-y={-0.35}>
      {/* post + brace */}
      <mesh castShadow position-y={0.45}>
        <boxGeometry args={[0.085, 0.9, 0.085]} />
        <meshStandardMaterial color="#6b5844" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.74, 0]} rotation-z={Math.PI / 2}>
        <boxGeometry args={[0.055, 0.34, 0.055]} />
        <meshStandardMaterial color="#6b5844" roughness={0.9} />
      </mesh>

      <group position-y={1.0}>
        {/* body: flat floor + rounded top */}
        <mesh castShadow receiveShadow position-y={-0.09}>
          <boxGeometry args={[0.5, 0.22, 0.76]} />
          <meshStandardMaterial color={NAVY} roughness={0.5} metalness={0.25} />
        </mesh>
        <mesh castShadow position-y={0.02}>
          <cylinderGeometry
            args={[0.25, 0.25, 0.76, 24, 1, false, 0, Math.PI]}
          />
          <meshStandardMaterial color={NAVY} roughness={0.5} metalness={0.25} />
        </mesh>
        {/* rear wall */}
        <mesh position={[0, -0.02, -0.382]} rotation-y={Math.PI}>
          <circleGeometry args={[0.25, 24, 0, Math.PI]} />
          <meshStandardMaterial color="#1c1b19" roughness={0.6} />
        </mesh>

        {/* door: recessed panel + seam + handle */}
        <mesh position={[0, -0.02, 0.383]}>
          <circleGeometry args={[0.235, 24, 0, Math.PI]} />
          <meshStandardMaterial color="#2e2d29" roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.02, 0.388]}>
          <ringGeometry args={[0.225, 0.24, 24, 1, 0, Math.PI]} />
          <meshStandardMaterial color="#1c1b19" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.06, 0.398]}>
          <boxGeometry args={[0.14, 0.028, 0.02]} />
          <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* address plate */}
        <mesh position={[0, -0.1, 0.386]}>
          <planeGeometry args={[0.26, 0.07]} />
          <meshStandardMaterial
            color={GOLD}
            emissive={GOLD}
            emissiveIntensity={0.35}
            metalness={0.5}
            roughness={0.35}
          />
        </mesh>

        {/* letter poking out of the slot */}
        <mesh castShadow position={[0.02, 0.13, 0.28]} rotation={[0.5, 0.15, 0.08]}>
          <boxGeometry args={[0.3, 0.012, 0.22]} />
          <meshStandardMaterial color="#fbfaf6" roughness={0.95} />
        </mesh>

        {/* raised flag */}
        <mesh castShadow position={[0.27, 0.2, -0.05]}>
          <boxGeometry args={[0.028, 0.34, 0.028]} />
          <meshStandardMaterial color="#c2410c" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0.283, 0.33, 0.045]}>
          <boxGeometry args={[0.014, 0.13, 0.16]} />
          <meshStandardMaterial color="#e0521a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Island + decorations ─── */
function Island({ wp }) {
  const trees = useMemo(
    () => [
      { p: [-5.2, 0, -1.4], c: TEAL, s: 1.0 },
      { p: [5.3, 0, -1.2], c: PURPLE, s: 0.85 },
      { p: [-0.9, 0, -4.9], c: TEAL, s: 0.8 },
      { p: [0.9, 0, -5.0], c: PURPLE, s: 1.05 },
      { p: [-3.6, 0, 3.4], c: TEAL, s: 0.7 },
      { p: [3.9, 0, 3.2], c: PURPLE, s: 0.75 },
    ],
    [],
  );
  const rocks = useMemo(
    () => [
      { p: [-4.8, 0.12, 1.9], s: 0.22 },
      { p: [4.9, 0.1, 1.6], s: 0.18 },
      { p: [0.2, 0.12, 5.2], s: 0.24 },
      { p: [-2.2, 0.1, -4.4], s: 0.16 },
    ],
    [],
  );
  // Lamps ring the island OUTSIDE the station ring (stations sit at ~4.2), so
  // a post never plants itself in front of a model.
  const lamps = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return [Math.cos(a) * 5.75, 0, Math.sin(a) * 5.75];
      }),
    [],
  );

  return (
    <group>
      {/* shallow water the island sits in — reads as a moat, and gives the
          silhouette something to sit against */}
      <mesh receiveShadow position-y={-0.42} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[8.2, 64]} />
        {/* Non-metallic on purpose: metalness with no environment map has
            nothing to reflect and renders as a dark grey smear. */}
        <meshStandardMaterial
          color={wp.water}
          roughness={0.75}
          metalness={0}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* island slab + rim */}
      <mesh receiveShadow position-y={-0.3}>
        <cylinderGeometry args={[6.5, 5.6, 0.6, 64]} />
        <meshStandardMaterial color={wp.ground} roughness={0.95} />
      </mesh>
      <mesh position-y={-0.02}>
        <cylinderGeometry args={[6.52, 6.5, 0.05, 64]} />
        <meshStandardMaterial color={wp.rings} roughness={0.9} />
      </mesh>
      {/* underside */}
      <mesh position-y={-0.85}>
        <cylinderGeometry args={[5.6, 3.4, 0.55, 64]} />
        <meshStandardMaterial color={wp.under} roughness={1} flatShading />
      </mesh>

      {/* ring path + topo rings */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.006}>
        <ringGeometry args={[4.3, 4.8, 72]} />
        <meshStandardMaterial color={wp.path} roughness={0.95} />
      </mesh>
      {[2.2, 3.6, 6.1].map((r, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position-y={0.004}>
          <ringGeometry args={[r - 0.015, r, 96]} />
          <meshBasicMaterial color={wp.rings} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* lamps — the detail that makes dark mode work */}
      {lamps.map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow position-y={0.34}>
            <cylinderGeometry args={[0.028, 0.038, 0.68, 8]} />
            <meshStandardMaterial color={INK} roughness={0.7} />
          </mesh>
          <mesh position-y={0.73}>
            <sphereGeometry args={[0.072, 14, 14]} />
            <meshStandardMaterial
              color={wp.lamp}
              emissive={wp.lamp}
              emissiveIntensity={wp.lampGlow}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}

      {/* two-tier conifers read far better than a single cone */}
      {trees.map((t, i) => (
        <group key={i} position={t.p} scale={t.s}>
          <mesh castShadow position-y={0.24}>
            <cylinderGeometry args={[0.05, 0.075, 0.48, 8]} />
            <meshStandardMaterial color="#8a7357" roughness={0.9} />
          </mesh>
          <mesh castShadow position-y={0.72}>
            <coneGeometry args={[0.38, 0.62, 8]} />
            <meshStandardMaterial color={t.c} roughness={0.85} flatShading />
          </mesh>
          <mesh castShadow position-y={1.08}>
            <coneGeometry args={[0.27, 0.5, 8]} />
            <meshStandardMaterial color={t.c} roughness={0.85} flatShading />
          </mesh>
          <mesh castShadow position-y={1.38}>
            <coneGeometry args={[0.17, 0.36, 8]} />
            <meshStandardMaterial color={t.c} roughness={0.85} flatShading />
          </mesh>
        </group>
      ))}

      {rocks.map((r, i) => (
        <mesh
          key={i}
          castShadow
          position={r.p}
          scale={[r.s, r.s * 0.7, r.s]}
          rotation-y={i * 1.3}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={wp.rock} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Camera driver ─── */
function CameraRig({ activeStation, controlsRef }) {
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    // Intro dolly on first mount
    c.setLookAt(0, 15, 24, 0, 1.2, 0, false);
    c.setLookAt(...OVERVIEW, true);
  }, [controlsRef]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (activeStation && STATIONS[activeStation]) {
      c.setLookAt(...STATIONS[activeStation].view, true);
      // Shift the subject toward the left half — the panel covers the right.
      c.setFocalOffset(1.05, 0, 0, true);
    } else {
      c.setFocalOffset(0, 0, 0, true);
      c.setLookAt(...OVERVIEW, true);
    }
  }, [activeStation, controlsRef]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.55}
      minDistance={3.5}
      maxDistance={19}
      minPolarAngle={0.35}
      maxPolarAngle={1.35}
      truckSpeed={0}
    />
  );
}

/* ─── Error boundary: WebGL failure → fall back to classic ─── */
class WorldErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ─── Scene ─── */
function Scene({ activeStation, onOpen, controlsRef, theme }) {
  const [hovered, setHovered] = useState(null);
  const wp = WORLD[theme] || WORLD.light;
  return (
    <>
      {/* Sky/ground bounce gives the models rounded, believable shading
          instead of the flat wash a single ambient produces. */}
      <hemisphereLight
        intensity={wp.ambient * 0.75}
        color={wp.skyLight}
        groundColor={wp.bounce}
      />
      <ambientLight intensity={wp.ambient * 0.35} />
      <directionalLight
        castShadow
        position={[6, 11, 5]}
        intensity={wp.sun}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Cool rim from behind-left to separate silhouettes from the ground. */}
      <directionalLight
        position={[-7, 5, -4]}
        intensity={wp.rim}
        color={wp.rimColor}
      />

      <Island wp={wp} />
      <Sparkles
        count={70}
        scale={[13, 5, 13]}
        position={[0, 2.4, 0]}
        size={1.8}
        speed={0.25}
        opacity={0.5}
        color={wp.sparkle}
      />

      <Station
        id="about"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={3.15}
      >
        <DnaCenterpiece />
      </Station>
      <Station
        id="education"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={3.7}
      >
        <Float speed={1.6} rotationIntensity={0} floatIntensity={0.12}>
          <SatherTower />
        </Float>
      </Station>
      <Station
        id="experience"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={3.15}
      >
        <Buildings />
      </Station>
      <Station
        id="projects"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={1.35}
      >
        <Laptop />
      </Station>
      <Station
        id="publications"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={1.35}
      >
        <DoeLibrary />
      </Station>
      <Station
        id="ventures"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={2.1}
      >
        <GolfGreen />
      </Station>
      <Station
        id="contact"
        hovered={hovered}
        setHovered={setHovered}
        onOpen={onOpen}
        labelY={1.9}
      >
        <Mailbox />
      </Station>

      <CameraRig activeStation={activeStation} controlsRef={controlsRef} />
    </>
  );
}

/* ─── Root ─── */
export default function World3D({
  activeStation,
  onOpenStation,
  onExitWorld,
  theme = "light",
}) {
  const controlsRef = useRef(null);

  return (
    <div className="world-root" aria-label="Explorable 3D portfolio">
      <WorldErrorBoundary onFail={onExitWorld}>
        <Canvas
          shadows
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 42, position: [0, 15, 24], near: 0.1, far: 120 }}
          onCreated={(state) => {
            // Runtime context loss can't reach the error boundary either —
            // bail to the classic view if the GPU drops us.
            state.gl.domElement.addEventListener(
              "webglcontextlost",
              (e) => {
                e.preventDefault();
                onExitWorld?.();
              },
              { once: true },
            );
          }}
        >
          <Suspense fallback={null}>
            <Scene
              activeStation={activeStation}
              onOpen={onOpenStation}
              controlsRef={controlsRef}
              theme={theme}
            />
          </Suspense>
        </Canvas>
      </WorldErrorBoundary>

      {/* Station dock — keyboard-reachable navigation */}
      <nav
        className={`world-dock ${activeStation ? "world-dock-shifted" : ""}`}
        aria-label="Sections"
      >
        {Object.entries(STATIONS).map(([key, s]) => (
          <button
            key={key}
            type="button"
            className={`world-dock-btn ${activeStation === key ? "world-dock-btn-on" : ""}`}
            onClick={() => onOpenStation(activeStation === key ? null : key)}
          >
            {s.title}
          </button>
        ))}
      </nav>

      <button type="button" className="world-exit" onClick={onExitWorld}>
        Leave the world →
      </button>

      <div className="world-hint" aria-hidden="true">
        drag to orbit · click a station
      </div>
    </div>
  );
}
