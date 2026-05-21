'use client';

import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (content: string) => void;
  height?: string;
}

export default function SunEditorCDN({
  value,
  onChange,
  height = '200',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);
  const onChangeRef = useRef(onChange);
  const heightRef = useRef(height);
  const initialValueRef = useRef(value);

  // Mantener onChangeRef actualizado sin re-ejecutar el efecto de init
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Efecto de inicialización — solo corre una vez
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js';
    script.onload = () => {
      if (!containerRef.current) return;
      const textarea = containerRef.current.querySelector('textarea');
      if (!textarea) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      editorRef.current = win.SUNEDITOR.create(textarea, {
        height: heightRef.current,
        buttonList: [
          ['bold', 'italic', 'underline', 'strike'],
          ['fontSize', 'fontColor', 'hiliteColor'],
          ['align', 'list', 'table'],
          ['link', 'image', 'video'],
          ['removeFormat'],
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editorRef.current as any).onchange = (contents: string) => {
        onChangeRef.current(contents);
      };

      if (initialValueRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editorRef.current as any).setContents(initialValueRef.current);
      }
    };
    document.head.appendChild(script);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editorRef.current as any)?.destroy?.();
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // Sincronizar value externo → editor
  useEffect(() => {
    if (!editorRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (editorRef.current as any).getContents();
    if (current !== value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editorRef.current as any).setContents(value);
    }
  }, [value]);

  return (
    <div ref={containerRef}>
      <textarea style={{ display: 'none' }} defaultValue={value} />
    </div>
  );
}
