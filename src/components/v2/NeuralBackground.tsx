'use client';

import { useEffect, useRef } from 'react';

import * as THREE from 'three';

/**
 * Full-page animated neural-network background (Three.js / WebGL, vanilla).
 *
 * - Nodes fill a 3D jittered grid (X/Y/Z layers) sized larger than the camera
 *   frustum, so the net stays edge-to-edge AND has real depth. The whole group
 *   turns on all three axes at different slow speeds (bounded so it never spins
 *   far enough to clear the screen edges), giving a smooth volumetric rotation.
 * - Nodes are linked by 3D proximity into a volumetric mesh. Each line is drawn
 *   with a custom shader that FIRES like a real synapse: it lights up fast, sends
 *   a signal along the wire, then fades dark with a quiet gap before firing again.
 *   Every edge fires on its own random phase, so at any moment only some are lit —
 *   reading as live neural activity rather than constant flow.
 * - Rendered into a `fixed inset-0` canvas so it stays visible while the user
 *   scrolls the whole landing. Transparent clear color lets the page gradient
 *   show through.
 * - Performance: capped node/edge counts, lower DPR on mobile, RAF paused when
 *   the tab is hidden, and a single static frame when the user prefers reduced
 *   motion. Graceful no-op if WebGL is unavailable.
 *
 * Kept vanilla Three.js on purpose: a full-page imperative background needs no
 * React scene graph, so R3F/drei would only add deps and indirection here.
 */
