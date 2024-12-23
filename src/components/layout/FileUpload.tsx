"use client";

import { type ChangeEvent } from "react";
import { type FileUploadProps } from "~/types";

export default function FileUpload({
  setFileAction,
  setUploadProgressAction,
}: FileUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFileAction(files[0]);
      // Simular progreso de carga
      setUploadProgressAction(50); // Puedes ajustar esto según tu lógica de carga
    }
  };

  return (
    <div className="mb-4 w-full">
      <style jsx>{`
        input[type="file"]::file-selector-button {
          background-color: green;
          border: 1px solid black;
          color: var(--primary);
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        input[type="file"]::file-selector-button:hover {
          color: white;
        }
      `}</style>
      <input
        id="file"
        type="file"
        onChange={handleFileChange}
        accept="image/png, image/jpeg, video/mp4"
        className="w-full rounded border border-primary p-2"
      />
    </div>
  );
}
