import { useEffect, useRef, useState } from 'react';

import {
  ArcRotateCamera,
  Color3,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  Vector3,
  WebGPUEngine,
} from '@babylonjs/core';

export default function WebGPUBox() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [rendererType, setRendererType] = useState<string>('');

  useEffect(() => {
    let disposed = false;
    let engine: Engine | WebGPUEngine | null = null;
    let scene: Scene | null = null;
    let canvas: HTMLCanvasElement | null = null;

    async function setup() {
      if (!mountRef.current) return;

      // Prepara el canvas contenedor
      canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      canvas.style.width = '400px';
      canvas.style.height = '300px';
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(canvas);

      // Intenta WebGPU primero
      let useWebGPU = false;
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator === 'object' &&
        'gpu' in (navigator as unknown as { gpu?: unknown }) &&
        (navigator as unknown as { gpu?: unknown }).gpu !== undefined
      ) {
        try {
          const webgpuEngine = new WebGPUEngine(canvas, { antialias: true });
          await webgpuEngine.initAsync();
          engine = webgpuEngine;
          useWebGPU = true;
          setRendererType('WebGPU');
        } catch (error) {
          console.warn('WebGPU no disponible, usando WebGL fallback', error);
        }
      }

      // Fallback a WebGL
      if (!engine) {
        engine = new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
        });
        setRendererType(
          useWebGPU ? 'WebGPU (fallback a WebGL)' : 'WebGL (fallback)'
        );
      }

      scene = new Scene(engine);
      scene.clearColor = new Color3(0.95, 0.98, 1).toColor4();

      const camera = new ArcRotateCamera(
        'camera',
        Math.PI / 4,
        Math.PI / 4,
        4,
        Vector3.Zero(),
        scene
      );
      camera.attachControl(canvas, true);

      const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
      light.intensity = 0.9;

      const box = MeshBuilder.CreateBox('box', { size: 1 }, scene);
      box.position = new Vector3(0, 0, 0);

      engine.runRenderLoop(() => {
        if (disposed || !scene) return;
        box.rotation.y += 0.01;
        box.rotation.x += 0.008;
        scene.render();
      });

      const onResize = () => {
        engine?.resize();
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
      };
    }

    setup();

    return () => {
      disposed = true;
      if (scene) {
        scene.dispose();
      }
      if (engine) {
        engine.dispose();
      }
      canvas?.parentElement?.removeChild(canvas);
    };
  }, []);

  return (
    <div>
      <div ref={mountRef} />
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <b>Renderer activo:</b> {rendererType}
      </div>
    </div>
  );
}
