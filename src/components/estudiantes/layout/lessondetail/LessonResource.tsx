import { useCallback, useEffect, useState } from 'react';

import { BsFiletypeXls } from 'react-icons/bs';
import {
  FaDownload,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaLink,
  FaRegFileImage,
} from 'react-icons/fa';

import { Icons } from '~/components/estudiantes/ui/icons';

interface FileInfo {
  key: string;
  fileName: string;
}

// Tipos posibles que puede retornar el backend
type RawFilesArray = FileInfo[];
interface FilesWrapper {
  files: FileInfo[];
  message?: string;
}
interface RawResourceFields {
  resourceKey?: string | null;
  resource_key?: string | null;
  resourceNames?: string | null;
  resource_names?: string | null;
  message?: string;
}

// Type guards
const isFilesWrapper = (d: unknown): d is FilesWrapper =>
  !!d &&
  typeof d === 'object' &&
  Array.isArray((d as Record<string, unknown>).files);

const isRawFilesArray = (d: unknown): d is RawFilesArray =>
  Array.isArray(d) &&
  d.every(
    (f): f is FileInfo =>
      typeof f === 'object' &&
      f !== null &&
      'key' in f &&
      'fileName' in f &&
      typeof (f as { key?: unknown }).key === 'string' &&
      typeof (f as { fileName?: unknown }).fileName === 'string'
  );

const isRawResourceFields = (d: unknown): d is RawResourceFields =>
  !!d && typeof d === 'object';

interface LessonResourceProps {
  lessonId: number;
  onCountChange?: (count: number) => void;
}

