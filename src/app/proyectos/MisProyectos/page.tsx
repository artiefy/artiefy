'use client';

import React, { useState } from 'react';

import {
  Calendar,
  ExternalLink,
  Eye,
  Filter,
  Plus,
  Search,
  Tag,
  User,
} from 'lucide-react';

import { Header } from '~/components/estudiantes/layout/Header';
import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent, CardHeader } from '~/components/projects/ui/card';
import { Input } from '~/components/projects/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/projects/ui/select';

import ModalActividades from '../../../components/projects/Modals/ModalActividades';
import ModalJustificacion from '../../../components/projects/Modals/ModalJustificacion';
import ModalObjetivoGen from '../../../components/projects/Modals/ModalObjetivoGen';
import ModalObjetivosEsp from '../../../components/projects/Modals/ModalObjetivosEsp';
import ModalPlanteamiento from '../../../components/projects/Modals/ModalPlanteamiento';
import ModalResumen from '../../../components/projects/Modals/ModalResumen';

// Define la interfaz para los proyectos
interface Project {
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  coverImageKey?: string;
  type_project: string;
  userId: string;
  categoryId: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtuales para la UI:
  category?: string;
  tags?: string[];
  author?: string;
  views?: number;
  status?: string;
  date?: string;
  // Virtuales para la UI:
  title?: string;
  description?: string;
}

