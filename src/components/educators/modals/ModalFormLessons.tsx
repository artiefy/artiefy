"use client";

import { useState, type ChangeEvent } from "react";
import FileUpload from "~/components/educators/layout/FilesUpload";
import { Button } from "~/components/educators/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/educators/ui/dialog";
import { Progress } from "~/components/educators/ui/progress";
import { toast } from "~/hooks/use-toast";

interface LessonsFormProps {
  uploading: boolean;
  isOpen: boolean;
  onCloseAction: () => void;
  courseId: number; // ID del curso relacionado
}

const ModalFormLessons = ({
  uploading,
  isOpen,
  onCloseAction,
  courseId,
}: LessonsFormProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 0,
    coverimage: undefined as File | undefined,
    covervideo: undefined as File | undefined,
    resourcefiles: [] as File[], // Array para múltiples archivos
    cover_image_key: "",
    cover_video_key: "",
    resource_keys: [] as string[],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    duration: false,
    cover_image_key: false,
    cover_video_key: false,
    resource_keys: false,
  });

  const [progress, setProgress] = useState(0);

  // Manejador de cambio para inputs
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof typeof formData,
  ) => {
    const value =
      field === "duration" ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Manejador de archivos
  const handleFileChange = (
    field: keyof typeof formData,
    file: File | File[] | null,
  ) => {
    if (file) {
      if (Array.isArray(file)) {
        const resourceKeys = file.map((f) => f.name); // Simular claves para los archivos
        setFormData((prev) => ({
          ...prev,
          resourcefiles: file,
          resource_keys: resourceKeys,
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: file }));
      }
    }
  };

  // Subida de archivos
  const uploadFile = async (file: File, index: number, totalFiles: number) => {
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Error al iniciar la carga: ${uploadResponse.statusText}`,
      );
    }

    const { url, fields } = await uploadResponse.json();

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === "string") {
        formData.append(key, value);
      }
    });
    formData.append("file", file);

    const uploadResult = await fetch(url, { method: "POST", body: formData });
    console.log("Form Data:", formData);
    if (!uploadResult.ok) {
      throw new Error(`Error al cargar el archivo: ${uploadResult.statusText}`);
    }
    const progress = Math.round(((index + 1) / totalFiles) * 100);
    setUploadProgress(progress); // Actualizamos el progreso
    return fields.key;
  };

  // Manejador del submit
  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const { coverimage, covervideo, resourcefiles } = formData;
      const resourceKeys: any[] = [];

      let coverImageKey = "";
      let coverVideoKey = "";
      const totalFiles = [coverimage, covervideo, ...resourcefiles].filter(
        Boolean,
      ).length;

      let currentIndex = 0;
      // Subir imagen de portada
      if (coverimage) {
        coverImageKey = await uploadFile(
          coverimage,
          currentIndex++,
          totalFiles,
        );
      }
      // Subir video de portada
      if (covervideo) {
        coverVideoKey = await uploadFile(
          covervideo,
          currentIndex++,
          totalFiles,
        );
      } // Subir archivos de recursos
      for (const file of resourcefiles) {
        const resourceKey = await uploadFile(file, currentIndex++, totalFiles);
        resourceKeys.push(resourceKey);
      }

      // Actualizar el estado con las claves de las imágenes y el video
      setFormData((prev) => ({
        ...prev,
        cover_image_key: coverImageKey,
        cover_video_key: coverVideoKey,
      }));

      // Validar campos después de establecer las claves de los archivos
      const newErrors = {
        title: !formData.title,
        description: !formData.description,
        duration: !formData.duration,
        cover_image_key: !coverImageKey,
        cover_video_key: !coverVideoKey,
        resource_keys: resourceKeys.length === 0,
      };

      console.log("Validando campos: ", formData);

      if (Object.values(newErrors).some((error) => error)) {
        setErrors(newErrors);
        toast({
          title: "Error",
          description: "Por favor completa los campos obligatorios.",
          variant: "destructive",
        });
        return;
      }

      const concatenatedResourceKeys = resourceKeys.join(",");

      const response = await fetch("/api/educadores/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          coverImageKey: coverImageKey,
          coverVideoKey: coverVideoKey,
          resourceKey: concatenatedResourceKeys,
          porcentajecompletado: 0,
          courseId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Lección creada",
          description: "La lección se creó con éxito.",
        });
        onCloseAction(); // Cierra el modal
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error ?? "Error al crear la lección.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al procesar la solicitud: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-5/6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mt-4">
          <DialogTitle className="text-4xl">Crear Clase</DialogTitle>
          <DialogDescription className="text-xl text-white">
            Llena los detalles para crear la nuevo clase
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-background px-6 text-black shadow-md">
          <label htmlFor="title" className="text-lg font-medium text-primary">
            Título
          </label>
          <input
            type="text"
            placeholder="Título"
            value={formData.title}
            onChange={(e) => handleInputChange(e, "title")}
            className={`mb-4 w-full rounded border p-2 text-black outline-none ${
              errors.title ? "border-red-500" : "border-primary"
            }`}
          />
          {errors.title && (
            <p className="text-sm text-red-500">Este campo es obligatorio.</p>
          )}

          <label
            htmlFor="description"
            className="text-lg font-medium text-primary"
          >
            Descripción
          </label>
          <textarea
            placeholder="Descripción"
            value={formData.description}
            onChange={(e) => handleInputChange(e, "description")}
            className={`mb-3 h-auto w-full rounded border p-2 text-black outline-none ${
              errors.description ? "border-red-500" : "border-primary"
            }`}
          />
          {errors.description && (
            <p className="text-sm text-red-500">Este campo es obligatorio.</p>
          )}
          <label
            htmlFor="duration"
            className="text-lg font-medium text-primary"
          >
            Duración (minutos)
          </label>
          <input
            type="number"
            placeholder="Duración"
            value={formData.duration}
            onChange={(e) => handleInputChange(e, "duration")}
            className={`mb-4 w-full rounded border p-2 text-black outline-none ${
              errors.duration ? "border-red-500" : "border-primary"
            }`}
          />
          {errors.duration && (
            <p className="text-sm text-red-500">Este campo es obligatorio.</p>
          )}
          <div className="grid w-full grid-cols-3 gap-4">
            <FileUpload
              key="coverimage"
              type="image"
              label="Imagen de portada:"
              accept="image/*"
              maxSize={5}
              required
              onFileChange={(file) =>
                handleFileChange("coverimage", file ?? null)
              }
            />
            <FileUpload
              key="covervideo"
              type="video"
              label="Video del curso:"
              accept="video/mp4"
              maxSize={2000}
              required
              onFileChange={(file) =>
                handleFileChange("covervideo", file ?? null)
              }
            />
            <FileUpload
              key="resourcefiles"
              type="file"
              label="Archivo del curso:"
              accept=".pdf,.docx,.pptx"
              maxSize={10}
              multiple
              onFileChange={(file) =>
                handleFileChange("resourcefiles", file ?? null)
              }
            />
          </div>
          {(uploading || isUploading) && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="mt-2 text-center text-sm text-gray-500">
                {uploadProgress}% Completado
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} variant="save" disabled={uploading}>
            {uploading ? "Subiendo..." : "Crear Clase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalFormLessons;
