// pages/viewFiles.tsx
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AspectRatio } from '~/components/educators/ui/aspect-ratio';

const getIconForFileType = (fileName: string) => {
  if (fileName === null) return '/default-icon.png'; // Manejar caso de archivo sin nombre
  if (fileName === '') return '/default-icon.png'; // Manejar caso de archivo sin nombre
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return '/pdf-icon.png';
    case 'docx':
    case 'doc':
      return '/word-icon.png';
    case 'xlsx':
    case 'xls':
      return '/excel-icon.png';
    case 'pptx':
    case 'ppt':
      return '/powerpoint-icon.png';
    default:
      return '/default-icon.png';
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
  console.log(`lessonIdNumer: ${lessonIdNumber}`);
  useEffect(() => {
    localStorage.getItem(`selectedColor_${lessonId}`);
  }, [lessonId]);

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
          console.log('Archivos:', files); // Verificar los archivos
        } else {
          setError('Datos incorrectos recibidos de la API');
        }
      } catch (err) {
        console.error('Error en la solicitud de archivos:', err);
        setError('Hubo un problema al cargar los archivos');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles().catch((err) => console.error('Error fetching files:', err));
  }, [lessonId]);

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
        console.log('Datos recibidos de los name source:', dataName); // Verificar los datos recibidos
        if (dataName) {
          setLessonFileName(dataName); // Extraer claves y nombres de los archivos
        } else {
          setErrorNames(
            'Datos incorrectos recibidos de la API name Files sources'
          );
        }
      } catch (err) {
        console.error('Error en la solicitud del nombre de los archivos:', err);
        setErrorNames('Hubo un problema al cargar el nombre de los archivos');
      } finally {
        setLoadingNames(false);
      }
    };

    fetchFilesName().catch((err) =>
      console.error('Error fetching files:', err)
    );
  }, [lessonId]);

  if (loading) {
    return <div>Cargando archivos...</div>;
  }
  if (loadingNames) {
    return <div>Cargando nombre de archivos...</div>;
  }

  if (files.length === 0) {
    return <div>No hay archivos disponibles</div>;
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
        Archivos de lección
      </h1>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file, index) => {
          if (!file) return null; // Manejar caso de clave vacía
          const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${file.key}`; // URL de S3
          const icon = getIconForFileType(file.fileName); // Icono basado en la extensión del archivo
          if (!lessonFileName === null) {
            return null; // Manejar caso de nombre de archivo vacío
          } else {
          }
          const resourceNames = lessonFileName?.resourceNames.split(',') ?? []; // Separar resourceNames por comas}

          return (
            <Link
              key={index}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mb-3 grid h-24 w-full grid-cols-2 items-center rounded-lg border border-gray-600/10 bg-slate-200/20 p-2 hover:bg-slate-200/40"
            >
              <AspectRatio className="absolute top-6 size-20">
                <Image
                  src={icon ?? '/default-icon.png'}
                  alt="File icon"
                  fill
                  className="rounded-lg"
                  priority
                  sizes="(max-width: 268px) 100vw, (max-width: 320px) 50vw, 33vw"
                />
              </AspectRatio>
              <p
                className={`absolute right-4 no-underline hover:underline ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
              >
                {resourceNames[index] ?? file.fileName}
                {/* Nombre del archivo */}
              </p>
            </Link>
          );
        })}
      </ul>
    </div>
  );
};

export default ViewFiles;
