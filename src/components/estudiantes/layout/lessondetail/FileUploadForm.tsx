import { useState } from "react";

import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";

import { Icons } from "~/components/estudiantes/ui/icons";

import type { Question } from "~/types";

import "~/styles/activityupload.css";

interface FileUploadFormProps {
  question: Question;
  activityId: number;
  userId: string;
  onSubmit: () => void;
}

export function FileUploadForm({
  question,
  activityId,
  userId,
  onSubmit,
}: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("activityId", activityId.toString());
    formData.append("questionId", question.id);

    try {
      const response = await fetch("/api/activities/uploadFile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir el archivo");
      }

      // Just check if response is ok, we don't need the data
      await response.json();
      toast.success("Archivo subido correctamente. Pendiente de revisión.");
      onSubmit();
    } catch (error) {
      toast.error("Error al subir el archivo");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">{question.text}</h3>

        <div className="upload-container">
          <div className="upload-header">
            <Upload className="h-16 w-16 text-blue-500" />
            <p>Arrastra y suelta tu archivo aquí</p>
            <p className="text-sm text-gray-500">o</p>
          </div>

          <label htmlFor="file-upload" className="upload-footer">
            <FileUp className="mr-2 h-5 w-5" />
            <p>{file ? file.name : "Seleccionar archivo"}</p>
          </label>

          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="upload-input"
            disabled={isUploading}
          />

          <button
            type="submit"
            disabled={!file || isUploading}
            className="upload-button"
          >
            {isUploading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4" />
                Subiendo...
              </>
            ) : (
              "Subir Documento"
            )}
          </button>
        </div>

        {question.parametros && (
          <p className="mt-4 text-sm text-gray-600">
            Parámetros: {question.parametros}
          </p>
        )}
      </div>
    </form>
  );
}
