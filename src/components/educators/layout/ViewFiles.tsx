// pages/viewFiles.tsx
import { useEffect, useState } from 'react';

import Link from 'next/link';

import { Icons } from '~/components/educators/ui/icons';

const getIconForFileType = (fileName: string) => {
  if (fileName === null || fileName === '') return <Icons.txt />;
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return <Icons.pdf className="size-16" />;
    case 'docx':
    case 'doc':
      return <Icons.word className="size-16" />;
    case 'xlsx':
    case 'xls':
      return <Icons.excel className="size-16" />;
    case 'pptx':
    case 'ppt':
      return <Icons.powerPoint className="size-16" />;
    default:
      return <Icons.txt className="size-16" />;
  }
};

interface FilesModels {
  key: string;
  fileName: string;
}

interface LessonsModels {
  resourceNames: string;
}

interface ViewFilesProps {
  lessonId: number;
  selectedColor: string;
}

const ViewFiles = ({ lessonId, selectedColor }: ViewFilesProps) => {
  const [files, setFiles] = useState<FilesModels[]>([]);
  const [lessonFileName, setLessonFileName] = useState<LessonsModels | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingNames, setLoadingNames] = useState(true);
  const [errorNames, setErrorNames] = useState<string | null>(null);

  const lessonIdNumber = Number(lessonId);
  useEffect(() => {
    localStorage.getItem(`selectedColor_${lessonId}`);
  }, [lessonId, lessonIdNumber]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(
          `/api/educadores/getFiles?lessonId=${lessonIdNumber}`
        );
        if (!res.ok) {
          throw new Error('Error al obtener los archivos');
        }

        const data = (await res.json()) as FilesModels[];
        if (Array.isArray(data)) {
          const files = data.filter((file: { key: string }) => file.key); // Filtrar claves vacías y nombres vacíos
          setFiles(files); // Extraer claves y nombres de los archivos
        } else {
          setError('Datos incorrectos recibidos de la API');
        }
      } catch (err: unknown) {
        console.error('Error en la solicitud de archivos:', err);
        setError('Hubo un problema al cargar los archivos');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles().catch((err: unknown) =>
      console.error('Error fetching files:', err)
    );
  }, [lessonId, lessonIdNumber]);

  useEffect(() => {
    const fetchFilesName = async () => {
      try {
        const respuestaName = await fetch(
          `/api/educadores/lessons/${lessonIdNumber}`
        );
        if (!respuestaName.ok) {
          throw new Error('Error al obtener los nombres de los archivos');
        }

        const dataName: LessonsModels =
          (await respuestaName.json()) as LessonsModels;
        if (dataName) {
          setLessonFileName(dataName); // Extraer claves y nombres de los archivos
        } else {
          setErrorNames(
            'Datos incorrectos recibidos de la API name Files sources'
          );
        }
      } catch (err: unknown) {
        console.error('Error en la solicitud del nombre de los archivos:', err);
        setErrorNames('Hubo un problema al cargar el nombre de los archivos');
      } finally {
        setLoadingNames(false);
      }
    };

    fetchFilesName().catch((err: unknown) =>
      console.error('Error fetching files:', err)
    );
  }, [lessonId, lessonIdNumber]);

  if (loading) {
    return (
      <div className="text-primary font-semibold">Cargando archivos...</div>
    );
  }
  if (loadingNames) {
    return (
      <div className="text-primary font-semibold">
        Cargando nombre de archivos...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-primary font-semibold">
        No hay archivos subidos actualmente!.
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }
  if (errorNames) {
    return <div>{errorNames}</div>;
  }

  return (
    <div className="mt-6">
      <h1
        className={`mb-4 text-2xl font-bold ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
      >
        Archivos de la clase
      </h1>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file, index) => {
          if (!file) return null; // Manejar caso de clave vacía
          const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${file.key}`; // URL de S3
          const icon = getIconForFileType(file.fileName); // Icono basado en la extensión del archivo
          if (lessonFileName === null) {
            return null; // Manejar caso de nombre de archivo vacío
          }
          const resourceNames = lessonFileName.resourceNames.split(','); // Separar resourceNames por comas

          return (
            <Link
              key={index}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mb-3 flex h-24 w-full items-center space-x-2 rounded-lg border border-gray-600/10 bg-slate-200/20 p-2 hover:bg-slate-200/40"
            >
              {icon}

              <p
                className={`no-underline hover:underline ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
              >
                {resourceNames[index] ?? file.fileName}
              </p>
            </Link>
          );
        })}
      </ul>
    </div>
  );
};

export default ViewFiles;
