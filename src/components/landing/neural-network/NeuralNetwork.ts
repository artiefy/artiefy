import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineSegments,
  Points,
  ShaderMaterial,
} from 'three';

// Nodes and pulses share one soft round sprite. Size shrinks with depth and
// both ends of the depth range fade out, so the network reads as a volume:
// far nodes dissolve into the background and nodes the camera passes through
// vanish instead of filling the screen.
const POINT_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vDepth;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vDepth = -mvPosition.z;
    gl_PointSize = min(
      aSize * uScale * uPixelRatio / max(vDepth, 0.1),
      48.0 * uPixelRatio
    );
    vAlpha = aAlpha;
  }
`;

const POINT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uNear;
  uniform float uFar;
  varying float vAlpha;
  varying float vDepth;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    // A crisp core inside a soft halo, like a lit synapse.
    float halo = 1.0 - smoothstep(0.0, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.16, dist);
    float depthFade =
      (1.0 - smoothstep(uNear, uFar, vDepth)) * smoothstep(1.0, 4.0, vDepth);
    gl_FragColor =
      vec4(uColor, (halo * halo * 0.55 + core) * vAlpha * depthFade);
    #include <colorspace_fragment>
  }
`;

const LINK_VERTEX = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  varying float vDepth;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vDepth = -mvPosition.z;
    vAlpha = aAlpha;
  }
`;

const LINK_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uNear;
  uniform float uFar;
  varying float vAlpha;
  varying float vDepth;

  void main() {
    float depthFade =
      (1.0 - smoothstep(uNear, uFar, vDepth)) * smoothstep(1.0, 4.0, vDepth);
    gl_FragColor = vec4(uColor, vAlpha * depthFade);
    #include <colorspace_fragment>
  }
`;

/** Camera the network is laid out for; `NeuralNetworkBackground` uses it. */
export const NETWORK_CAMERA = { z: 12, fov: 55 } as const;
/** Depth span of the nodes, in world units along z. */
const DEPTH = { near: 4, far: -38 } as const;
/** Depth layers of the layout grid; more layers read as more depth. */
const DEPTH_LAYERS = 7;
/** Spread a little past the screen edges so parallax never shows a border. */
const OVERSCAN = 1.25;
/** Nearest neighbours each node tries to link to; kept low to avoid clutter. */
const LINKS_PER_NODE = 1;
/** Longest link, in grid cells at that node's depth. */
const MAX_LINK_CELLS = 1.6;
/** Resting link opacity; a node lit by a signal brightens its links. */
const LINK_ALPHA = 0.2;
const FADE_NEAR = 10;
const FADE_FAR = 58;

const COLORS = {
  node: '#7ee7f2',
  link: '#22c4d3',
  pulse: '#e6fcff',
} as const;

export interface NeuralNetworkOptions {
  nodeCount: number;
  pulseCount: number;
  /** Same seed, same network: the layout never jumps between visits. */
  seed?: number;
  /** Viewport width / height, so every depth layer covers the whole screen. */
  aspect: number;
}

/** Small deterministic PRNG (mulberry32), so the layout is reproducible. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createPointMaterial(color: string, scale: number) {
  return new ShaderMaterial({
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    uniforms: {
      uColor: { value: new Color(color) },
      uScale: { value: scale },
      uPixelRatio: { value: 1 },
      uNear: { value: FADE_NEAR },
      uFar: { value: FADE_FAR },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/**
 * A slowly drifting 3D graph of "neurons": nodes linked to their nearest
 * neighbours, with signals that travel from node to node and make each node
 * they reach flare up. Plain three.js, so it stays testable and framework
 * agnostic; `NeuralNetworkBackground` mounts `root` and calls `update`.
 */
export class NeuralNetwork {
  readonly root = new Group();

