'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BsFiletypeXls } from 'react-icons/bs';
import {
  FaDownload,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaLink,
  FaRegFileImage,
} from 'react-icons/fa';
import { toast } from 'sonner';

interface Resource {
  key: string;
  fileName: string;
  size?: number;
}

interface LessonWithResources {
  id: number;
  title: string;
  order: number;
  resourceKey: string | null;
  resourceNames: string | null;
}

interface ResourcesSectionProps {
  courseId: number;
}

export function ResourcesSection({ courseId }: ResourcesSectionProps) {
  const [lessons, setLessons] = useState<LessonWithResources[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  useEffect(() => {
    const fetchLessonsWithResources = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/super-admin/courses/lessonsCourse?courseId=${courseId}`
        );

        if (!response.ok) {
          throw new Error('Error al cargar recursos');
        }

        const data = await response.json();
        // Filtrar solo las lecciones que tienen recursos
        const lessonsWithResources = data.lessons.filter(
          (lesson: LessonWithResources) =>
            lesson.resourceKey && lesson.resourceKey.trim() !== ''
        );
        setLessons(lessonsWithResources);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Error al cargar los recursos');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLessonsWithResources();
  }, [courseId]);

  // Función para limpiar nombres de archivo quitando timestamp y UUID
  const cleanFileName = useCallback((fileName: string): string => {
    // Patrón para detectar: -timestamp-uuid
    // Ejemplo: certificado-20251216-unlocked-1766014422143-d4e93709-fc89-4fdf-b068-f54454cba237.pdf
    // Debe quedar: certificado-20251216-unlocked.pdf
    const pattern =
      /-\d{13}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
    return fileName.replace(pattern, '');
  }, []);

  const parseResources = useCallback(
    (resourceKey: string | null, resourceNames: string | null): Resource[] => {
      if (!resourceKey) return [];

      const keys = resourceKey.split(',').map((k) => k.trim());
      const names = resourceNames
        ? resourceNames.split(',').map((n) => n.trim())
        : [];

      return keys.map((key, index) => {
        const rawFileName = names[index] || key.split('/').pop() || key;
        return {
          key,
          fileName: cleanFileName(rawFileName),
        };
      });
    },
    [cleanFileName]
  );

  // Detectar si es un recurso externo (link)
  const isExternalResource = (value: string) => {
    return /^https?:\/\//i.test(value) || /^www\./i.test(value);
  };

  const getFileIcon = (fileName: string, resourceKey: string) => {
    // Si es un link externo, mostrar icono de enlace
    if (isExternalResource(resourceKey)) {
      return <FaLink className="text-blue-400" />;
    }
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-400" />;
      case 'pptx':
      case 'ppt':
        return <FaFilePowerpoint className="text-orange-400" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-400" />;
      case 'xlsx':
      case 'xls':
        return <BsFiletypeXls className="text-green-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <FaRegFileImage className="text-purple-400" />;
      default:
        return <FaLink className="text-blue-400" />;
    }
  };

  const getFileSize = (fileName: string): string => {
    // Mock size - en producción esto vendría del backend
    const mockSizes = ['1.2 MB', '2.4 MB', '3.5 MB', '856 KB', '4.1 MB'];
    return mockSizes[Math.floor(Math.random() * mockSizes.length)] || '1.0 MB';
  };

  const allResources = useMemo(() => {
    return lessons.flatMap((lesson) =>
      parseResources(lesson.resourceKey, lesson.resourceNames)
    );
  }, [lessons, parseResources]);

  const handleDownloadAll = async () => {
    if (!allResources.length) {
      toast.info('No hay recursos para descargar');
      return;
    }

    setIsBulkDownloading(true);
    try {
      const [{ default: JSZip }] = await Promise.all([import('jszip')]);
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      await Promise.all(
        allResources.map(async (resource, index) => {
          const isExternal = isExternalResource(resource.key);
          const url = isExternal
            ? resource.key.startsWith('http')
              ? resource.key
              : `https://${resource.key.replace(/^\/+/, '')}`
            : `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${resource.key}`;

          try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`Status ${resp.status}`);
            const blob = await resp.blob();
            const baseName =
              resource.fileName ||
              resource.key.split('/').pop() ||
              `recurso-${index + 1}`;
            const entryName = baseName.trim() || `recurso-${index + 1}`;
            zip.file(entryName, blob);
            successCount += 1;
          } catch (error) {
            console.error('Error al descargar recurso', resource.key, error);
            failCount += 1;
          }
        })
      );

      if (!successCount) {
        toast.error('No se pudieron descargar los recursos');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = `recursos-curso-${courseId}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        failCount
          ? `Descarga comprimida lista (${successCount} ok, ${failCount} fallidos)`
          : 'Descarga comprimida lista'
      );
    } catch (error) {
      console.error('Error al comprimir recursos', error);
      toast.error('No se pudo generar el ZIP');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleDownload = (resource: Resource) => {
    // Detectar si es un recurso externo
    const isExternal = isExternalResource(resource.key);
    const url = isExternal
      ? resource.key.startsWith('http')
        ? resource.key
        : `https://${resource.key.replace(/^\/+/, '')}`
      : `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${resource.key}`;

    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando recursos...</div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div
        className="border-border/50 flex flex-col items-center justify-center rounded-xl border border-dashed py-12"
        style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
      >
        <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <FaFilePdf className="h-8 w-8 text-black" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-100">
          No hay recursos disponibles
        </h3>
        <p className="text-center text-sm text-slate-300">
          Este curso aún no tiene recursos cargados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-xl font-semibold">
          Recursos del curso
        </h3>
        <button
          onClick={handleDownloadAll}
          className="bg-background hover:text-accent-foreground ring-offset-background focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 border px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-[#22c4d3] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          style={{
            borderRadius: '16px',
            borderColor: 'hsla(217, 33%, 17%, 0.5)',
          }}
          disabled={isBulkDownloading}
        >
          <FaDownload className="h-4 w-4" />
          {isBulkDownloading ? 'Preparando...' : 'Descargar todo'}
        </button>
      </div>

      {/* Lista de clases con recursos */}
      <div className="space-y-6">
        {lessons.map((lesson) => {
          const resources = parseResources(
            lesson.resourceKey,
            lesson.resourceNames
          );

          return (
            <div key={lesson.id} className="space-y-3">
              {/* Header de la clase */}
              <div className="flex items-center gap-3">
                <div className="bg-accent/20 flex h-6 w-6 items-center justify-center rounded-full">
                  <span className="text-accent text-xs font-medium">
                    {lesson.order}
                  </span>
                </div>
                <h4 className="text-foreground text-sm font-medium">
                  {lesson.title}
                </h4>
              </div>

              {/* Lista de recursos */}
              <div className="ml-9 space-y-2">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between border p-3 transition-all duration-200 hover:cursor-pointer"
                    style={{
                      backgroundColor: '#061c3799',
                      borderColor: 'hsla(217, 33%, 17%, 0.5)',
                      borderRadius: '12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#082345';
                      e.currentTarget.style.borderColor = '#1D283A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#061c3799';
                      e.currentTarget.style.borderColor =
                        'hsla(217, 33%, 17%, 0.5)';
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-background/50 rounded-lg p-2">
                        {getFileIcon(resource.fileName, resource.key)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-sm font-medium">
                          {resource.fileName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {getFileSize(resource.fileName)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(resource)}
                      className="ring-offset-background focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                      style={{
                        transition:
                          'background-color 0.2s, opacity 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#22c4d3';
                        e.currentTarget.style.color = '#000000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '';
                      }}
                    >
                      <FaDownload className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
