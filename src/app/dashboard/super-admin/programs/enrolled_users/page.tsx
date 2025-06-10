'use client';

import { useEffect, useState } from 'react';

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  birthDate: z.string().nullable(),
  subscriptionStatus: z.string(),
  subscriptionEndDate: z.string().nullable(),
  role: z.string().optional(),
  planType: z.string().nullable().optional(),
  programTitle: z.string().optional(),
  programTitles: z.array(z.string()).optional(),
  nivelNombre: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  customFields: z.record(z.string()).optional(),
});

const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const enrolledUserSchema = z.object({
  id: z.string(),
  programTitle: z.string(),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const apiResponseSchema = z.object({
  students: z.array(studentSchema),
  courses: z.array(courseSchema),
  enrolledUsers: z.array(enrolledUserSchema),
});

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  role?: string;
  planType?: string;
  programTitle?: string;
  programTitles?: string[];
  nivelNombre?: string | null;
  purchaseDate?: string | null;
  customFields?: Record<string, string>;
}

interface Course {
  id: string;
  title: string;
}

type ColumnType = 'text' | 'date' | 'select';

interface Column {
  id: string;
  label: string;
  defaultVisible: boolean;
  type: ColumnType;
  options?: string[];
}

const allColumns: Column[] = [
  { id: 'name', label: 'Nombre', defaultVisible: true, type: 'text' },
  { id: 'email', label: 'Correo', defaultVisible: true, type: 'text' },
  { id: 'phone', label: 'Teléfono', defaultVisible: false, type: 'text' },
  { id: 'address', label: 'Dirección', defaultVisible: false, type: 'text' },
  { id: 'country', label: 'País', defaultVisible: false, type: 'text' },
  { id: 'city', label: 'Ciudad', defaultVisible: false, type: 'text' },
  {
    id: 'birthDate',
    label: 'Fecha de nacimiento',
    defaultVisible: false,
    type: 'date',
  },
  {
    id: 'subscriptionStatus',
    label: 'Estado',
    defaultVisible: true,
    type: 'select',
    options: ['active', 'inactive'],
  },
  {
    id: 'purchaseDate',
    label: 'Fecha de compra',
    defaultVisible: true,
    type: 'date',
  },
  {
    id: 'subscriptionEndDate',
    label: 'Fin Suscripción',
    defaultVisible: true,
    type: 'date',
  },
  { id: 'programTitle', label: 'Programa', defaultVisible: true, type: 'text' },
  {
    id: 'nivelNombre',
    label: 'Nivel de educación',
    defaultVisible: false,
    type: 'text',
  },
  {
    id: 'role',
    label: 'Rol',
    defaultVisible: false,
    type: 'select', // ✅ CAMBIA a 'select'
    options: ['estudiante', 'educador', 'admin', 'super-admin'], // ✅ AÑADE opciones
  },
  {
    id: 'planType',
    label: 'Plan',
    defaultVisible: false,
    type: 'select', // ✅ CAMBIA a 'select'
    options: ['none', 'Pro', 'Premium', 'Enterprise'], // ✅ AÑADE opciones
  },
];

// Helper function for safe string conversion
function safeToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();
  return JSON.stringify(value);
}

