'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BookOpen,
  Check,
  Layers,
  Loader2,
  Search,
  User as UserIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface AssignUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignCourse {
  id: string;
  title: string;
  instructor?: string;
  modalidad?: { name: string };
}

interface AssignProgram {
  id: string;
  title: string;
}

interface AssignStudentsModalProps {
  isOpen: boolean;
  users: AssignUser[];
  onClose: () => void;
  onAssigned?: () => void;
}

interface EnrollResult {
  success: boolean;
  message: string;
  alreadyEnrolledCourse?: { userId: string; userName: string }[];
  alreadyEnrolledProgram?: { userId: string; userName: string }[];
}

interface AssignResult {
  newlyEnrolledCount: number;
  alreadyEnrolledNames: string[];
  targetName: string;
  targetType: 'curso' | 'programa' | 'ambos';
}

const normalize = (str: string) =>
  str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

interface RawCourseData {
  id: string | number;
  title: string;
  instructor?: string;
  instructorName?: string;
  modalidad?: { name: string };
  modalidadesid?: string | number;
}

interface RawProgramData {
  id: string | number;
  title: string;
}

function isValidCourseArray(data: unknown): data is RawCourseData[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'title' in item &&
        (typeof (item as { id: unknown }).id === 'string' ||
          typeof (item as { id: unknown }).id === 'number') &&
        typeof (item as { title: unknown }).title === 'string'
    )
  );
}

function isValidProgramArray(data: unknown): data is RawProgramData[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'title' in item &&
        (typeof (item as { id: unknown }).id === 'string' ||
          typeof (item as { id: unknown }).id === 'number') &&
        typeof (item as { title: unknown }).title === 'string'
    )
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1.5 p-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[52px] animate-pulse rounded-lg bg-gray-800/70"
        />
      ))}
    </div>
  );
}