export default function ProyectosPage() {
  // Simula el usuario logeado (reemplaza por tu lógica real)
  const user = { id: '1', name: 'María González', email: 'maria@email.com' };

  const [planteamientoOpen, setPlanteamientoOpen] = React.useState(false);
  const [planteamientoTexto, setPlanteamientoTexto] = useState('');
  const [justificacionOpen, setJustificacionOpen] = React.useState(false);
  const [justificacionTexto, setJustificacionTexto] = useState('');
  const [objetivoGenOpen, setObjetivoGenOpen] = React.useState(false);
  const [objetivoGenTexto, setObjetivoGenTexto] = useState('');
  const [ObjetivosEspOpen, setObjetivosEspOpen] = React.useState(false);
  const [ObjetivosEspTexto, setObjetivosEspTexto] = useState<string[]>([]);
  const [actividadesOpen, setActividadesOpen] = React.useState(false);
  const [actividadesTexto, setActividadesTexto] = useState<string[]>([]);
  const [ResumenOpen, setResumenOpen] = React.useState(false);

  const handleConfirmarPlanteamiento = () => {
    setPlanteamientoOpen(false);
    setJustificacionOpen(true);
  };
  const handleAnteriorJustificacion = () => {
    setJustificacionOpen(false);
    setPlanteamientoOpen(true);
  };
  const handleConfirmarJustificacion = () => {
    setJustificacionOpen(false);
    setObjetivoGenOpen(true);
  };
  const handleAnteriorObjetivoGen = () => {
    setObjetivoGenOpen(false);
    setJustificacionOpen(true);
  };
  const handleConfirmarObjetivoGen = () => {
    setObjetivoGenOpen(false);
    setObjetivosEspOpen(true);
  };
  const handleAnteriorObjetivosEsp = () => {
    setObjetivosEspOpen(false);
    setObjetivoGenOpen(true);
  };
  const handleConfirmarObjetivosEsp = () => {
    setObjetivosEspOpen(false);
    setActividadesOpen(true);
  };
  const handleAnteriorActividades = () => {
    setActividadesOpen(false);
    setObjetivosEspOpen(true);
  };
  const handleConfirmarActividades = () => {
    setActividadesOpen(false);
    setResumenOpen(true);
  };

  // Estado para los proyectos cargados desde la BD
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Carga los proyectos donde userId coincide con el usuario actual
    fetch(`/api/proyectos?userId=${user.id}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setProjects(
            data.map((p: Record<string, unknown>) => ({
              // Campos obligatorios
              id: typeof p.id === 'number' ? p.id : 0,
              name: typeof p.name === 'string' ? p.name : '',
              planteamiento:
                typeof p.planteamiento === 'string' ? p.planteamiento : '',
              justificacion:
                typeof p.justificacion === 'string' ? p.justificacion : '',
              objetivo_general:
                typeof p.objetivo_general === 'string'
                  ? p.objetivo_general
                  : '',
              coverImageKey:
                typeof p.coverImageKey === 'string'
                  ? p.coverImageKey
                  : undefined,
              type_project:
                typeof p.type_project === 'string' ? p.type_project : '',
              userId: typeof p.userId === 'string' ? p.userId : '',
              categoryId: typeof p.categoryId === 'number' ? p.categoryId : 0,
              isPublic: typeof p.isPublic === 'boolean' ? p.isPublic : false,
              createdAt: typeof p.createdAt === 'string' ? p.createdAt : '',
              updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : '',
              // Virtuales para la UI
              category: typeof p.category === 'string' ? p.category : '',
              tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
              author: user.name,
              views: typeof p.views === 'number' ? p.views : 0,
              status: typeof p.status === 'string' ? p.status : 'En Desarrollo',
              date: typeof p.createdAt === 'string' ? p.createdAt : '',
              title: typeof p.name === 'string' ? p.name : '',
              description:
                typeof p.planteamiento === 'string' ? p.planteamiento : '',
            }))
          );
        } else {
          setProjects([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id, user.name]);

  // Calcula categorías dinámicamente según los proyectos cargados
  const categories = [
    { value: 'all', label: 'Todas las categorías', count: projects.length },
    ...Array.from(new Set(projects.map((p) => p.category ?? '')))
      .filter(Boolean)
      .map((cat) => ({
        value: cat,
        label: cat,
        count: projects.filter((p) => p.category === cat).length,
      })),
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra los proyectos según búsqueda y categoría
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch =
      (project.title ?? '')
        .toLowerCase()
        .includes(searchTerm?.toLowerCase() ?? '') ||
      (project.description ?? '')
        .toLowerCase()
        .includes(searchTerm?.toLowerCase() ?? '') ||
      (project.tags ?? []).some((tag: string) =>
        tag?.toLowerCase().includes(searchTerm?.toLowerCase() ?? '')
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
      {/* Header superior */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-teal-700/50 bg-slate-800/50 pl-10 text-white placeholder-gray-400 focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="flex w-full gap-2 md:w-64">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="border-teal-700/50 bg-slate-800/50 text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-teal-700/50 bg-slate-800">
                  {categories.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.value}
                      className="text-white hover:bg-teal-700/30"
                    >
                      {category.label} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-700/20"
                onClick={() => {
                  setPlanteamientoTexto('');
                  setJustificacionTexto('');
                  setObjetivoGenTexto('');
                  setObjetivosEspTexto([]);
                  setActividadesTexto([]);
                  setPlanteamientoOpen(true);
                }}
                title="Agregar proyecto"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Proyectos <span className="text-cyan-400">Artie</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Descubre proyectos innovadores desarrollados por nuestra comunidad
            de estudiantes y profesionales
          </p>
        </div>

        {/* Modales */}
        <ModalPlanteamiento
          isOpen={planteamientoOpen}
          onClose={() => setPlanteamientoOpen(false)}
          onConfirm={handleConfirmarPlanteamiento}
          texto={planteamientoTexto}
          setTexto={setPlanteamientoTexto}
        />
        <ModalJustificacion
          isOpen={justificacionOpen}
          onClose={() => setJustificacionOpen(false)}
          onAnterior={handleAnteriorJustificacion}
          onConfirm={handleConfirmarJustificacion}
          texto={justificacionTexto}
          setTexto={setJustificacionTexto}
        />
        <ModalObjetivoGen
          isOpen={objetivoGenOpen}
          onClose={() => setObjetivoGenOpen(false)}
          onAnterior={handleAnteriorObjetivoGen}
          onConfirm={handleConfirmarObjetivoGen}
          texto={objetivoGenTexto}
          setTexto={setObjetivoGenTexto}
        />
        <ModalObjetivosEsp
          isOpen={ObjetivosEspOpen}
          onClose={() => setObjetivosEspOpen(false)}
          onAnterior={handleAnteriorObjetivosEsp}
          onConfirm={handleConfirmarObjetivosEsp}
          texto={ObjetivosEspTexto}
          setTexto={setObjetivosEspTexto}
        />
        <ModalActividades
          isOpen={actividadesOpen}
          onClose={() => setActividadesOpen(false)}
          onAnterior={handleAnteriorActividades}
          onConfirm={handleConfirmarActividades}
          texto={actividadesTexto}
          setTexto={setActividadesTexto}
        />
        <ModalResumen
          isOpen={ResumenOpen}
          onClose={() => setResumenOpen(false)}
          planteamiento={planteamientoTexto}
          justificacion={justificacionTexto}
          objetivoGen={objetivoGenTexto}
          objetivosEsp={ObjetivosEspTexto}
          actividad={actividadesTexto}
          setObjetivosEsp={setObjetivosEspTexto}
          setActividades={setActividadesTexto}
        />

        {/* Projects Grid */}
        {loading ? (
          <div className="py-12 text-center text-white">
            Cargando proyectos...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="border-teal-700/30 bg-slate-800/50 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10"
              >
                <CardHeader className="p-0">
                  <div className="relative">
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={
                          project.status === 'Completado'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          project.status === 'Completado'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-orange-600 hover:bg-orange-700'
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 line-clamp-1 text-xl font-semibold text-white">
                        {project.title}
                      </h3>
                      <p className="line-clamp-3 text-sm text-gray-300">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(project.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-cyan-400/30 text-xs text-cyan-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(project.tags ?? []).length > 3 && (
                        <Badge
                          variant="outline"
                          className="border-gray-600 text-xs text-gray-400"
                        >
                          +{(project.tags ?? []).length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{project.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{project.views?.toLocaleString?.() ?? '0'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {project.date
                            ? new Date(project.date).toLocaleDateString('es-ES')
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{project.category}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Proyecto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-teal-600 bg-transparent text-teal-300 hover:bg-teal-600/20"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No tienes proyectos registrados.
              </div>
            )}
          </div>
        )}

        {/* Load More Button */}
        <div className="mt-12 text-center">
          <Button className="bg-cyan-600 px-8 py-3 text-white hover:bg-cyan-700">
            Cargar más proyectos
          </Button>
        </div>
      </main>
    </div>
  );
}
