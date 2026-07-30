'use client';
import { useEffect, useState } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '~/components/educators/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { Progress } from '~/components/educators/ui/progress';
import { Zone } from '~/components/ZoneForumSA/Zone';

const coursesSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    coverImageKey: z.string(),
  })
);

type CoursesModels = z.infer<typeof coursesSchema>[number];

const guidedProjectsSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
  })
);

type GuidedProjectModel = z.infer<typeof guidedProjectsSchema>[number];

type OwnerType = 'course' | 'guidedProject';

const ForumHome = () => {
  const { user } = useUser();
  const [ownerType, setOwnerType] = useState<OwnerType>('course');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [guidedProjectId, setGuidedProjectId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courses, setCourses] = useState<CoursesModels[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [guidedProjects, setGuidedProjects] = useState<GuidedProjectModel[]>(
    []
  );
  const [loadingGuidedProjects, setLoadingGuidedProjects] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [searchCourse, setSearchCourse] = useState('');
  const [showCourseList, setShowCourseList] = useState(false);
  const [searchGuidedProject, setSearchGuidedProject] = useState('');
  const [showGuidedProjectList, setShowGuidedProjectList] = useState(false);

  const resetForm = () => {
    setCourseId(null);
    setGuidedProjectId(null);
    setTitle('');
    setDescription('');
    setCoverImage(null);
    setDocumentFile(null);
    setSearchCourse('');
    setSearchGuidedProject('');
    setOwnerType('course');
  };

  const handleCreateForum = async () => {
    if (!user) return;

    // Validar campos obligatorios
    if (ownerType === 'course' && (!courseId || courseId <= 0)) {
      toast.error('Debes seleccionar un curso válido');
      return;
    }
    if (
      ownerType === 'guidedProject' &&
      (!guidedProjectId || guidedProjectId <= 0)
    ) {
      toast.error('Debes seleccionar un proyecto guiado válido');
      return;
    }
    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    const userId = user.id;

    try {
      setUploadProgress(60);

      const formData = new FormData();
      if (ownerType === 'course') {
        formData.append('courseId', String(courseId));
      } else {
        formData.append('guidedProjectId', String(guidedProjectId));
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('userId', userId);
      if (coverImage) formData.append('coverImage', coverImage);
      if (documentFile) formData.append('documentFile', documentFile);

      const response = await fetch('/api/forums', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(100);
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(errorBody?.message ?? 'Error al crear el foro');
      }
      await response.json();

      toast.success('Foro creado exitosamente!');
      setIsDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al crear el foro:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el foro'
      );
    } finally {
      setIsUploading(false);
      resetForm();
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      try {
        setLoadingCourses(true);
        const response = await fetch(
          `/api/educadores/courses?userId=${user.id}`
        );
        const json = (await response.json()) as unknown;
        const parsed = coursesSchema.parse(json);
        setCourses(parsed);
      } catch (error) {
        console.error('Error al obtener cursos:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    void fetchCourses();
  }, [user]);

  useEffect(() => {
    const fetchGuidedProjects = async () => {
      if (!user) return;
      try {
        setLoadingGuidedProjects(true);
        const response = await fetch('/api/guided-projects');
        const json = (await response.json()) as unknown;
        const parsed = guidedProjectsSchema.parse(json);
        setGuidedProjects(parsed);
      } catch (error) {
        console.error('Error al obtener proyectos guiados:', error);
      } finally {
        setLoadingGuidedProjects(false);
      }
    };

    void fetchGuidedProjects();
  }, [user]);

  return (
    <div
      className="
        min-h-screen bg-background px-4 py-8
        sm:px-6
        lg:px-10
      "
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <header
          className="
            mb-10 flex flex-col items-center justify-center gap-6
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          <h1
            className="
              text-center text-3xl font-extrabold tracking-tight text-primary
              sm:text-left sm:text-4xl
            "
          >
            Zona de Foros Artiefy
          </h1>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="
                  flex w-full max-w-xs items-center justify-center gap-2
                  rounded-md bg-primary px-5 py-2.5 text-sm font-semibold
                  text-black shadow-md transition-all duration-200
                  hover:bg-primary/90
                  sm:w-auto sm:max-w-none sm:text-base
                "
              >
                + Nuevo Foro
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-[#111] text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">
                  Crear Nuevo Foro
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-400">
                  Completa los campos para iniciar una nueva discusión.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Tipo de foro */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">
                    ¿Para qué es este foro?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOwnerType('course')}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                        ownerType === 'course'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/20 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      Curso
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerType('guidedProject')}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                        ownerType === 'guidedProject'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/20 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      Proyecto guiado
                    </button>
                  </div>
                </div>

                {/* Curso asociado */}
                {ownerType === 'course' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Curso asociado
                    </label>
                    {loadingCourses ? (
                      <p className="text-sm text-gray-400">
                        Cargando cursos...
                      </p>
                    ) : courses.length > 0 ? (
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Buscar o seleccionar un curso..."
                          value={searchCourse}
                          onChange={(e) => setSearchCourse(e.target.value)}
                          onFocus={() => setShowCourseList(true)}
                          className="text-white"
                        />
                        {showCourseList && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowCourseList(false)}
                            />
                            <div
                              className="
                                absolute z-20 mt-1 max-h-60 w-full overflow-auto
                                rounded-md border border-white/20 bg-[#111]
                                shadow-lg
                              "
                            >
                              {courses
                                .filter((c) =>
                                  c.title
                                    .toLowerCase()
                                    .includes(searchCourse.toLowerCase())
                                )
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setCourseId(c.id);
                                      setSearchCourse(c.title);
                                      setShowCourseList(false);
                                    }}
                                    className="
                                      w-full px-3 py-2 text-left text-sm
                                      text-white transition
                                      hover:bg-white/10
                                    "
                                  >
                                    {c.title}
                                  </button>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-red-500">
                        No tienes cursos disponibles.
                      </p>
                    )}
                  </div>
                )}

                {/* Proyecto guiado asociado */}
                {ownerType === 'guidedProject' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Proyecto guiado asociado
                    </label>
                    {loadingGuidedProjects ? (
                      <p className="text-sm text-gray-400">
                        Cargando proyectos guiados...
                      </p>
                    ) : guidedProjects.length > 0 ? (
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Buscar o seleccionar un proyecto guiado..."
                          value={searchGuidedProject}
                          onChange={(e) =>
                            setSearchGuidedProject(e.target.value)
                          }
                          onFocus={() => setShowGuidedProjectList(true)}
                          className="text-white"
                        />
                        {showGuidedProjectList && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowGuidedProjectList(false)}
                            />
                            <div
                              className="
                                absolute z-20 mt-1 max-h-60 w-full overflow-auto
                                rounded-md border border-white/20 bg-[#111]
                                shadow-lg
                              "
                            >
                              {guidedProjects
                                .filter((p) =>
                                  p.title
                                    .toLowerCase()
                                    .includes(searchGuidedProject.toLowerCase())
                                )
                                .map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setGuidedProjectId(p.id);
                                      setSearchGuidedProject(p.title);
                                      setShowGuidedProjectList(false);
                                    }}
                                    className="
                                      w-full px-3 py-2 text-left text-sm
                                      text-white transition
                                      hover:bg-white/10
                                    "
                                  >
                                    {p.title}
                                  </button>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-red-500">
                        No hay proyectos guiados disponibles.
                      </p>
                    )}
                  </div>
                )}

                {/* Título + Descripción */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm text-primary">
                      Título del foro
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej. Debate sobre técnica"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-primary">Descripción</label>
                    <Input
                      type="text"
                      placeholder="Breve descripción del foro"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-white"
                    />
                  </div>
                </div>

                {/* Instructor info */}
                <div
                  className="
                    rounded-md border border-primary bg-black/10 p-2 text-sm
                    text-primary
                  "
                >
                  Instructor: {user?.fullName}
                </div>

                {/* Imagen de portada + Documento adjunto */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-primary">
                      Imagen de portada (opcional)
                    </label>
                    <div className="mt-2 flex items-center gap-4">
                      <label
                        className="
                          cursor-pointer rounded-md bg-white/10 px-4 py-2
                          text-sm transition
                          hover:bg-white/20
                        "
                      >
                        Seleccionar imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setCoverImage(e.target.files?.[0] ?? null)
                          }
                          className="hidden"
                        />
                      </label>

                      {coverImage && (
                        <div className="relative">
                          <Image
                            src={URL.createObjectURL(coverImage)}
                            alt="Vista previa"
                            width={96}
                            height={96}
                            className="rounded-md object-cover"
                          />
                          <button
                            onClick={() => setCoverImage(null)}
                            className="
                              absolute top-0 right-0 flex size-5 items-center
                              justify-center rounded-full bg-black/60 text-xs
                              text-white
                            "
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documento adjunto */}
                  <div>
                    <label className="text-sm font-medium text-primary">
                      Documento adjunto (opcional)
                    </label>
                    <div className="mt-2 flex items-center gap-4">
                      <label
                        className="
                          cursor-pointer rounded-md bg-white/10 px-4 py-2
                          text-sm transition
                          hover:bg-white/20
                        "
                      >
                        Seleccionar documento
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) =>
                            setDocumentFile(e.target.files?.[0] ?? null)
                          }
                          className="hidden"
                        />
                      </label>

                      {documentFile && (
                        <div
                          className="
                            flex items-center gap-2 rounded-md border
                            border-white/20 bg-black/10 px-3 py-1 text-sm
                            text-white
                          "
                        >
                          📄 {documentFile.name}
                          <button
                            onClick={() => setDocumentFile(null)}
                            className="
                              ml-2 text-red-400 transition
                              hover:text-red-500
                            "
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="mt-2 text-center text-xs text-gray-400">
                    {uploadProgress}% completado
                  </p>
                </div>
              )}

              <DialogFooter
                className="
                  mt-6 flex flex-col-reverse gap-3
                  sm:flex-row sm:justify-end
                "
              >
                <Button
                  variant="outline"
                  className="
                    w-full border border-white/20 text-white
                    hover:bg-white/10
                    sm:w-auto
                  "
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateForum}
                  className="
                    w-full bg-green-500 text-white
                    hover:bg-green-600
                    sm:w-auto
                  "
                >
                  Crear Foro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="relative w-full">
          <input
            type="text"
            placeholder="Buscar foros o temas..."
            className="
              w-full rounded-md border border-gray-700 bg-[#111827] px-4 py-2
              pl-10 text-base text-gray-100 shadow-sm transition
              placeholder:text-gray-400
              focus:border-primary focus:ring-1 focus:ring-primary
            "
          />
          <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
        </div>

        <Zone />
      </div>
    </div>
  );
};

export default ForumHome;
