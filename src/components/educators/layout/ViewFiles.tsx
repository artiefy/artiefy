// pages/viewFiles.tsx
import { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';
import Image from 'next/image';
import { AspectRatio } from '~/components/educators/ui/aspect-ratio';

const getIconForFileType = (fileName: string) => {
  if (!fileName) return '/default-icon.png'; // Manejar caso de archivo sin nombre
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
    default:
      return '/default-icon.png';
  }
};

interface idLesson {
  lessonId: number;
}

const ViewFiles = ({ lessonId }: idLesson) => {
  const [fileKeys, setFileKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log(`lessonId: ${lessonId}`);
  const lessonIdNumber = Number(lessonId);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/getFiles?lessonId=${lessonIdNumber}`);
        if (!res.ok) {
          throw new Error('Error al obtener los archivos');
        }

        const data = await res.json();
        console.log('Datos recibidos de la API:', data); // Verificar los datos recibidos
        if (Array.isArray(data)) {
          const keys = data.filter((key: string) => key); // Filtrar claves vacías
          setFileKeys(keys); // Extraer las claves de los archivos
          console.log('Claves de los archivos:', keys); // Verificar las claves de los archivos
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

  if (loading) {
    return <div>Cargando archivos...</div>;
  }

  if (fileKeys.length === 0) {
    return <div>No hay archivos disponibles</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="mt-6">
      <h1 className="mb-4 text-2xl font-bold">Archivos de lección</h1>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {fileKeys.map((key, index) => {
          if (!key) return null; // Manejar caso de clave vacía
          const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`; // URL de S3
          const icon = getIconForFileType(key); // Icono basado en la extensión del archivo

          return (
            <li
              key={index}
              className="mb-3 flex items-center rounded-lg border border-gray-600/10 bg-slate-200/20 p-3"
            >
              <AspectRatio ratio={12 / 6}>
                <Image
                  src={icon}
                  alt="File icon"
                  fill
                  className="rounded-lg"
                  priority
                  sizes="(max-width: 268px) 100vw, (max-width: 320px) 50vw, 33vw"
                />
              </AspectRatio>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black no-underline hover:underline"
              >
                {key} {/* Nombre del archivo */}
              </a>
              {/* Enlace de descarga */}
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 rounded-full border border-sky-500 bg-slate-100/20 p-2 text-sky-500"
                download={key}
              >
                <FileDown size={24} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ViewFiles;
