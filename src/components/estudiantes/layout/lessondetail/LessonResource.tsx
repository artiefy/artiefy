import { useCallback, useEffect, useState } from 'react';

import { BsFiletypeXls } from 'react-icons/bs';
import {
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
      return <FaLink className="text-blue-500" />;
    }
    const nameForExt = file.fileName || file.key;
    const extension = nameForExt.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'pptx':
      case 'ppt':
        return <FaFilePowerpoint className="text-orange-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <BsFiletypeXls className="text-green-600" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <FaRegFileImage className="text-purple-500" />;
      default:
        return <FaLink className="text-blue-500" />;
    }
  };

  return (
    <div className="mt-4 mb-4">
      <div>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Icons.spinner className="h-8 w-8 text-background" />
          </div>
        ) : files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file, index) => {
              const external = isExternalResource(file.key);
              const normalizedHref = external
                ? file.key.startsWith('http')
                  ? file.key
                  : `https://${file.key.replace(/^\/+/, '')}`
                : `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${file.key}`;
              return (
                <li key={index}>
                  <a
                    href={normalizedHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center transition-colors hover:text-blue-400"
                  >
                    <span className="mr-4 text-2xl">{getIcon(file)}</span>
                    <span
                      className="flex-1 truncate text-base font-medium"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600">No hay recursos disponibles</p>
        )}
      </div>
    </div>
  );
};

export default LessonResource;