const LessonResource = ({ lessonId, onCountChange }: LessonResourceProps) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [_rawResponse, setRawResponse] = useState<unknown>(null); // For debugging

  // NUEVO: detectar si es un recurso externo (link) (memoized)
  const isExternalResource = useCallback(
    (value: string) => /^https?:\/\//i.test(value) || /^www\./i.test(value),
    []
  );

  // Helper: derivar nombre si no viene en resourceNames (memoized)
  const deriveFileName = useCallback(
    (key: string) => {
      if (!key) return 'Recurso';
      if (isExternalResource(key)) {
        try {
          const normalized = key.startsWith('http')
            ? key
            : `https://${key.replace(/^\/+/, '')}`;
          const url = new URL(normalized);
          return url.hostname.replace(/^www\./, '');
        } catch {
          return key;
        }
      }
      return key.split('/').pop() ?? key;
    },
    [isExternalResource]
  );

  // Parser con tipado estricto
  const parseFilesFromResponse = useCallback(
    (data: unknown): FileInfo[] => {
      if (!data) return [];

      if (isRawFilesArray(data)) {
        return data;
      }
      if (isFilesWrapper(data)) {
        return data.files;
      }
      if (isRawResourceFields(data)) {
        const resourceKey = data.resourceKey ?? data.resource_key ?? undefined;
        const resourceNames =
          data.resourceNames ?? data.resource_names ?? undefined;
        if (resourceKey) {
          const keys = resourceKey
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
          const names = resourceNames
            ? resourceNames
                .split(',')
                .map((n) => n.trim())
                .filter(Boolean)
            : [];
          return keys.map((k, idx) => ({
            key: k,
            fileName: names[idx] || deriveFileName(k),
          }));
        }
      }
      return [];
    },
    [deriveFileName]
  );

  // NUEVO: Expansión genérica (ahora con useCallback y needsExpansion definido)
  const expandCommaSeparatedFiles = useCallback(
    (list: FileInfo[]): FileInfo[] => {
      const needsExpansion = list.some(
        (f) => f.key.includes(',') || f.fileName.includes(',')
      );
      if (!needsExpansion) return list;

      const seen = new Set<string>();
      const ordered: string[] = [];

      list.forEach((f) => {
        const parts = [f.key, f.fileName]
          .filter(Boolean)
          .join(',')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        parts.forEach((p) => {
          if (!seen.has(p)) {
            seen.add(p);
            ordered.push(p);
          }
        });
      });

      return ordered.map((res) => ({
        key: res,
        fileName: deriveFileName(res),
      }));
    },
    [deriveFileName]
  );

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        console.log('🔍 Fetching files for lesson:', lessonId);
        const response = await fetch(
          `/api/estudiantes/getFiles?lessonId=${lessonId}`
        );
        if (response.ok) {
          const data: unknown = await response.json();
          console.log('📥 Raw API response:', data);
          setRawResponse(data);

          // Simple direct approach - if resourceKey is a single string with comma
          if (
            typeof data === 'object' &&
            data !== null &&
            ('resourceKey' in data || 'resource_key' in data)
          ) {
            const rawObj = data as Record<string, unknown>;
            const resourceKey = (rawObj.resourceKey ??
              rawObj.resource_key) as string;
            const resourceNames = (rawObj.resourceNames ??
              rawObj.resource_names) as string;

            console.log('🔑 Resource Key:', resourceKey);
            console.log('📝 Resource Names:', resourceNames);

            if (resourceKey?.includes(',')) {
              // Split by comma and create files directly
              const keys = resourceKey
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean);
              const names = resourceNames
                ? resourceNames
                    .split(',')
                    .map((n) => n.trim())
                    .filter(Boolean)
                : [];

              console.log('🔑 Split keys:', keys);
              console.log('📝 Split names:', names);

              const directFiles = keys.map((key, idx) => ({
                key,
                fileName: names[idx] || deriveFileName(key),
              }));

              console.log('📂 Direct files:', directFiles);
              setFiles(directFiles);
              onCountChange?.(directFiles.length);
              setLoading(false);
              return;
            }
          }

          // If direct approach didn't work, try normal parsing
          const parsed = parseFilesFromResponse(data);
          console.log('📊 Parsed response:', parsed);

          const expanded = expandCommaSeparatedFiles(parsed);
          console.log('📂 Expanded files:', expanded);
          setFiles(expanded);
          onCountChange?.(expanded.length);
        } else {
          console.error('❌ API error:', response.status, response.statusText);
          setFiles([]);
        }
      } catch (error) {
        console.error('❌ Error fetching files:', error);
        setFiles([]);
        onCountChange?.(0);
      } finally {
        setLoading(false);
      }
    };
    void fetchFiles();
  }, [
    lessonId,
    parseFilesFromResponse,
    expandCommaSeparatedFiles,
    deriveFileName,
    onCountChange,
  ]);

  // Cambiar getIcon para detectar links directamente desde key
  const getIcon = (file: FileInfo) => {
    if (isExternalResource(file.key)) {
      return <FaLink className="text-blue-400" />;
    }
    const nameForExt = file.fileName || file.key;
    const extension = nameForExt.split('.').pop()?.toLowerCase();
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

  const handleDownload = (file: FileInfo) => {
    // Detectar si es un recurso externo
    const isExternal = isExternalResource(file.key);
    const url = isExternal
      ? file.key.startsWith('http')
        ? file.key
        : `https://${file.key.replace(/^\/+/, '')}`
      : `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${file.key}`;

    window.open(url, '_blank');
  };

  return (
    <div className="mx-auto mt-4 mb-4 w-full md:mx-0 md:w-[70%]">
      <div>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Icons.spinner className="h-8 w-8 text-background" />
          </div>
        ) : files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="group flex items-center justify-between border p-3 transition-all duration-200 hover:cursor-pointer"
                style={{
                  backgroundColor: '#01152d',
                  borderColor: 'hsla(217, 33%, 17%, 0.5)',
                  borderRadius: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#082345';
                  e.currentTarget.style.borderColor = '#1D283A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#01152d';
                  e.currentTarget.style.borderColor =
                    'hsla(217, 33%, 17%, 0.5)';
                }}
                onClick={() => handleDownload(file)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: '#061c37' }}
                  >
                    {getIcon(file)}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-foreground"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFileSize(file.fileName)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium whitespace-nowrap opacity-100 ring-offset-background transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  style={{
                    transition:
                      'background-color 0.2s, opacity 0.2s, color 0.2s',
                    color: '#22c4d3',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#22c4d3';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#22c4d3';
                  }}
                >
                  <FaDownload className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12"
            style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <FaFilePdf className="h-8 w-8 text-black" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-100">
              No hay recursos disponibles
            </h3>
            <p className="text-center text-sm text-slate-300">
              Esta clase aún no tiene recursos cargados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonResource;
