"use client";

import { type ChangeEvent, useState } from "react";

type FileUploadProps = {
  setFileAction: (file: File | null) => void;
};

export default function FileUpload({ setFileAction }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFileAction(files[0]);
      setFileName(files[0].name);
    } else {
      setFileAction(null);
      setFileName(null);
    }
  };

  return (
    <div className="mb-4 w-full">
      <style jsx>{`
        input[type="file"]::file-selector-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        input[type="file"]::file-selector-button:hover {
          background-color: #0056b3;
        }

        input[type="file"] {
          font-size: 14px; /* Cambia el estilo del texto al lado del botón */
          color: #555;
          font-family: Arial, sans-serif;
        }
      `}</style>
      <input
        id="file"
        type="file"
        onChange={handleFileChange}
        accept="image/png, image/jpeg, video/mp4"
        className="w-full rounded border border-primary p-2"
      />
      {fileName && (
        <p className="mt-2 text-sm text-gray-600">
          Archivo seleccionado: {fileName}
        </p>
      )}
    </div>
  );
}
