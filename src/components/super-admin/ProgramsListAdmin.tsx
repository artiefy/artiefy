import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, StarIcon } from "@heroicons/react/24/solid";

import { AspectRatio } from "~/components/educators/ui/aspect-ratio";
import { Badge } from "~/components/educators/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/educators/ui/card";
import { Button } from "~/components/estudiantes/ui/button";
import { Checkbox } from "~/components/estudiantes/ui/checkbox";

export interface Program {
  id: number;
  title: string;
  description: string;
  categoryid: number;
  createdAt: string;
  coverImageKey: string;
  creatorId: string;
  rating: number;
  instructor?: string;
  modalidadesid?: number;
  nivelid?: number;
}

interface ProgramListAdminProps {
  programs: Program[];
  onEditProgram: (program: Program) => void;
  onDeleteProgram: (id: number) => void;
  selectedPrograms: number[];
  onToggleSelection: (id: number) => void;
  categories: { id: number; name: string }[];
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export default function ProgramListAdmin({
  programs,
  onEditProgram,
  selectedPrograms,
  onToggleSelection,
  categories,
  currentPage,
  onPageChange,
  itemsPerPage = 6,
}: ProgramListAdminProps) {
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name ?? "Sin categoría";
  };

  const totalPages = Math.ceil(programs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = programs.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-5">
        {currentItems.map((program) => (
          <div key={program.id} className="group relative">
            <Checkbox
              checked={selectedPrograms.includes(program.id)}
              onCheckedChange={() => onToggleSelection(program.id)}
              className="absolute top-2 right-2 z-10"
            />
            <div className="absolute -inset-0.5 animate-gradient rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
            <Card className="zoom-in relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 px-2 pt-2 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]">
              <CardHeader>
                <AspectRatio ratio={16 / 9}>
                  <div className="relative size-full">
                    <Image
                      src={
                        program.coverImageKey
                          ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
                          : "/placeholder.svg"
                      }
                      alt={program.title || "Imagen del programa"}
                      className="object-cover px-2 pt-2 transition-transform duration-300 hover:scale-105"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={75}
                    />
                  </div>
                </AspectRatio>
              </CardHeader>

              <CardContent className="flex grow flex-col items-center justify-between space-y-2 px-2 text-center">
                <CardTitle className="w-full rounded-lg text-lg text-background">
                  <div className="font-bold text-primary">{program.title}</div>
                </CardTitle>
                <div className="flex items-center justify-center">
                  <Badge
                    variant="outline"
                    className="border-primary bg-background text-primary hover:bg-black/70"
                  >
                    {getCategoryName(program.categoryid)}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-gray-300">
                  Descripcion: {program.description}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-center space-y-2 px-2">
                <div className="flex w-full justify-center gap-4">
                  <p className="text-center text-sm font-bold text-gray-300 italic">
                    Educador:{" "}
                    <span className="font-bold italic">
                      {program.instructor}
                    </span>
                  </p>
                  <p className="text-center text-sm font-bold text-red-500">
                    {program.modalidadesid}
                  </p>
                </div>
                <div className="flex w-full items-center justify-between gap-2">
                  <Button
                    onClick={() => onEditProgram(program)}
                    className="h-8 w-[95px] px-2 text-[10px]"
                    variant="outline"
                  >
                    Editar
                  </Button>
                  <Button asChild className="h-8 w-[95px] px-0">
                    <Link
                      href={`/dashboard/super-admin/programs/${program.id}`}
                      className="group/button inline-flex h-full w-full items-center justify-center gap-1.5 rounded-md border border-white/20 bg-background px-2 text-[10px] text-primary transition-all hover:bg-primary/10"
                    >
                      <span className="relative z-10">Ver Programa</span>
                      <ArrowRightIcon className="relative z-10 size-3" />
                    </Link>
                  </Button>
                  <div className="flex items-center">
                    <StarIcon className="size-4" />
                    <span className="ml-1 text-xs font-bold text-yellow-500">
                      {(program.rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1"
          >
            Anterior
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => onPageChange(page)}
              className="px-3 py-1"
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1"
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