export default function EnrolledUsersPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<Column[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    subscriptionStatus: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [filteredCourseResults, setFilteredCourseResults] = useState<Course[]>(
    []
  );
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.filter((c) => c.defaultVisible).map((c) => c.id)
  );

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const totalColumns: Column[] = [...allColumns, ...dynamicColumns];

  // Save visible columns to localStorage
  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/super-admin/enroll_user_program');
      const json: unknown = await res.json();
      const data = apiResponseSchema.parse(json);

      const enrolledMap = new Map(
        data.enrolledUsers.map((u) => [u.id, u.programTitle])
      );

      const studentsFilteredByRole = data.students
        .filter((s) => s.role === 'estudiante')
        .map((s) => ({
          ...s,
          programTitle: enrolledMap.get(s.id) ?? 'No inscrito',
          nivelNombre: s.nivelNombre ?? 'No definido',
          planType: s.planType ?? undefined,
        }));

      setStudents(studentsFilteredByRole);
      setAvailableCourses(data.courses);

      // NUEVO: detectar las claves de los campos personalizados
      const allCustomKeys = new Set<string>();
      studentsFilteredByRole.forEach((student) => {
        if (student.customFields) {
          Object.keys(student.customFields).forEach((key) =>
            allCustomKeys.add(key)
          );
        }
      });

      // Generar dinámicamente las columnas de customFields
      const dynamicCustomColumns = Array.from(allCustomKeys).map((key) => ({
        id: `customFields.${key}`,
        label: key,
        defaultVisible: true,
        type: 'text' as ColumnType,
      }));

      // Agregamos al state las columnas dinámicas
      setDynamicColumns(dynamicCustomColumns);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const downloadSelectedAsExcel = () => {
    const selectedData = students.filter((s) =>
      selectedStudents.includes(s.id)
    );

    if (selectedData.length === 0) {
      alert('No hay estudiantes seleccionados.');
      return;
    }

    // Crea filas with las columnas visibles
    const rows = selectedData.map((student) => {
      const row: Record<string, string> = {};
      visibleColumns.forEach((colId) => {
        const value = student[colId as keyof Student];
        const safeValue = safeToString(value);
        row[allColumns.find((c) => c.id === colId)?.label ?? colId] = safeValue;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
    }) as ArrayBuffer;

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(blob, 'estudiantes_seleccionados.xlsx');
  };

  const getFilteredSortedStudents = () => {
    return (
      [...students]
        // Filtro por programa seleccionado
        .filter((student) =>
          selectedProgram
            ? student.programTitles?.includes(selectedProgram)
            : true
        )

        // Filtros por columnas dinámicas (incluye customFields)
        .filter((student) =>
          Object.entries(columnFilters).every(([key, value]) => {
            if (!value) return true;

            const studentValue = key.startsWith('customFields.')
              ? student.customFields?.[key.split('.')[1]]
              : student[key as keyof Student];

            if (!studentValue) return false;

            if (key === 'subscriptionEndDate') {
              const dateStr = safeToString(studentValue);
              return new Date(dateStr).toISOString().split('T')[0] === value;
            }

            const safeStudentValue = safeToString(studentValue);
            return safeStudentValue.toLowerCase().includes(value.toLowerCase());
          })
        )

        // Filtros generales (nombre, email, estado, fechas)
        .filter((s) =>
          filters.name
            ? s.name.toLowerCase().includes(filters.name.toLowerCase())
            : true
        )
        .filter((s) =>
          filters.email
            ? s.email.toLowerCase().includes(filters.email.toLowerCase())
            : true
        )
        .filter((s) =>
          filters.subscriptionStatus
            ? s.subscriptionStatus === filters.subscriptionStatus
            : true
        )
        .filter((s) =>
          filters.purchaseDateFrom
            ? (s.purchaseDate ? s.purchaseDate.split('T')[0] : '') >=
              filters.purchaseDateFrom
            : true
        )
        .filter((s) =>
          filters.purchaseDateTo
            ? (s.purchaseDate ? s.purchaseDate.split('T')[0] : '') <=
              filters.purchaseDateTo
            : true
        )

        // Ordenar activos primero
        .sort((a, b) => {
          if (
            a.subscriptionStatus === 'active' &&
            b.subscriptionStatus !== 'active'
          )
            return -1;
          if (
            a.subscriptionStatus !== 'active' &&
            b.subscriptionStatus === 'active'
          )
            return 1;
          return 0;
        })
    );
  };

  const sortedStudents = getFilteredSortedStudents();

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(sortedStudents.length / limit)));
  }, [sortedStudents, limit]);

  const paginatedStudents = sortedStudents.slice(
    (page - 1) * limit,
    page * limit
  );

  function CustomFieldForm({ selectedUserId }: { selectedUserId: string }) {
    const [fieldKey, setFieldKey] = useState('');
    const [fieldValue, setFieldValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          '/api/super-admin/enroll_user_program/newTable',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: selectedUserId,
              fieldKey,
              fieldValue,
            }),
          }
        );

        if (res.ok) {
          alert('Campo personalizado agregado');
          setFieldKey('');
          setFieldValue('');
        } else {
          const json: unknown = await res.json();
          const errorData = errorResponseSchema.parse(json);
          alert('Error: ' + errorData.error);
        }
      } catch (err) {
        console.error(err);
        alert('Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Clave"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          className="rounded border border-gray-700 bg-gray-800 p-2"
        />
        <input
          type="text"
          placeholder="Valor"
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          className="rounded border border-gray-700 bg-gray-800 p-2"
        />
        <button
          disabled={loading || !fieldKey || !fieldValue}
          onClick={handleSubmit}
          className="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Agregar'}
        </button>
      </div>
    );
  }

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const handleEnroll = async () => {
    try {
      const response = await fetch('/api/super-admin/enroll_user_program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedStudents,
          courseIds: selectedCourses,
        }),
      });

      const json: unknown = await response.json();

      if (response.ok) {
        alert('Estudiantes matriculados exitosamente');
        setSelectedStudents([]);
        setSelectedCourses([]);
        setShowModal(false);
      } else {
        const errorData = errorResponseSchema.parse(json);
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error al matricular:', err);
      alert('Error inesperado al matricular estudiantes');
    }
  };

  const updateStudentField = async (
    userId: string,
    field: string,
    value: string
  ) => {
    const student = students.find((s) => s.id === userId);
    if (!student) return;

    const updatedStudent = { ...student };

    if (field.startsWith('customFields.')) {
      const key = field.split('.')[1];
      updatedStudent.customFields = {
        ...updatedStudent.customFields,
        [key]: value,
      };
    } else {
      (updatedStudent as any)[field] = value;
    }

    const [firstName, ...lastNameParts] = updatedStudent.name.split(' ');
    const lastName = lastNameParts.join(' ');

    const res = await fetch('/api/super-admin/udateUser/updateUserDinamic', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: updatedStudent.id,
        firstName: firstName || '',
        lastName: lastName || '',
        role: updatedStudent.role || 'estudiante',
        status: updatedStudent.subscriptionStatus,
        permissions: [],
        phone: updatedStudent.phone,
        address: updatedStudent.address,
        city: updatedStudent.city,
        country: updatedStudent.country,
        birthDate: updatedStudent.birthDate,
        planType: updatedStudent.planType,
        purchaseDate: updatedStudent.purchaseDate,
        subscriptionEndDate: updatedStudent.subscriptionEndDate
          ? new Date(updatedStudent.subscriptionEndDate)
              .toISOString()
              .split('T')[0]
          : null,
        customFields: updatedStudent.customFields || {},
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`❌ Error al guardar: ${data.error}`);
    } else {
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? updatedStudent : s))
      );
    }
  };
  return (
    <div className="min-h-screen space-y-8 bg-gray-900 p-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matricular Estudiantes</h1>

        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="rounded-md bg-gray-700 px-4 py-2 hover:bg-gray-600"
          >
            ⚙️ Columnas
          </button>

          {showColumnSelector && (
            <div className="absolute right-0 z-50 mt-2 rounded-md bg-gray-800 p-4 shadow-lg">
              <h3 className="mb-2 font-semibold">Mostrar columnas</h3>
              <div className="space-y-2">
                {totalColumns.map((col) => (
                  <label key={col.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.id)}
                      onChange={() => {
                        setVisibleColumns((prev) =>
                          prev.includes(col.id)
                            ? prev.filter((id) => id !== col.id)
                            : [...prev, col.id]
                        );
                      }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <input
          type="text"
          placeholder="Nombre"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="rounded border border-gray-700 bg-gray-800 p-2"
        />
        <input
          type="email"
          placeholder="Correo"
          value={filters.email}
          onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          className="rounded border border-gray-700 bg-gray-800 p-2"
        />
        <select
          value={filters.subscriptionStatus}
          onChange={(e) =>
            setFilters({ ...filters, subscriptionStatus: e.target.value })
          }
          className="rounded border border-gray-700 bg-gray-800 p-2"
        >
          <option value="">Estado</option>
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
        </select>
        <input
          type="date"
          value={filters.purchaseDateFrom}
          onChange={(e) =>
            setFilters({ ...filters, purchaseDateFrom: e.target.value })
          }
          className="rounded border border-gray-700 bg-gray-800 p-2"
        />

        <input
          type="date"
          value={filters.purchaseDateTo}
          onChange={(e) =>
            setFilters({ ...filters, purchaseDateTo: e.target.value })
          }
          className="rounded border border-gray-700 bg-gray-800 p-2"
        />

        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="rounded border border-gray-700 bg-gray-800 p-2"
        >
          <option value="">Todos los programas</option>
          {Array.from(
            new Set(students.flatMap((s) => s.programTitles ?? []))
          ).map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de estudiantes */}
      <div>
        <h2 className="mb-2 text-xl font-semibold">Seleccionar Estudiantes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-gray-700 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] text-white">
                <th className="w-12 px-2 py-3">
                  <input
                    type="checkbox"
                    checked={
                      paginatedStudents.length > 0 &&
                      paginatedStudents.every((s) =>
                        selectedStudents.includes(s.id)
                      )
                    }
                    onChange={(e) =>
                      setSelectedStudents(
                        e.target.checked
                          ? Array.from(
                              new Set([
                                ...selectedStudents,
                                ...paginatedStudents.map((s) => s.id),
                              ])
                            )
                          : selectedStudents.filter(
                              (id) =>
                                !paginatedStudents.find((s) => s.id === id)
                            )
                      )
                    }
                    className="rounded border-white/20"
                  />
                </th>
                {totalColumns
                  .filter((col) => visibleColumns.includes(col.id))
                  .map((col) => (
                    <th key={col.id} className="px-4 py-2">
                      <div className="space-y-2">
                        <div>{col.label}</div>
                        {col.type === 'select' ? (
                          <select
                            value={columnFilters[col.id] || ''}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [col.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded bg-gray-700 p-1 text-sm"
                          >
                            <option value="">Todos</option>
                            {col.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={col.type}
                            value={columnFilters[col.id] || ''}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [col.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded bg-gray-700 p-1 text-sm"
                            placeholder={`Filtrar ${col.label.toLowerCase()}...`}
                          />
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-800">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() =>
                        setSelectedStudents((prev) =>
                          prev.includes(student.id)
                            ? prev.filter((id) => id !== student.id)
                            : [...prev, student.id]
                        )
                      }
                    />
                  </td>
                  {totalColumns
                    .filter((col) => visibleColumns.includes(col.id))
                    .map((col) => {
                      let value: string = '';

                      if (col.id.startsWith('customFields.')) {
                        const key = col.id.split('.')[1];
                        value = student.customFields?.[key] ?? '';
                      } else {
                        const fieldValue = student[col.id as keyof Student];
                        value = fieldValue ? safeToString(fieldValue) : '';
                      }

                      if (col.type === 'date' && value) {
                        const parsedDate = new Date(value);
                        if (!isNaN(parsedDate.getTime())) {
                          value = parsedDate.toISOString().split('T')[0];
                        }
                      }

                      return (
                        <td key={col.id} className="px-4 py-2">
                          {col.type === 'select' && col.options ? (
                            <select
                              defaultValue={value}
                              onBlur={(e) =>
                                updateStudentField(
                                  student.id,
                                  col.id,
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    (e.target as HTMLSelectElement).value
                                  );
                                  e.currentTarget.blur();
                                }
                              }}
                              className="w-full rounded bg-gray-800 p-1 text-white"
                            >
                              {col.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type === 'date' ? 'date' : 'text'}
                              defaultValue={value}
                              onBlur={(e) =>
                                updateStudentField(
                                  student.id,
                                  col.id,
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateStudentField(
                                    student.id,
                                    col.id,
                                    (e.target as HTMLInputElement).value
                                  );
                                  e.currentTarget.blur();
                                }
                              }}
                              className="w-full rounded bg-gray-800 p-1 text-white"
                            />
                          )}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="rounded bg-gray-700 px-3 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
          .map((n, i, arr) => (
            <span key={n} className="px-1">
              {arr[i - 1] && n - arr[i - 1] > 1 && '...'}
              <button
                onClick={() => goToPage(n)}
                className={`rounded px-2 py-1 ${
                  page === n ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                {n}
              </button>
            </span>
          ))}
        <input
          type="number"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          placeholder="Ir a"
          className="w-20 rounded bg-gray-800 px-2 py-1 text-white"
        />
        <button
          onClick={() => {
            const n = parseInt(pageInput);
            if (!isNaN(n)) goToPage(n);
            setPageInput('');
          }}
          className="rounded bg-gray-700 px-2 py-1"
        >
          Ir
        </button>
      </div>
      {selectedStudents.length === 1 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Añadir campo personalizado</h2>
          <CustomFieldForm selectedUserId={selectedStudents[0]} />
        </div>
      )}

      {/* Botón de modal */}
      <button
        disabled={selectedStudents.length === 0}
        onClick={() => {
          setSelectedCourses([]);
          setShowModal(true);
        }}
        className="mt-4 rounded bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Matricular a curso
      </button>
      <button
        onClick={downloadSelectedAsExcel}
        className="rounded bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
        disabled={selectedStudents.length === 0}
      >
        Descargar seleccionados en Excel
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-gray-800 p-6">
            <h3 className="text-lg font-semibold">
              Matricular {selectedStudents.length} estudiante(s)
            </h3>

            {/* Lista de estudiantes seleccionados */}
            <div className="max-h-32 overflow-y-auto rounded border border-gray-600 p-2 text-sm text-gray-300">
              {students
                .filter((s) => selectedStudents.includes(s.id))
                .map((s) => (
                  <div key={s.id}>{s.name}</div>
                ))}
            </div>

            {/* Selector de cursos con búsqueda */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Seleccionar Cursos
              </label>
              <input
                type="text"
                placeholder="Buscar curso..."
                className="mb-2 w-full rounded bg-gray-700 p-2 text-white"
                onChange={(e) => {
                  const term = e.target.value.toLowerCase();
                  const filtered = availableCourses.filter((c) =>
                    c.title.toLowerCase().includes(term)
                  );
                  setFilteredCourseResults(filtered);
                }}
              />

              <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-gray-600 bg-gray-700 p-2">
                {(filteredCourseResults.length > 0
                  ? filteredCourseResults
                  : availableCourses
                ).map((c) => (
                  <div
                    key={c.id}
                    className={`cursor-pointer rounded px-2 py-1 ${
                      selectedCourses.includes(c.id)
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-600'
                    }`}
                    onClick={() =>
                      setSelectedCourses((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id]
                      )
                    }
                  >
                    {c.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded bg-gray-700 px-4 py-2"
              >
                Cancelar
              </button>
              <button
                disabled={selectedCourses.length === 0}
                onClick={handleEnroll}
                className="rounded bg-blue-600 px-4 py-2 font-semibold disabled:opacity-40"
              >
                Matricular
              </button>
            </div>
          </div>
          {/* Modal para agregar campos personalizados */}
        </div>
      )}
    </div>
  );
}
