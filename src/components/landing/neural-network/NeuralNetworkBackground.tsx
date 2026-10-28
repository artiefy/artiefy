'use client';

import { useEffect, useRef, useState } from 'react';

import { PerformanceMonitor, Sparkles } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';

import { NETWORK_CAMERA, NeuralNetwork } from './NeuralNetwork';

/** Point the camera looks at: the middle of the network's depth. */
const LOOK_AT_Z = -6;
const CAMERA_START_Z = NETWORK_CAMERA.z;
/** How far the camera travels into the network over the whole page scroll. */
const SCROLL_DOLLY = 7;

interface Environment {
  webgl: boolean;
  reducedMotion: boolean;
  /** Phones get a lighter network. */
  compact: boolean;
}

/** Width over height of the window the network is first laid out for. */
const viewportAspect = () =>
  window.innerWidth / Math.max(window.innerHeight, 1);

function readEnvironment(): Environment {
  let webgl = false;
  try {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl2') ?? probe.getContext('webgl');
    webgl = context !== null;
    // Hand the probe context back: browsers cap how many can be alive.
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }

  return {
    webgl,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches,
    compact: window.matchMedia('(max-width: 767px)').matches,
  };
}

function NetworkScene({
  travel,
  compact,
}: {
  /** Fly the camera with scroll and pointer; off under reduced motion. */
  travel: boolean;
  compact: boolean;
}) {
  const [network] = useState(
    () =>
      new NeuralNetwork(
        compact
          ? { nodeCount: 60, pulseCount: 6, aspect: viewportAspect() }
          : { nodeCount: 120, pulseCount: 12, aspect: viewportAspect() }
      )
  );
  // Pointer in [-1, 1] and page scroll in [0, 1], written by window listeners
  // and read every frame without re-rendering.
  const motion = useRef({ pointerX: 0, pointerY: 0, scroll: 0 });

  useEffect(() => () => network.dispose(), [network]);

  useEffect(() => {
    if (!travel) return;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      motion.current.scroll = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    const readPointer = (event: PointerEvent) => {
      motion.current.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      motion.current.pointerY = 1 - (event.clientY / window.innerHeight) * 2;
    };

    readScroll();
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    window.addEventListener('pointermove', readPointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
      window.removeEventListener('pointermove', readPointer);
    };
  }, [travel]);

  useFrame((state, delta) => {
    network.setPixelRatio(state.viewport.dpr);
    network.update(state.clock.elapsedTime, delta);
    if (!travel) return;

    // Scrolling flies the camera into the network; the pointer adds a slight
    // parallax, so nodes in front and behind visibly slide past each other.
    const { pointerX, pointerY, scroll } = motion.current;
    const { camera } = state;
    camera.position.x = MathUtils.damp(
      camera.position.x,
      pointerX * 1.4,
      2,
      delta
    );
    camera.position.y = MathUtils.damp(
      camera.position.y,
      pointerY * 0.8 - scroll * 2,
      2,
      delta
    );
    camera.position.z = MathUtils.damp(
      camera.position.z,
      CAMERA_START_Z - scroll * SCROLL_DOLLY,
      2,
      delta
    );
    camera.lookAt(0, 0, LOOK_AT_Z);
  });

  return <primitive object={network.root} />;
}

/**
 * Full-screen 3D neural network behind the landing page. Decorative only:
 * hidden from assistive tech, ignores pointer events and renders nothing
 * without WebGL. Under reduced motion the slow drift stays (an ambient loop,
 * like the header's neon beam) but the camera no longer travels.
 */
export default function NeuralNetworkBackground() {
  const [environment] = useState(readEnvironment);
  const [dpr, setDpr] = useState(1.5);
  const [isReady, setIsReady] = useState(false);

  if (!environment.webgl) return null;

  return (
    <div
      aria-hidden="true"
      className={`
        pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000
        ease-out
        ${isReady ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <Canvas
        dpr={dpr}
        camera={{
          position: [0, 0, CAMERA_START_Z],
          fov: NETWORK_CAMERA.fov,
          near: 0.1,
          far: 60,
        }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        }}
        onCreated={() => setIsReady(true)}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <NetworkScene
          travel={!environment.reducedMotion}
          compact={environment.compact}
        />
        {/* Fine dust deep in the scene adds a third depth layer. */}
        <Sparkles
          count={environment.compact ? 15 : 30}
          scale={[34, 20, 26]}
          position={[0, 0, -8]}
          size={2.2}
          speed={0.18}
          opacity={0.35}
          noise={0.6}
          color="#67e8f9"
        />
      </Canvas>
    </div>
  );
}
