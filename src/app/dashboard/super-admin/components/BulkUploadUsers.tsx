'use client';
import React, { useState } from 'react';

import {
  FiAlertCircle,
  FiCheck,
  FiDownload,
  FiMove,
  FiUpload,
  FiX,
} from 'react-icons/fi';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  selected?: boolean;
  isNew?: boolean;
}

interface ColumnMapping {
  excelColumn: string;
  dbField: string;
}

interface BulkUploadUsersProps {
  onUsersUploaded: (newUsers: User[]) => void;
  onFinished?: (res: unknown) => void;
}

const BulkUploadUsers = ({
  onUsersUploaded,
  onFinished,
}: BulkUploadUsersProps) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Estados para mapeo de columnas
  const [showMapping, setShowMapping] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  void detectedColumns;
  // Estados para drag and drop
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Campos disponibles en la BD
  const dbFields = [
    { value: 'firstName', label: 'Nombre', required: true },
    { value: 'lastName', label: 'Apellido', required: true },
    { value: 'email', label: 'Email', required: true },
    { value: 'role', label: 'Rol', required: false },
    { value: 'phone', label: 'Teléfono', required: false },
    { value: 'document', label: 'Documento', required: false },
  ];

  const showNotification = (message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Manejar la selección de archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('previewOnly', 'true');

      try {
        const res = await fetch('/api/usersMasive', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Error al analizar el archivo');

        const result = (await res.json()) as {
          preview: boolean;
          columns: string[];
          sampleData: Record<string, unknown>[];
        };

        if (result.preview && result.columns) {
          setDetectedColumns(result.columns);
          setSampleData(result.sampleData || []);

          // Crear mapeos iniciales automáticos
          const autoMappings: ColumnMapping[] = result.columns.map((col) => {
            const normalizedCol = col.toLowerCase().trim();
            let dbField = '';

            if (
              normalizedCol.includes('nombre') ||
              normalizedCol === 'firstname'
            ) {
              dbField = 'firstName';
            } else if (
              normalizedCol.includes('apellido') ||
              normalizedCol === 'lastname'
            ) {
              dbField = 'lastName';
            } else if (
              normalizedCol.includes('email') ||
              normalizedCol.includes('correo')
            ) {
              dbField = 'email';
            } else if (
              normalizedCol.includes('rol') ||
              normalizedCol === 'role'
            ) {
              dbField = 'role';
            } else if (
              normalizedCol.includes('telefono') ||
              normalizedCol.includes('phone')
            ) {
              dbField = 'phone';
            } else if (
              normalizedCol.includes('documento') ||
              normalizedCol.includes('document') ||
              normalizedCol.includes('identificacion')
            ) {
              dbField = 'document';
            }

            return { excelColumn: col, dbField };
          });

          setMappings(autoMappings);
          setShowMapping(true);
        }
      } catch (error) {
        showNotification(
          error instanceof Error ? error.message : 'Error al analizar archivo',
          'error'
        );
      }
    }
  };

  // Drag handlers para los campos disponibles
  const handleFieldDragStart = (fieldValue: string) => {
    setDraggedField(fieldValue);
  };

  const handleFieldDragEnd = () => {
    setDraggedField(null);
    setDragOverColumn(null);
  };

  // Drop handlers para las columnas
  const handleColumnDragOver = (e: React.DragEvent, excelColumn: string) => {
    e.preventDefault();
    setDragOverColumn(excelColumn);
  };

  const handleColumnDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, excelColumn: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedField) {
      setMappings((prev) =>
        prev.map((m) =>
          m.excelColumn === excelColumn ? { ...m, dbField: draggedField } : m
        )
      );
    }
  };

  // Remover mapeo
  const handleRemoveMapping = (excelColumn: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.excelColumn === excelColumn ? { ...m, dbField: '' } : m
      )
    );
  };

  const handleUpload = async () => {
    if (!file) {
      showNotification('Por favor selecciona un archivo primero.', 'error');
      return;
    }

    const requiredFields = ['firstName', 'lastName', 'email'];
    const mappedFields = mappings.map((m) => m.dbField).filter(Boolean);
    const missingFields = requiredFields.filter(
      (f) => !mappedFields.includes(f)
    );

    if (missingFields.length > 0) {
      showNotification(
        `Debes mapear los campos obligatorios: ${missingFields.join(', ')}`,
        'error'
      );
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'mappings',
      JSON.stringify(mappings.filter((m) => m.dbField))
    );

    try {
      const res = await fetch('/api/usersMasive', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir los usuarios');

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Respuesta inesperada del servidor, no es JSON.');
      }

      const result: unknown = await res.json();

      let newUsers: User[] = [];
      if (
        result &&
        typeof result === 'object' &&
        'users' in result &&
        Array.isArray((result as { users: unknown }).users)
      ) {
        newUsers = (result as { users: User[] }).users;
        onUsersUploaded(newUsers);
      }

      onFinished?.(result);

      setModalIsOpen(false);
      setShowMapping(false);
      setFile(null);
      setMappings([]);
      setDetectedColumns([]);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Error desconocido',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/usersMasive/', {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error('Error al descargar la plantilla');
      }

      const data = await res.blob();
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_usuarios.xlsx';
      link.click();
    } catch {
      alert('Error al descargar la plantilla');
    }
  };

  const requiredFields = dbFields.filter((f) => f.required).map((f) => f.value);
  const mappedRequiredFields = mappings
    .map((m) => m.dbField)
    .filter((f) => requiredFields.includes(f));
  const allRequiredMapped = requiredFields.every((f) =>
    mappedRequiredFields.includes(f)
  );

  return (
    <div>
      <button
        onClick={() => setModalIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-[#00BDD8] px-6 py-2 text-white transition hover:scale-105"
      >
        <FiUpload /> Usuarios Masivos
      </button>

      {modalIsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div
            className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300"
            style={{ maxHeight: '95vh' }}
          >
            {/* Header */}
            <div className="bg-[#01142B] px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Carga Masiva de Usuarios
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    {!showMapping
                      ? 'Sube tu archivo Excel para comenzar'
                      : 'Arrastra los campos a las columnas correspondientes'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalIsOpen(false);
                    setShowMapping(false);
                    setFile(null);
                    setMappings([]);
                  }}
                  className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                >
                  <FiX size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              className="overflow-y-auto p-8"
              style={{ maxHeight: 'calc(95vh - 200px)' }}
            >
              {!showMapping ? (
                <div className="space-y-6">
                  {/* Drop Zone */}
                  <div className="group relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-all hover:border-[#00BDD8] hover:bg-[#00BDD8]/5">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <FiUpload className="mx-auto mb-4 text-5xl text-gray-400 transition-colors group-hover:text-[#00BDD8]" />
                    <p className="mb-2 text-lg font-semibold text-gray-700">
                      {file ? file.name : 'Arrastra tu archivo aquí'}
                    </p>
                    <p className="text-sm text-gray-500">
                      o haz clic para seleccionar un archivo Excel (.xlsx)
                    </p>
                  </div>

                  {/* Download Template Button */}
                  <div className="rounded-xl bg-blue-50 p-6">
                    <div className="mb-3 flex items-center gap-2 text-blue-800">
                      <FiAlertCircle className="text-xl" />
                      <h3 className="font-semibold">
                        ¿No tienes una plantilla?
                      </h3>
                    </div>
                    <p className="mb-4 text-sm text-blue-700">
                      Descarga nuestra plantilla de Excel con los campos
                      correctos y ejemplos de datos.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-all hover:bg-blue-700 hover:shadow-md"
                    >
                      <FiDownload /> Descargar Plantilla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 p-2">
                        <FiMove className="text-xl text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 font-semibold text-gray-800">
                          Arrastra los campos a las columnas
                        </h3>
                        <p className="text-sm text-gray-600">
                          Arrastra los campos disponibles desde abajo hacia las
                          columnas correspondientes de tu Excel. Los campos con{' '}
                          <span className="font-semibold text-red-600">*</span>{' '}
                          son obligatorios.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {allRequiredMapped ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                      <FiCheck className="text-lg" />
                      <span className="font-medium">
                        Todos los campos obligatorios están mapeados
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                      <FiAlertCircle className="text-lg" />
                      <span className="font-medium">
                        Faltan campos obligatorios por mapear (
                        {requiredFields.length - mappedRequiredFields.length})
                      </span>
                    </div>
                  )}

                  {/* Tabla tipo Excel */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300 bg-gray-100">
                          {mappings.map((mapping) => {
                            const mappedField = dbFields.find(
                              (f) => f.value === mapping.dbField
                            );
                            const isOver =
                              dragOverColumn === mapping.excelColumn;

                            return (
                              <th
                                key={mapping.excelColumn}
                                onDragOver={(e) =>
                                  handleColumnDragOver(e, mapping.excelColumn)
                                }
                                onDragLeave={handleColumnDragLeave}
                                onDrop={(e) =>
                                  handleColumnDrop(e, mapping.excelColumn)
                                }
                                className={`border border-gray-300 p-3 text-left transition-all ${
                                  isOver ? 'scale-105 bg-[#00BDD8]/20' : ''
                                }`}
                              >
                                <div className="space-y-2">
                                  {/* Nombre de la columna Excel */}
                                  <div className="text-sm font-semibold text-gray-900">
                                    {mapping.excelColumn}
                                  </div>

                                  {/* Campo mapeado o zona de drop */}
                                  <div
                                    className={`min-h-[60px] rounded-lg border-2 border-dashed p-2 transition-all ${
                                      isOver
                                        ? 'border-[#00BDD8] bg-[#00BDD8]/10'
                                        : mappedField
                                          ? 'border-green-400 bg-green-50'
                                          : 'border-gray-300 bg-gray-50'
                                    }`}
                                  >
                                    {mappedField ? (
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="text-xs font-semibold text-gray-900">
                                            {mappedField.label}
                                          </div>
                                          {mappedField.required && (
                                            <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                              <FiCheck className="text-xs" />
                                              Obligatorio
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleRemoveMapping(
                                              mapping.excelColumn
                                            )
                                          }
                                          className="text-red-500 transition-colors hover:text-red-700"
                                        >
                                          <FiX size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-gray-400 italic">
                                        Arrastra campo aquí
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {mappings.map((mapping) => (
                              <td
                                key={`${idx}-${mapping.excelColumn}`}
                                className="border border-gray-300 p-3 text-sm text-gray-700"
                              >
                                {(() => {
                                  const val = row[mapping.excelColumn];
                                  if (val === null || val === undefined)
                                    return '-';
                                  if (typeof val === 'object')
                                    return JSON.stringify(val);
                                  if (typeof val === 'string') return val;
                                  if (
                                    typeof val === 'number' ||
                                    typeof val === 'boolean'
                                  )
                                    return String(val);
                                  return JSON.stringify(val);
                                })()}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {sampleData.length > 5 && (
                          <tr>
                            <td
                              colSpan={mappings.length}
                              className="border border-gray-300 p-3 text-center text-sm text-gray-500 italic"
                            >
                              ... y {sampleData.length - 5} filas más
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Campos disponibles para arrastrar */}
                  <div className="rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                      <FiMove className="text-[#00BDD8]" />
                      Campos Disponibles (Arrastra hacia las columnas)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                      {dbFields.map((field) => (
                        <div
                          key={field.value}
                          draggable
                          onDragStart={() => handleFieldDragStart(field.value)}
                          onDragEnd={handleFieldDragEnd}
                          className={`cursor-move rounded-lg border-2 p-3 text-center transition-all hover:scale-105 hover:shadow-lg ${
                            draggedField === field.value
                              ? 'scale-105 border-[#00BDD8] bg-[#00BDD8] text-white shadow-lg'
                              : field.required
                                ? 'border-red-300 bg-white hover:border-red-400'
                                : 'border-gray-300 bg-white hover:border-[#00BDD8]'
                          }`}
                        >
                          <FiMove className="mx-auto mb-2 text-lg" />
                          <div className="text-sm font-semibold">
                            {field.label}
                          </div>
                          {field.required && (
                            <div
                              className={`mt-1 text-xs font-medium ${
                                draggedField === field.value
                                  ? 'text-white'
                                  : 'text-red-600'
                              }`}
                            >
                              Requerido *
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {showMapping && (
              <div className="border-t border-gray-200 bg-gray-50 px-8 py-5">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => {
                      setShowMapping(false);
                      setFile(null);
                      setMappings([]);
                    }}
                    className="rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !allRequiredMapped}
                    className="flex items-center gap-2 rounded-md bg-[#00BDD8] px-8 py-2.5 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {uploading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <FiUpload className="text-lg" />
                        Subir Archivo
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadUsers;