export function AssignStudentsModal({
  isOpen,
  users,
  onClose,
  onAssigned,
}: AssignStudentsModalProps) {
  // Estudiantes
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Plan + pestaña de contenido
  const [selectedPlanType, setSelectedPlanType] = useState<
    'Pro' | 'Premium' | 'Enterprise'
  >('Premium');
  const [assignContentTab, setAssignContentTab] = useState<
    'courses' | 'programs'
  >('courses');

  // Selección exclusiva
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Cursos (exclusivos del modal)
  const [assignCourses, setAssignCourses] = useState<AssignCourse[]>([]);
  const [assignCoursesLoading, setAssignCoursesLoading] = useState(false);
  const [assignCoursesError, setAssignCoursesError] = useState<string | null>(
    null
  );
  const [courseSearch, setCourseSearch] = useState('');

  // Programas (exclusivos del modal)
  const [assignPrograms, setAssignPrograms] = useState<AssignProgram[]>([]);
  const [assignProgramsLoading, setAssignProgramsLoading] = useState(false);
  const [assignProgramsError, setAssignProgramsError] = useState<string | null>(
    null
  );
  const [programSearch, setProgramSearch] = useState('');

  const [assigningStudents, setAssigningStudents] = useState(false);
  const [assignResult, setAssignResult] = useState<AssignResult | null>(null);

  // Relación curso-programa (tabla materias), para filtrar cruzado y
  // permitir seleccionar ambos solo cuando el curso pertenece al programa.
  const [materias, setMaterias] = useState<
    { courseId: string; programaId: string }[]
  >([]);

  const loadMaterias = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/super-admin/materias', { signal });
      if (!response.ok) return;
      const rawData: unknown = await response.json();
      if (
        !Array.isArray(rawData) ||
        !rawData.every(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            'courseid' in item &&
            'programaId' in item
        )
      ) {
        return;
      }
      const normalized = (
        rawData as { courseid: string | number; programaId: string | number }[]
      ).map((m) => ({
        courseId: String(m.courseid),
        programaId: String(m.programaId),
      }));
      setMaterias(normalized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('[AssignModal] Error cargando materias:', error);
    }
  }, []);

  const isCourseInProgram = useCallback(
    (courseId: string, programId: string) =>
      materias.some(
        (m) => m.courseId === courseId && m.programaId === programId
      ),
    [materias]
  );

  const loadAssignCourses = useCallback(async (signal?: AbortSignal) => {
    setAssignCoursesLoading(true);
    setAssignCoursesError(null);
    try {
      const response = await fetch('/api/super-admin/courses', { signal });
      if (!response.ok) {
        throw new Error(`Error ${response.status} cargando cursos`);
      }
      const rawData: unknown = await response.json();
      if (!isValidCourseArray(rawData)) {
        throw new Error('Formato inválido de cursos');
      }
      const normalized = Array.from(
        new Map(
          rawData.map((c) => [
            String(c.id),
            {
              id: String(c.id),
              title: c.title,
              instructor: c.instructorName ?? c.instructor ?? undefined,
              modalidad:
                c.modalidad ??
                (c.modalidadesid
                  ? { name: String(c.modalidadesid) }
                  : undefined),
            },
          ])
        ).values()
      );
      setAssignCourses(normalized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('[AssignModal] Error cargando cursos:', error);
      setAssignCourses([]);
      setAssignCoursesError('No fue posible cargar los cursos.');
    } finally {
      setAssignCoursesLoading(false);
    }
  }, []);

  const loadAssignPrograms = useCallback(async (signal?: AbortSignal) => {
    setAssignProgramsLoading(true);
    setAssignProgramsError(null);
    try {
      const response = await fetch(
        '/api/super-admin/programs/enrollInProgram',
        { signal }
      );
      if (!response.ok) {
        throw new Error(`Error ${response.status} cargando programas`);
      }
      const rawData: unknown = await response.json();
      if (!isValidProgramArray(rawData)) {
        throw new Error('Formato inválido de programas');
      }
      const normalized = Array.from(
        new Map(
          rawData.map((p) => [
            String(p.id),
            { id: String(p.id), title: p.title },
          ])
        ).values()
      );
      setAssignPrograms(normalized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('[AssignModal] Error cargando programas:', error);
      setAssignPrograms([]);
      setAssignProgramsError('No fue posible cargar los programas.');
    } finally {
      setAssignProgramsLoading(false);
    }
  }, []);

  // Cargar cursos y programas del modal solo cuando se abre, en paralelo,
  // sin que un fallo borre los resultados del otro.
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    void Promise.allSettled([
      loadAssignCourses(controller.signal),
      loadAssignPrograms(controller.signal),
      loadMaterias(controller.signal),
    ]);

    return () => controller.abort();
  }, [isOpen, loadAssignCourses, loadAssignPrograms, loadMaterias]);

  useEffect(() => {
    if (isOpen) {
      setAssignResult(null);
    }
  }, [isOpen]);

  const filteredAssignStudents = useMemo(() => {
    const q = normalize(studentSearch.trim());
    if (!q) return users;
    return users.filter((u) =>
      normalize(`${u.firstName} ${u.lastName} ${u.email}`).includes(q)
    );
  }, [users, studentSearch]);

  const filteredAssignCourses = useMemo(() => {
    const q = normalize(courseSearch.trim());
    const base = selectedProgram
      ? assignCourses.filter((c) => isCourseInProgram(c.id, selectedProgram))
      : assignCourses;
    if (!q) return base;
    return base.filter((c) =>
      normalize(
        `${c.title} ${c.instructor ?? ''} ${c.modalidad?.name ?? ''}`
      ).includes(q)
    );
  }, [assignCourses, courseSearch, selectedProgram, isCourseInProgram]);

  const filteredAssignPrograms = useMemo(() => {
    const q = normalize(programSearch.trim());
    const base = selectedCourse
      ? assignPrograms.filter((p) => isCourseInProgram(selectedCourse, p.id))
      : assignPrograms;
    if (!q) return base;
    return base.filter((p) => normalize(p.title).includes(q));
  }, [assignPrograms, programSearch, selectedCourse, isCourseInProgram]);

  // Conteos de las pestañas: reflejan el filtro cruzado (curso ↔ programa)
  // pero no el texto de búsqueda, para no confundir mientras se escribe.
  const coursesTabCount = selectedProgram
    ? assignCourses.filter((c) => isCourseInProgram(c.id, selectedProgram))
        .length
    : assignCourses.length;
  const programsTabCount = selectedCourse
    ? assignPrograms.filter((p) => isCourseInProgram(selectedCourse, p.id))
        .length
    : assignPrograms.length;

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = (checked: boolean) => {
    setSelectedStudents(checked ? filteredAssignStudents.map((u) => u.id) : []);
  };

  const selectedCourseTitle = assignCourses.find(
    (c) => c.id === selectedCourse
  )?.title;
  const selectedProgramTitle = assignPrograms.find(
    (p) => p.id === selectedProgram
  )?.title;

  // Se puede elegir curso y programa a la vez, solo si el curso pertenece
  // al programa (según la tabla materias); de lo contrario es exclusivo.
  const bothSelectedValid =
    !!selectedCourse &&
    !!selectedProgram &&
    isCourseInProgram(selectedCourse, selectedProgram);
  const bothSelectedInvalid =
    !!selectedCourse && !!selectedProgram && !bothSelectedValid;

  const canAssign =
    selectedStudents.length > 0 &&
    (!!selectedCourse || !!selectedProgram) &&
    !bothSelectedInvalid &&
    !assigningStudents;

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    if (selectedProgram && !isCourseInProgram(courseId, selectedProgram)) {
      setSelectedProgram(null);
    }
  };

  const handleSelectProgram = (programId: string) => {
    setSelectedProgram(programId);
    if (selectedCourse && !isCourseInProgram(selectedCourse, programId)) {
      setSelectedCourse(null);
    }
  };

  const handleAssign = async () => {
    if (!canAssign) return;
    setAssigningStudents(true);
    try {
      const payload: {
        userIds: string[];
        planType: 'Pro' | 'Premium' | 'Enterprise';
        courseId?: string;
        programId?: string;
      } = {
        userIds: selectedStudents,
        planType: selectedPlanType,
      };
      if (selectedCourse) payload.courseId = selectedCourse;
      if (selectedProgram) payload.programId = selectedProgram;

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Error during enrollment');

      const rawResult: unknown = await response.json();
      if (
        typeof rawResult !== 'object' ||
        rawResult === null ||
        !('success' in rawResult)
      ) {
        throw new Error('Invalid response format');
      }
      const result = rawResult as EnrollResult;

      const alreadyNames = Array.from(
        new Set(
          [
            ...(result.alreadyEnrolledCourse ?? []),
            ...(result.alreadyEnrolledProgram ?? []),
          ].map((a) => a.userName)
        )
      );
      const newlyEnrolledCount = selectedStudents.length - alreadyNames.length;

      const targetName =
        selectedCourse && selectedProgram
          ? `${selectedCourseTitle ?? ''} y ${selectedProgramTitle ?? ''}`
          : ((selectedCourse ? selectedCourseTitle : selectedProgramTitle) ??
            '');

      setAssignResult({
        newlyEnrolledCount,
        alreadyEnrolledNames: alreadyNames,
        targetName,
        targetType:
          selectedCourse && selectedProgram
            ? 'ambos'
            : selectedCourse
              ? 'curso'
              : 'programa',
      });

      setSelectedStudents([]);
      setSelectedCourse(null);
      setSelectedProgram(null);
      setStudentSearch('');
      setCourseSearch('');
      setProgramSearch('');

      onAssigned?.();
    } catch (error) {
      console.error('Error assigning students:', error);
      toast.error('Error al matricular estudiantes.');
    } finally {
      setAssigningStudents(false);
    }
  };

  const handleClose = () => {
    setStudentSearch('');
    setCourseSearch('');
    setProgramSearch('');
    setAssignResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const summaryText =
    selectedCourse && selectedProgram
      ? `Curso: ${selectedCourseTitle ?? '—'} + Programa: ${selectedProgramTitle ?? '—'}`
      : selectedCourse
        ? `Curso: ${selectedCourseTitle ?? '—'}`
        : selectedProgram
          ? `Programa: ${selectedProgramTitle ?? '—'}`
          : 'Sin curso ni programa seleccionado';

  const primaryLabel = assigningStudents
    ? 'Asignando...'
    : selectedCourse && selectedProgram
      ? `Asignar curso y programa a ${selectedStudents.length} estudiante(s)`
      : selectedCourse
        ? `Asignar curso a ${selectedStudents.length} estudiante(s)`
        : selectedProgram
          ? `Asignar programa a ${selectedStudents.length} estudiante(s)`
          : 'Asignar Estudiantes';

  return (
    <div
      className="
        fixed inset-0 z-[100] flex items-center justify-center bg-black/50
        p-4 backdrop-blur-md
      "
    >
      <div
        className="
          flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl bg-gray-900
          shadow-2xl
        "
      >
        {/* Header fijo */}
        <div
          className="
            flex items-center justify-between border-b border-gray-700
            bg-gray-800 px-4 py-2
            sm:px-6
          "
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white sm:text-base">
              Asignar a Curso o Programa
            </h2>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
              {selectedStudents.length} seleccionado(s)
            </span>
          </div>
          <button
            onClick={handleClose}
            className="
              rounded-lg bg-white/10 p-1.5 transition-colors
              hover:bg-white/20
            "
          >
            <X className="size-4 text-white" />
          </button>
        </div>

        {/* Mensaje persistente de resultado */}
        {assignResult && (
          <div className="mx-4 mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100 sm:mx-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                {assignResult.newlyEnrolledCount > 0 && (
                  <p>
                    ✅ Se matricularon {assignResult.newlyEnrolledCount}{' '}
                    estudiante(s){' '}
                    {assignResult.targetType === 'curso'
                      ? 'al curso'
                      : assignResult.targetType === 'programa'
                        ? 'al programa'
                        : 'al curso y programa'}{' '}
                    &quot;{assignResult.targetName}&quot;.
                  </p>
                )}
                {assignResult.alreadyEnrolledNames.length > 0 && (
                  <p>
                    ⚠️ {assignResult.alreadyEnrolledNames.length} estudiante(s)
                    ya estaban matriculado(s):{' '}
                    {assignResult.alreadyEnrolledNames.join(', ')}.
                  </p>
                )}
                {assignResult.newlyEnrolledCount === 0 &&
                  assignResult.alreadyEnrolledNames.length === 0 && (
                    <p>Matrícula procesada.</p>
                  )}
              </div>
              <button
                onClick={() => setAssignResult(null)}
                className="shrink-0 rounded-md p-1 text-cyan-200 hover:bg-white/10"
                title="Cerrar mensaje"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Contenido: dos columnas en escritorio */}
        <div
          className="
            grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4
            sm:p-6
            lg:grid-cols-2
          "
        >
          {/* Columna izquierda: estudiantes */}
          <div className="flex min-h-0 flex-col rounded-lg bg-gray-800 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
                <UserIcon className="size-4 text-cyan-400" />
                Estudiantes
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-gray-400">
                Plan
                <select
                  value={selectedPlanType}
                  onChange={(e) =>
                    setSelectedPlanType(
                      e.target.value as 'Pro' | 'Premium' | 'Enterprise'
                    )
                  }
                  className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white"
                >
                  <option value="Pro">Pro</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </label>
            </div>
            <p className="mb-3 text-xs text-gray-400">
              {selectedStudents.length} seleccionado(s)
            </p>

            <div className="relative mb-2">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                className="
                  w-full rounded-lg border border-gray-700 bg-gray-900 py-2
                  pr-3 pl-8 text-sm text-white
                  placeholder:text-gray-500
                "
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            <label
              className="
                mb-2 flex cursor-pointer items-center justify-between
                rounded-lg bg-gray-700 px-3 py-2 text-sm text-white
                hover:bg-gray-600
              "
            >
              <span>Seleccionar todos los resultados</span>
              <input
                type="checkbox"
                checked={
                  filteredAssignStudents.length > 0 &&
                  filteredAssignStudents.every((u) =>
                    selectedStudents.includes(u.id)
                  )
                }
                onChange={(e) => selectAllFiltered(e.target.checked)}
                className="size-4 rounded accent-cyan-500"
              />
            </label>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900">
              {users.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  No hay usuarios disponibles.
                </p>
              ) : filteredAssignStudents.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  No encontramos estudiantes con esa búsqueda.
                </p>
              ) : (
                <ul className="divide-y divide-gray-800">
                  {filteredAssignStudents.map((user) => {
                    const isSelected = selectedStudents.includes(user.id);
                    return (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => toggleStudent(user.id)}
                          className={`
                            flex h-[52px] w-full items-center gap-2 border-l-2
                            px-3 text-left transition-colors
                            ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/10'
                                : 'border-transparent hover:bg-gray-800'
                            }
                          `}
                        >
                          <div
                            className="
                              flex size-8 shrink-0 items-center justify-center
                              rounded-full bg-cyan-500/20 text-xs
                              font-semibold text-cyan-300
                            "
                          >
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            readOnly
                            checked={isSelected}
                            className="size-4 shrink-0 rounded accent-cyan-500"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Columna derecha: cursos/programas */}
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssignContentTab('courses')}
                className={`
                  flex flex-1 items-center justify-center gap-1.5
                  rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                  ${
                    assignContentTab === 'courses'
                      ? 'bg-cyan-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                <BookOpen className="size-3.5" />
                Cursos · {coursesTabCount}
              </button>
              <button
                type="button"
                onClick={() => setAssignContentTab('programs')}
                className={`
                  flex flex-1 items-center justify-center gap-1.5
                  rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                  ${
                    assignContentTab === 'programs'
                      ? 'bg-cyan-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                <Layers className="size-3.5" />
                Programas · {programsTabCount}
              </button>
            </div>

            {/* Indicador de selección cruzada */}
            {assignContentTab === 'courses' && selectedProgram && (
              <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-2 text-xs text-gray-300">
                <span>Programa seleccionado: {selectedProgramTitle}</span>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white"
                >
                  <X className="size-3" />
                  Limpiar selección
                </button>
              </div>
            )}
            {assignContentTab === 'programs' && selectedCourse && (
              <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-2 text-xs text-gray-300">
                <span>Curso seleccionado: {selectedCourseTitle}</span>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white"
                >
                  <X className="size-3" />
                  Limpiar selección
                </button>
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-gray-800 p-3">
              {assignContentTab === 'courses' ? (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar curso..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="
                        w-full rounded-lg border border-gray-700 bg-gray-900
                        py-2 pr-3 pl-8 text-sm text-white
                        placeholder:text-gray-500
                      "
                    />
                  </div>
                  <div className="max-h-[380px] min-h-[220px] flex-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900">
                    {assignCoursesLoading ? (
                      <SkeletonRows />
                    ) : assignCoursesError ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                        <p className="text-sm text-red-400">
                          {assignCoursesError}
                        </p>
                        <button
                          onClick={() => void loadAssignCourses()}
                          className="rounded-md border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : assignCourses.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">
                        No hay cursos disponibles.
                      </p>
                    ) : filteredAssignCourses.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">
                        No encontramos cursos con esa búsqueda.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-800">
                        {filteredAssignCourses.map((course) => {
                          const isSelected = selectedCourse === course.id;
                          return (
                            <li key={course.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectCourse(course.id)}
                                className={`
                                  flex w-full items-center gap-2 border-l-2
                                  px-3 py-2 text-left transition-colors
                                  ${
                                    isSelected
                                      ? 'border-cyan-400 bg-cyan-500/10'
                                      : 'border-transparent hover:bg-gray-800'
                                  }
                                `}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {course.title}
                                  </p>
                                  {(course.instructor ??
                                    course.modalidad?.name) && (
                                    <p className="truncate text-xs text-gray-400">
                                      {[
                                        course.instructor,
                                        course.modalidad?.name,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </p>
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  readOnly
                                  checked={isSelected}
                                  className="size-4 shrink-0 accent-cyan-500"
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar programa..."
                      value={programSearch}
                      onChange={(e) => setProgramSearch(e.target.value)}
                      className="
                        w-full rounded-lg border border-gray-700 bg-gray-900
                        py-2 pr-3 pl-8 text-sm text-white
                        placeholder:text-gray-500
                      "
                    />
                  </div>
                  <div className="max-h-[380px] min-h-[220px] flex-1 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900">
                    {assignProgramsLoading ? (
                      <SkeletonRows />
                    ) : assignProgramsError ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                        <p className="text-sm text-red-400">
                          {assignProgramsError}
                        </p>
                        <button
                          onClick={() => void loadAssignPrograms()}
                          className="rounded-md border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : assignPrograms.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">
                        No hay programas disponibles.
                      </p>
                    ) : filteredAssignPrograms.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">
                        No encontramos programas con esa búsqueda.
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-800">
                        {filteredAssignPrograms.map((program) => {
                          const isSelected = selectedProgram === program.id;
                          return (
                            <li key={program.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectProgram(program.id)}
                                className={`
                                  flex w-full items-center gap-2 border-l-2
                                  px-3 py-2 text-left transition-colors
                                  ${
                                    isSelected
                                      ? 'border-cyan-400 bg-cyan-500/10'
                                      : 'border-transparent hover:bg-gray-800'
                                  }
                                `}
                              >
                                <span className="min-w-0 flex-1 truncate text-sm text-white">
                                  {program.title}
                                </span>
                                <input
                                  type="radio"
                                  readOnly
                                  checked={isSelected}
                                  className="size-4 shrink-0 accent-cyan-500"
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div
          className="
            flex flex-col gap-2 border-t border-gray-700 bg-gray-800 px-4
            py-3
            sm:flex-row sm:items-center sm:justify-between sm:px-6
          "
        >
          <div className="text-xs text-gray-400">
            {selectedStudents.length} estudiante(s) · Plan {selectedPlanType} ·{' '}
            {summaryText}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="
                rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold
                text-white
                hover:bg-gray-600
              "
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleAssign()}
              disabled={!canAssign}
              className="
                flex items-center justify-center gap-2 rounded-lg
                bg-cyan-500 px-4 py-2 text-sm font-semibold text-black
                hover:bg-cyan-400
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              {assigningStudents ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