  private readonly base: Float32Array;
  /** Per node: drift amplitude, speed and phase. */
  private readonly drift: Float32Array;
  private readonly baseSizes: Float32Array;
  private readonly glow: Float32Array;
  /** Node index pairs, two entries per link. */
  private readonly links: Uint16Array;
  /** Link indices touching each node, used to route the signals. */
  private readonly adjacency: number[][];

  private readonly pulseLink: Int32Array;
  /** 1 when a signal travels from the link's second node to its first. */
  private readonly pulseReversed: Uint8Array;
  private readonly pulseProgress: Float32Array;
  private readonly pulseSpeed: Float32Array;

  private readonly nodeGeometry = new BufferGeometry();
  private readonly linkGeometry = new BufferGeometry();
  private readonly pulseGeometry = new BufferGeometry();
  private readonly nodeMaterial = createPointMaterial(COLORS.node, 105);
  private readonly pulseMaterial = createPointMaterial(COLORS.pulse, 120);
  private readonly linkMaterial = new ShaderMaterial({
    vertexShader: LINK_VERTEX,
    fragmentShader: LINK_FRAGMENT,
    uniforms: {
      uColor: { value: new Color(COLORS.link) },
      uNear: { value: FADE_NEAR },
      uFar: { value: FADE_FAR },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  constructor({
    nodeCount: targetCount,
    pulseCount,
    seed = 7,
    aspect,
  }: NeuralNetworkOptions) {
    const random = createRandom(seed);

    // The camera sees a pyramid, not a box: a box leaves the edges empty up
    // close and piles nodes into the middle far away. So the layout is a grid
    // in screen space, one node per cell at a random spot inside it, mapped
    // onto the view pyramid. Every depth layer then covers the whole screen
    // evenly, and near and far layers slide past each other with parallax.
    const perLayer = targetCount / DEPTH_LAYERS;
    const columns = Math.max(2, Math.round(Math.sqrt(perLayer * aspect)));
    const rows = Math.max(2, Math.round(perLayer / columns));
    const count = columns * rows * DEPTH_LAYERS;
    const tanHalfFov = Math.tan(((NETWORK_CAMERA.fov / 2) * Math.PI) / 180);
    const halfHeightAt = (z: number) =>
      tanHalfFov * (NETWORK_CAMERA.z - z) * OVERSCAN;

    this.base = new Float32Array(count * 3);
    this.drift = new Float32Array(count * 3);
    this.baseSizes = new Float32Array(count);
    this.glow = new Float32Array(count);
    const linkReach = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const column = i % columns;
      const row = Math.floor(i / columns) % rows;
      const layer = Math.floor(i / (columns * rows));
      // Stay away from the cell walls so neighbours never touch.
      const jitter = () => 0.15 + random() * 0.7;
      const z =
        DEPTH.near +
        ((layer + jitter()) / DEPTH_LAYERS) * (DEPTH.far - DEPTH.near);
      const halfHeight = halfHeightAt(z);
      const halfWidth = halfHeight * aspect;
      const x = -halfWidth + ((column + jitter()) / columns) * halfWidth * 2;
      const y = -halfHeight + ((row + jitter()) / rows) * halfHeight * 2;

      this.base.set([x, y, z], i * 3);
      this.drift.set(
        [0.35 + random() * 0.6, 0.08 + random() * 0.14, random() * Math.PI * 2],
        i * 3
      );
      this.baseSizes[i] = 0.7 + random() * 0.9;
      // Cells grow with depth, so far nodes may reach further to link.
      linkReach[i] = ((halfHeight * 2) / rows) * MAX_LINK_CELLS;
    }
    // The grid rounds the requested count to whole rows and columns.
    const nodeCount = count;

    const linkPairs: number[] = [];
    const seen = new Set<number>();
    for (let i = 0; i < nodeCount; i++) {
      const nearest: { index: number; distance: number }[] = [];
      for (let j = 0; j < nodeCount; j++) {
        if (j === i) continue;
        const dx = this.base[i * 3]! - this.base[j * 3]!;
        const dy = this.base[i * 3 + 1]! - this.base[j * 3 + 1]!;
        const dz = this.base[i * 3 + 2]! - this.base[j * 3 + 2]!;
        const distance = Math.hypot(dx, dy, dz);
        if (distance <= linkReach[i]!) nearest.push({ index: j, distance });
      }
      nearest.sort((a, b) => a.distance - b.distance);
      for (const { index } of nearest.slice(0, LINKS_PER_NODE)) {
        const key = Math.min(i, index) * nodeCount + Math.max(i, index);
        if (seen.has(key)) continue;
        seen.add(key);
        linkPairs.push(i, index);
      }
    }
    this.links = new Uint16Array(linkPairs);
    const linkCount = this.links.length / 2;

    this.adjacency = Array.from({ length: nodeCount }, () => []);
    for (let link = 0; link < linkCount; link++) {
      this.adjacency[this.links[link * 2]!]!.push(link);
      this.adjacency[this.links[link * 2 + 1]!]!.push(link);
    }

    const signals = linkCount > 0 ? pulseCount : 0;
    this.pulseLink = new Int32Array(signals);
    this.pulseReversed = new Uint8Array(signals);
    this.pulseProgress = new Float32Array(signals);
    this.pulseSpeed = new Float32Array(signals);
    for (let p = 0; p < signals; p++) {
      this.pulseLink[p] = Math.floor(random() * linkCount);
      this.pulseReversed[p] = random() < 0.5 ? 1 : 0;
      this.pulseProgress[p] = random();
      this.pulseSpeed[p] = 0.22 + random() * 0.35;
    }

    this.nodeGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(nodeCount * 3), 3)
    );
    this.nodeGeometry.setAttribute(
      'aSize',
      new BufferAttribute(new Float32Array(nodeCount), 1)
    );
    this.nodeGeometry.setAttribute(
      'aAlpha',
      new BufferAttribute(new Float32Array(nodeCount), 1)
    );

    this.linkGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(linkCount * 6), 3)
    );
    this.linkGeometry.setAttribute(
      'aAlpha',
      new BufferAttribute(new Float32Array(linkCount * 2), 1)
    );

    this.pulseGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(signals * 3), 3)
    );
    this.pulseGeometry.setAttribute(
      'aSize',
      new BufferAttribute(new Float32Array(signals).fill(1.5), 1)
    );
    this.pulseGeometry.setAttribute(
      'aAlpha',
      new BufferAttribute(new Float32Array(signals).fill(1), 1)
    );

    const nodes = new Points(this.nodeGeometry, this.nodeMaterial);
    const linkLines = new LineSegments(this.linkGeometry, this.linkMaterial);
    const pulses = new Points(this.pulseGeometry, this.pulseMaterial);
    // Every vertex moves each frame, so bounding volumes would go stale.
    for (const object of [nodes, linkLines, pulses]) {
      object.frustumCulled = false;
      this.root.add(object);
    }

    // Lay out the first frame before the render loop starts.
    this.update(0, 0);
  }

  setPixelRatio(pixelRatio: number) {
    this.nodeMaterial.uniforms.uPixelRatio!.value = pixelRatio;
    this.pulseMaterial.uniforms.uPixelRatio!.value = pixelRatio;
  }

  /** Advances the drift and the signals; `delta` is the frame time in seconds. */
  update(elapsed: number, delta: number) {
    const step = Math.min(delta, 0.05);
    const nodePositions = this.nodeGeometry.attributes.position!
      .array as Float32Array;
    const nodeSizes = this.nodeGeometry.attributes.aSize!.array as Float32Array;
    const nodeAlphas = this.nodeGeometry.attributes.aAlpha!
      .array as Float32Array;

    for (let i = 0; i < this.baseSizes.length; i++) {
      const i3 = i * 3;
      const amplitude = this.drift[i3]!;
      const angle = elapsed * this.drift[i3 + 1]! + this.drift[i3 + 2]!;
      nodePositions[i3] = this.base[i3]! + Math.sin(angle) * amplitude;
      nodePositions[i3 + 1] =
        this.base[i3 + 1]! + Math.cos(angle * 0.8 + 1.3) * amplitude;
      nodePositions[i3 + 2] =
        this.base[i3 + 2]! + Math.sin(angle * 0.6 + 0.4) * amplitude * 1.4;

      const glow = Math.max(0, this.glow[i]! - step * 1.1);
      this.glow[i] = glow;
      nodeSizes[i] = this.baseSizes[i]! * (1 + glow * 0.9);
      nodeAlphas[i] = 0.75 + glow * 0.25;
    }

    const linkPositions = this.linkGeometry.attributes.position!
      .array as Float32Array;
    const linkAlphas = this.linkGeometry.attributes.aAlpha!
      .array as Float32Array;
    for (let link = 0; link < this.links.length / 2; link++) {
      for (let end = 0; end < 2; end++) {
        const node = this.links[link * 2 + end]!;
        linkPositions.set(
          nodePositions.subarray(node * 3, node * 3 + 3),
          (link * 2 + end) * 3
        );
        linkAlphas[link * 2 + end] = LINK_ALPHA + this.glow[node]! * 0.45;
      }
    }

    const pulsePositions = this.pulseGeometry.attributes.position!
      .array as Float32Array;
    for (let p = 0; p < this.pulseLink.length; p++) {
      let progress = this.pulseProgress[p]! + step * this.pulseSpeed[p]!;
      while (progress >= 1) {
        progress -= 1;
        this.routePulse(p);
      }
      this.pulseProgress[p] = progress;

      const link = this.pulseLink[p]!;
      const reversed = this.pulseReversed[p] === 1;
      const from = this.links[link * 2 + (reversed ? 1 : 0)]! * 3;
      const to = this.links[link * 2 + (reversed ? 0 : 1)]! * 3;
      for (let axis = 0; axis < 3; axis++) {
        const start = nodePositions[from + axis]!;
        pulsePositions[p * 3 + axis] =
          start + (nodePositions[to + axis]! - start) * progress;
      }
    }

    // A gentle sway only: a wide turn tipped the whole net to one side.
    this.root.rotation.y = Math.sin(elapsed * 0.04) * 0.06;
    this.root.rotation.x = Math.sin(elapsed * 0.03) * 0.04;

    this.nodeGeometry.attributes.position!.needsUpdate = true;
    this.nodeGeometry.attributes.aSize!.needsUpdate = true;
    this.nodeGeometry.attributes.aAlpha!.needsUpdate = true;
    this.linkGeometry.attributes.position!.needsUpdate = true;
    this.linkGeometry.attributes.aAlpha!.needsUpdate = true;
    this.pulseGeometry.attributes.position!.needsUpdate = true;
  }

  /** The signal reached the end of its link: light that node and move on. */
  private routePulse(pulse: number) {
    const link = this.pulseLink[pulse]!;
    const reversed = this.pulseReversed[pulse] === 1;
    const arrived = this.links[link * 2 + (reversed ? 0 : 1)]!;
    this.glow[arrived] = 1;

    const options = this.adjacency[arrived]!.filter((next) => next !== link);
    const next =
      options.length > 0
        ? options[Math.floor(Math.random() * options.length)]!
        : link;
    this.pulseLink[pulse] = next;
    // Leave from the node just reached, whichever end of the link it is.
    this.pulseReversed[pulse] = this.links[next * 2] === arrived ? 0 : 1;
  }

  dispose() {
    this.nodeGeometry.dispose();
    this.linkGeometry.dispose();
    this.pulseGeometry.dispose();
    this.nodeMaterial.dispose();
    this.linkMaterial.dispose();
    this.pulseMaterial.dispose();
  }
}
