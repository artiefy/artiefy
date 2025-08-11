// pages/viewFiles.tsx
import { useEffect, useState } from "react";

import Link from "next/link";

import { Icons } from "~/components/educators/ui/icons";

// Función para obtener el icono de un archivo basado en su extensión
const getIconForFileType = (fileName: string) => {
  if (fileName === null || fileName === "") return <Icons.txt />;
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return <Icons.pdf className="size-8" />;
    case "docx":
    case "doc":
      return <Icons.word className="size-8" />;
    case "xlsx":
    case "xls":
      return <Icons.excel className="size-8" />;
    case "pptx":
    case "ppt":
      return <Icons.powerPoint className="size-8" />;
    default:
      return <Icons.txt className="size-8" />;
  }
};

// Interfaz para los archivos
interface FilesModels {
  key: string;
  fileName: string;
}

// Interfaz para los nombres de los archivos
interface LessonsModels {
  resourceNames: string;
}

// Propiedades del componente para la vista de archivos
interface ViewFilesProps {
  lessonId: number;
  selectedColor: string;
}

const VerFileByStudent = ({ lessonId, selectedColor }: ViewFilesProps) => {
  const [files, setFiles] = useState<FilesModels[]>([]); // Estado para los archivos
  const [lessonFileName, setLessonFileName] = useState<LessonsModels | null>(
    null,
  ); // Estado para los nombres de los archivos
  const [loading, setLoading] = useState(true); // Estado para el estado de carga
  const [error, setError] = useState<string | null>(null); // Estado para el error
  const [loadingNames, setLoadingNames] = useState(true); // Estado para el estado de carga
  const [errorNames, setErrorNames] = useState<string | null>(null); // Estado para el error

  // Convertimos el lessonId a número
  const lessonIdNumber = Number(lessonId);
  useEffect(() => {
    localStorage.getItem(`selectedColor_${lessonId}`);
  }, [lessonId, lessonIdNumber]);

  // Efecto para obtener los archivos de la api route enlazados a la leccion
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(
          `/api/educadores/getFiles?lessonId=${lessonIdNumber}`,
        );
        if (!res.ok) {
          throw new Error("Error al obtener los archivos");
        }

        const data = (await res.json()) as FilesModels[];
        if (Array.isArray(data)) {
          const files = data.filter((file: { key: string }) => file.key); // Filtrar claves vacías y nombres vacíos
          setFiles(files); // Extraer claves y nombres de los archivos
          console.log("Archivos:", files); // Verificar los archivos
        } else {
          setError("Datos incorrectos recibidos de la API");
        }
      } catch (err) {
        console.error("Error en la solicitud de archivos:", err);
        setError("Hubo un problema al cargar los archivos");
      } finally {
        setLoading(false);
      }
    };

    // Llamada a la función para obtener los archivos
    fetchFiles().catch((err) => console.error("Error fetching files:", err));
  }, [lessonId, lessonIdNumber]);

  // Efecto para obtener los nombres de los archivos de la api route enlazados a la leccion
  useEffect(() => {
    const fetchFilesName = async () => {
      try {
        const respuestaName = await fetch(
          `/api/educadores/lessons/${lessonIdNumber}`,
        );
        if (!respuestaName.ok) {
          throw new Error("Error al obtener los nombres de los archivos");
        }

        const dataName: LessonsModels =
          (await respuestaName.json()) as LessonsModels;
        console.log("Datos recibidos de los name source:", dataName); // Verificar los datos recibidos
        if (dataName) {
          setLessonFileName(dataName); // Extraer claves y nombres de los archivos
        } else {
          setErrorNames(
            "Datos incorrectos recibidos de la API name Files sources",
          );
        }
      } catch (err) {
        console.error("Error en la solicitud del nombre de los archivos:", err);
        setErrorNames("Hubo un problema al cargar el nombre de los archivos");
      } finally {
        setLoadingNames(false);
      }
    };

    fetchFilesName().catch((err) =>
      console.error("Error fetching files:", err),
    );
  }, [lessonId, lessonIdNumber]);

  // Verificar si hay archivos
  if (loading) {
    return <div>Cargando archivos...</div>;
  }
  // Verificar si hay nombres de archivos
  if (loadingNames) {
    return <div>Cargando nombre de archivos...</div>;
  }
  // Verificar si no hay archivos
  if (files.length === 0) {
    return <div>No hay archivos disponibles</div>;
  }

  // Verificar si hay errores
  if (error) {
    return <div>{error}</div>;
  }
  // Verificar si hay errores en los nombres
  if (errorNames) {
    return <div>{errorNames}</div>;
  }

  // Retorno de la vista del componente
  return (
    <div className="mt-6">
      <h1
        className={`mb-4 text-2xl font-bold ${selectedColor === "#FFFFFF" ? "text-black" : "text-white"}`}
      >
        Archivos de la clase
      </h1>
      <ul className="grid grid-cols-1 gap-5">
        {files.map((file, index) => {
          if (!file) return null; // Manejar caso de clave vacía
          const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${file.key}`; // URL de S3
          const icon = getIconForFileType(file.fileName); // Icono basado en la extensión del archivo
          if (lessonFileName !== null) {
            const resourceNames = lessonFileName.resourceNames.split(","); // Separar resourceNames por comas

            return (
              <Link
                key={index}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mb-3 flex h-11 w-full space-x-2 rounded-lg border border-gray-600/10 bg-slate-200/20 p-2 hover:bg-slate-200/40 lg:w-3/5"
              >
                {icon}

                <p
                  className={`no-underline hover:underline ${selectedColor === "#FFFFFF" ? "text-black" : "text-white"}`}
                >
                  {resourceNames[index] ?? file.fileName}
                  {/* Nombre del archivo */}
                </p>
              </Link>
            );
          } else {
            return (
              <Link
                key={index}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mb-3 flex h-11 w-full space-x-2 rounded-lg border border-gray-600/10 bg-slate-200/20 p-2 hover:bg-slate-200/40 lg:w-3/5"
              >
                {icon}

                <p
                  className={`no-underline hover:underline ${selectedColor === "#FFFFFF" ? "text-black" : "text-white"}`}
                >
                  {file.fileName}
                  {/* Nombre del archivo */}
                </p>
              </Link>
            );
          }
        })}
      </ul>
    </div>
  );
};

export default VerFileByStudent;
