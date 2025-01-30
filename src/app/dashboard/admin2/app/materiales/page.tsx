'use client';

import { useState } from 'react';
import { FileText, Download, BarChart } from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import { MaterialForm } from '~/components/admin/ui/MaterialForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/admin/ui/table';

interface Material {
  id: number;
  nombre: string;
  tipo: string;
  curso: string;
  descargas: number;
}

export default function Materiales() {
  const [materiales, setMateriales] = useState<Material[]>([
    {
      id: 1,
      nombre: 'Introducción a la Programación - Libro de Texto',
      tipo: 'PDF',
      curso: 'Introducción a la Programación',
      descargas: 120,
    },
    {
      id: 2,
      nombre: 'Diseño UX/UI - Guía de Herramientas',
      tipo: 'DOC',
      curso: 'Diseño UX/UI',
      descargas: 85,
    },
  ]);

  const handleAddMaterial = (
    nuevoMaterial: Omit<Material, 'id' | 'descargas'>
  ) => {
    setMateriales([
      ...materiales,
      { ...nuevoMaterial, id: materiales.length + 1, descargas: 0 },
    ]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Gestión de Materiales
      </h2>

      <DashboardMetrics
        metrics={[
          {
            title: 'Total Materiales',
            value: materiales.length.toString(),
            icon: FileText,
            href: '/materiales',
          },
          {
            title: 'Descargas Totales',
            value: materiales
              .reduce((acc, mat) => acc + mat.descargas, 0)
              .toString(),
            icon: Download,
            href: '/materiales',
          },
          {
            title: 'Promedio de Descargas',
            value: (
              materiales.reduce((acc, mat) => acc + mat.descargas, 0) /
              materiales.length
            ).toFixed(0),
            icon: BarChart,
            href: '/analisis',
          },
        ]}
      />

      <div className="flex items-center justify-between">
        <Input placeholder="Buscar materiales..." className="max-w-sm" />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Material</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Material</DialogTitle>
            </DialogHeader>
            <MaterialForm onSubmit={handleAddMaterial} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Descargas</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materiales.map((material) => (
            <TableRow key={material.id}>
              <TableCell>{material.nombre}</TableCell>
              <TableCell>{material.tipo}</TableCell>
              <TableCell>{material.curso}</TableCell>
              <TableCell>{material.descargas}</TableCell>
              <TableCell>
                <Button variant="outline" className="mr-2">
                  Descargar
                </Button>
                <Button variant="outline">Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
