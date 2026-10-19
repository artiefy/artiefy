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

/** Box the nodes are scattered in, in world units (camera starts at z = 12). */
const LANDSCAPE_VOLUME = { x: 17, y: 9.5, zMin: -24, zMax: 6 } as const;
/** Taller and narrower, so a phone held upright still sees the whole net. */
const PORTRAIT_VOLUME = { x: 7.5, y: 15, zMin: -24, zMax: 6 } as const;
/** Nearest neighbours each node tries to link to, and how far it reaches. */
const LINKS_PER_NODE = 3;
const MAX_LINK_DISTANCE = 5.2;
const FADE_NEAR = 10;
const FADE_FAR = 48;

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
  /** Shape the volume for an upright phone screen. */
  portrait?: boolean;
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
    nodeCount,
    pulseCount,
    seed = 7,
    portrait = false,
  }: NeuralNetworkOptions) {
    const VOLUME = portrait ? PORTRAIT_VOLUME : LANDSCAPE_VOLUME;
    const random = createRandom(seed);

    this.base = new Float32Array(nodeCount * 3);
    this.drift = new Float32Array(nodeCount * 3);
    this.baseSizes = new Float32Array(nodeCount);
    this.glow = new Float32Array(nodeCount);

    // Stratified placement: split the volume into a grid with at least one
    // cell per node and drop each node at a random spot inside its own cell.
    // Pure random placement clumped nodes into dense knots; this spreads them
    // evenly while still looking organic.
    const size = {
      x: VOLUME.x * 2,
      y: VOLUME.y * 2,
      z: VOLUME.zMax - VOLUME.zMin,
    };
    const cellEdge = Math.cbrt((size.x * size.y * size.z) / nodeCount);
    const grid = {
      x: Math.max(1, Math.round(size.x / cellEdge)),
      y: Math.max(1, Math.round(size.y / cellEdge)),
      z: Math.max(1, Math.round(size.z / cellEdge)),
    };
    while (grid.x * grid.y * grid.z < nodeCount) grid.x += 1;

    const cells = Array.from(
      { length: grid.x * grid.y * grid.z },
      (_, index) => index
    );
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cells[i], cells[j]] = [cells[j]!, cells[i]!];
    }

    for (let i = 0; i < nodeCount; i++) {
      const cell = cells[i]!;
      const cx = cell % grid.x;
      const cy = Math.floor(cell / grid.x) % grid.y;
      const cz = Math.floor(cell / (grid.x * grid.y));
      // Stay away from the cell walls so neighbours never touch.
      const jitter = () => 0.15 + random() * 0.7;
      const x = -VOLUME.x + ((cx + jitter()) / grid.x) * size.x;
      const y = -VOLUME.y + ((cy + jitter()) / grid.y) * size.y;
      const z = VOLUME.zMin + ((cz + jitter()) / grid.z) * size.z;

      this.base.set([x, y, z], i * 3);
      this.drift.set(
        [0.35 + random() * 0.6, 0.08 + random() * 0.14, random() * Math.PI * 2],
        i * 3
      );
      this.baseSizes[i] = 0.7 + random() * 0.9;
    }

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
        if (distance <= MAX_LINK_DISTANCE) nearest.push({ index: j, distance });
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
        linkAlphas[link * 2 + end] = 0.32 + this.glow[node]! * 0.55;
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

    this.root.rotation.y = Math.sin(elapsed * 0.04) * 0.3;
    this.root.rotation.x = Math.sin(elapsed * 0.03) * 0.08;

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