export default function NeuralBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // --- Renderer (graceful fallback if WebGL is missing) ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const CAM_Z = 100;
    const FOV = 60;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      FOV,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = CAM_Z;

    const group = new THREE.Group();
    scene.add(group);

    // --- Soft radial glow sprite shared by the nodes ---
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 64;
    const gctx = glowCanvas.getContext('2d');
    if (gctx) {
      const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(58,244,239,0.85)');
      grad.addColorStop(1, 'rgba(58,244,239,0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 64, 64);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);

    // --- Even node distribution: 3D jittered grid, oversized vs the frustum ---
    // X/Y spread is derived from the visible frustum (+ margin) so the net keeps
    // reaching the screen edges even while the group rotates; Z gives real depth.
    const aspect = window.innerWidth / window.innerHeight;
    const halfH = Math.tan((FOV * Math.PI) / 180 / 2) * CAM_Z;
    const halfW = halfH * aspect;
    const SPREAD_X = halfW * 2 * 1.25;
    const SPREAD_Y = halfH * 2 * 1.25;
    const SPREAD_Z = 110; // deep volume for a strong 3D / parallax feel

    // Rotation amplitudes: as large as possible while keeping the net over the
    // screen edges AND never swinging a node up to the camera plane. Auto-limited
    // for wide aspects (large X-extent) so the volume rotation stays safe.
    const depthSafe = 0.6 * CAM_Z;
    const rotYMax = Math.min(
      0.62,
      Math.asin(Math.min(1, depthSafe / (SPREAD_X / 2)))
    );
    const rotXMax = Math.min(
      0.42,
      Math.asin(Math.min(1, depthSafe / (SPREAD_Y / 2)))
    );
    const rotZMax = 0.22;

    // Grid: a few depth layers, with in-plane cols/rows following the aspect.
    const gz = isMobile ? 2 : 4;
    const planeTarget = isMobile ? 16 : 24;
    const gx = Math.max(3, Math.round(Math.sqrt(planeTarget * aspect)));
    const gy = Math.max(3, Math.round(planeTarget / gx));
    const NODE_COUNT = gx * gy * gz;
    const cellX = SPREAD_X / gx;
    const cellY = SPREAD_Y / gy;
    const cellZ = SPREAD_Z / gz;

    const base = new Float32Array(NODE_COUNT * 3);
    const phase = new Float32Array(NODE_COUNT);
    let n = 0;
    for (let z = 0; z < gz; z++) {
      for (let r = 0; r < gy; r++) {
        for (let c = 0; c < gx; c++) {
          const jx = (Math.random() - 0.5) * 0.72; // up to ~±0.36 of a cell
          const jy = (Math.random() - 0.5) * 0.72;
          const jz = (Math.random() - 0.5) * 0.6;
          base[n * 3] = -SPREAD_X / 2 + (c + 0.5 + jx) * cellX;
          base[n * 3 + 1] = -SPREAD_Y / 2 + (r + 0.5 + jy) * cellY;
          base[n * 3 + 2] = -SPREAD_Z / 2 + (z + 0.5 + jz) * cellZ;
          phase[n] = Math.random() * Math.PI * 2;
          n++;
        }
      }
    }
    const live = new Float32Array(base);

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(live, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 2.4,
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0x3af4ef,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(nodeGeo, nodeMat);
    group.add(points);

    // --- Edges: link by 3D proximity into a volumetric mesh ---
    // Connect to nearest grid neighbours (orthogonal in X/Y/Z, mostly).
    const CONNECT = Math.max(cellX, cellY, cellZ) * 1.16;
    const CONNECT2 = CONNECT * CONNECT;
    const MAX_EDGES = 320;
    const edgeAList: number[] = [];
    const edgeBList: number[] = [];
    outer: for (let a = 0; a < NODE_COUNT; a++) {
      for (let b = a + 1; b < NODE_COUNT; b++) {
        const dx = base[a * 3] - base[b * 3];
        const dy = base[a * 3 + 1] - base[b * 3 + 1];
        const dz = base[a * 3 + 2] - base[b * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < CONNECT2) {
          edgeAList.push(a);
          edgeBList.push(b);
          if (edgeAList.length >= MAX_EDGES) break outer;
        }
      }
    }
    const edgeA = Int32Array.from(edgeAList);
    const edgeB = Int32Array.from(edgeBList);
    const edgeCount = edgeA.length;

    // Per-vertex shader attributes:
    //  - aProg: 0 at vertex A, 1 at vertex B -> interpolates to position-along-line
    //  - aSeed: same random per edge -> desyncs each line's firing phase + speed
    const linePos = new Float32Array(edgeCount * 6);
    const aProg = new Float32Array(edgeCount * 2);
    const aSeed = new Float32Array(edgeCount * 2);
    for (let e = 0; e < edgeCount; e++) {
      const s = Math.random();
      aProg[e * 2] = 0;
      aProg[e * 2 + 1] = 1;
      aSeed[e * 2] = s;
      aSeed[e * 2 + 1] = s;
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('aProg', new THREE.BufferAttribute(aProg, 1));
    lineGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));

    // Synaptic firing shader: each wire is mostly dark, then fires — lights up
    // fast, shoots a signal head A->B, fades out, waits, and fires again on its
    // own random phase. uBaseOpacity is tiny so "off" reads as truly off.
    const lineMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x1bd4ef) },
        uFireColor: { value: new THREE.Color(0x8af0ff) },
        uBaseOpacity: { value: 0.05 },
      },
      vertexShader: /* glsl */ `
        attribute float aProg;
        attribute float aSeed;
        varying float vProg;
        varying float vSeed;
        void main() {
          vProg = aProg;
          vSeed = aSeed;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uFireColor;
        uniform float uBaseOpacity;
        varying float vProg;
        varying float vSeed;
        void main() {
          // Per-edge firing cycle, each on its own phase + speed (slow, calm).
          float speed = 0.06 + vSeed * 0.13;
          float cyc = fract(uTime * speed + vSeed * 9.0);

          // Envelope: quick onset, short hold, fade off, long dark gap.
          float onset = smoothstep(0.0, 0.06, cyc);
          float off = 1.0 - smoothstep(0.18, 0.42, cyc);
          float fire = onset * off;

          // Very subtle slow shimmer while lit (organic, not a clean fade).
          fire *= 0.9 + 0.1 * sin(uTime * 8.0 * (0.5 + vSeed) + vSeed * 30.0);

          // Signal head travels the wire during the early firing window.
          float head = clamp(cyc / 0.22, 0.0, 1.0);
          float d = abs(vProg - head);
          float spark = smoothstep(0.16, 0.0, d) * fire;

          // Additive: near-dark wire when idle, bright when it fires.
          vec3 col = uBaseColor * uBaseOpacity
                   + uFireColor * fire * 0.85
                   + uFireColor * spark * 0.9;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    // --- Pointer parallax (kept small so the net stays edge-to-edge) ---
    const targetPointer = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      targetPointer.x = e.clientX / window.innerWidth - 0.5;
      targetPointer.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('mousemove', onMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // --- Animation ---
    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const step = (dt: number) => {
      elapsed += dt;
      lineMat.uniforms.uTime.value = elapsed;

      for (let i = 0; i < NODE_COUNT; i++) {
        const ph = phase[i];
        live[i * 3] = base[i * 3] + Math.sin(elapsed * 0.3 + ph) * 1.4;
        live[i * 3 + 1] = base[i * 3 + 1] + Math.cos(elapsed * 0.26 + ph) * 1.4;
        live[i * 3 + 2] = base[i * 3 + 2] + Math.sin(elapsed * 0.22 + ph) * 1.4;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      for (let e = 0; e < edgeCount; e++) {
        const a = edgeA[e] * 3;
        const b = edgeB[e] * 3;
        linePos[e * 6] = live[a];
        linePos[e * 6 + 1] = live[a + 1];
        linePos[e * 6 + 2] = live[a + 2];
        linePos[e * 6 + 3] = live[b];
        linePos[e * 6 + 4] = live[b + 1];
        linePos[e * 6 + 5] = live[b + 2];
      }
      if (edgeCount > 0) lineGeo.attributes.position.needsUpdate = true;
    };

    const draw = () => {
      // Smooth bounded rotation on all three axes (different speeds -> explores
      // many angles without ever spinning far enough to clear the screen edges).
      group.rotation.y = Math.sin(elapsed * 0.18) * rotYMax;
      group.rotation.x = Math.sin(elapsed * 0.13 + 1.2) * rotXMax;
      group.rotation.z = Math.sin(elapsed * 0.085 + 2.4) * rotZMax;
      camera.position.x += (targetPointer.x * 10 - camera.position.x) * 0.04;
      camera.position.y += (-targetPointer.y * 7 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };

    const frame = (now: number) => {
      const dt = last === 0 ? 0.016 : Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (prefersReduced) {
        step(0);
        draw();
        return;
      }
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!prefersReduced && raf === 0) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      nodeGeo.dispose();
      lineGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      glowTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
