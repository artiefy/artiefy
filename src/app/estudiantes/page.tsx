"use client";

import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import CourseCategories from "~/components/layout/CourseCategories";
import CourseListStudent from "~/components/layout/CourseListStudent";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { SkeletonCard } from "~/components/layout/SkeletonCard";
import { Badge } from "~/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Skeleton } from "~/components/ui/skeleton";

const ITEMS_PER_PAGE = 9;

interface Course {
  id: number;
  title: string;
  coverImageKey: string;
  category: {
    name: string;
  };
  description: string;
  instructor: string;
  rating?: number;
  modalidad: {
    name: string;
  };
  createdAt: string;
}

function LoadingCourses() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error(response.statusText);
      const data = (await response.json()) as Course[];
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setCourses(data);
      setFilteredCourses(data);
      setCarouselIndex(0);
    } catch (error) {
      console.error("Error al obtener los cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    const filtered = courses.filter((course) =>
      course.title.toLowerCase().includes(search.toLowerCase()),
    );
    setFilteredCourses(filtered);
    setCurrentPage(1);
  };

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleCarouselChange = (index: number) => {
    setCarouselIndex(index);
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(
        (prevIndex) => (prevIndex + 1) % Math.min(courses.length, 5),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [courses]);

  return (
    <div>
      <main className="container mx-auto px-40 md:px-48">
        <Header />
        <div className="flex flex-col space-y-8">
          {/* CAROUSEL GRANDE*/}
          <div className="relative h-[500px] overflow-hidden">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              courses.slice(0, 5).map((course, index) => (
                <div
                  key={course.id}
                  className={`absolute h-full w-full transition-opacity duration-500 ${
                    index === carouselIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                      alt={course.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="100vw"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAFzAooDASIAAhEBAxEB/8QAGgABAQEBAQEBAAAAAAAAAAAAAAIBAwYFBP/EABkQAQEBAQEBAAAAAAAAAAAAAAABEQISIf/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAaEQEBAQEBAQEAAAAAAAAAAAAAEQECEiEx/9oADAMBAAIRAxEAPwD1ICNAAAADWANAAAAABowBoMBrAAABgAMBgDGsBjK1gMqa2soMrK2poMqaqpoMqa2poMqaqpoJqa2poJqaqpqCaiqqaCamqqKCamqqaCamqqaCamqqaDKlVSDAYAAA1jQGsaDWxjQVGxkbBGxSY0FRrI2A1rGqNawBrWNAABoxoPTDAVoADWANGANGNAawBowBowBowBowABgNYMBrBgDBgDBgDKVlBlZW1NBlZW1NBlTW1NBlTW1NBlTW1NQZUVVTQTU1tTQTU1VRQZU1tTQTU1VTQTWVtTQZWFYAwEAYA0Y0GtS1RTYloKioiKgimpaCo1Kga1jQa1gooY0GjAGgA9MMBWjAGjAGjAFCWg0YA0YaDRmmg0ZpoNGaaDWM00GsNYDWDAGDAGDAGUrKBU1tTQKmtqaDKmtqagypramgypramgypramgmpqqigypramgmpramgypramgyprbU1AqW2ptAGMBowBrU63Qa1LQU1LYqLjYmNgKbExoLaloKaloKaloNanW6DWp1uqjRmgPS6azTUaaazTVG63U6aCtNTpqCtNTrdUbprNNBWmp00FaanTQVpqdNBums00G6anTQbprNZoN01ms0G6zWazQbrNZrNBustZay0C1lpam0CstLU2gWptLU2oFqbS1NoFqbS1NoFqbS1NoMtTa21FoFqLW2ptBlqbW2otAtRa21NqBU0tTaBWFqbQbrNZpqDdNTpoKE63QU3Ua3VRet1EqpQVKrUStlBet1EqpVFSt1Ot0F63Ua3RFa1Ot0FCdboKE63QaazTQel01OmjStNTpoK01OmgrTU6aCtbqNboK01OmgrTU6aCtNTpoK01OmgrTU6aCtZqdNBWs1ms0FazU6aDdZrNZoN1ms1miNtZazWWg21NrLWWittTaWptAtTaWstAtTaWptAtTaWptBlqbW2otAtTaWptAtRa21FqBam0tTaDLU2lqbQLWWstTag21Npam1Bump1mlFaanTSitbqNNKi9bqNboOkrdc9VKouVsqJWyqOmtlRrZRFyt1ErdBet1Ot1RWt1Gt0F6anTQXpqdNBWmp00HpdNRpo0vTUaaC9NRpoL01Gt0FaanTQXpqNNBemo00F6ajTQXpqNNBWmp00RWmo00FaanWaCtZrNZoK1mp1mgrWazU6CtZanWWg21lrLU2g21lrLU2g21Npam0C1lrLU2g21NrLU2gWptLU2oFqbS1FoFqbS1NoFqbWWptQLU2lqLUG2ptZam1KNtZam1NrO6qtZqdZqUXrNRppdR001z1ulHTWyuetnS0ddbK5ytlaqOsrZXOVsq0dJVSucrZVHSVsrnKqUF63Ua3VF63UaaDppqNboL01Gt0Faa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"
                      onLoad={() => console.log(`Image ${course.title} loaded`)}
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-primary">
                    <h2 className="mb-4 text-4xl font-semibold">
                      {course.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className="mb-2 border-primary text-primary"
                    >
                      {course.category.name}
                    </Badge>
                    <p
                      className="hidden text-center text-xl md:block"
                      style={{
                        maxWidth: "600px",
                        wordWrap: "break-word",
                      }}
                    >
                      {course.description}
                    </p>
                    <p className="hidden text-xl font-bold md:block">
                      Educador: {course.instructor}
                    </p>
                    <p className="hidden text-xl text-red-500 md:block">
                      {course.modalidad.name}
                    </p>
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                      <span className="ml-1 text-sm text-yellow-500">
                        {(course.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {courses.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleCarouselChange(index)}
                  className={`h-3 w-3 rounded-full ${
                    index === carouselIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* BUSCADOR IA */}
          <div className="flex justify-end">
            <form className="flex max-w-lg items-center">
              <div className="mr-4 flex h-full items-center">
                <RocketLaunchIcon className="size-6 h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="ml-2 whitespace-nowrap text-xl text-gray-500 dark:text-gray-400">
                  IA
                </span>
              </div>

              <div className="relative w-full max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  required
                  placeholder="Buscar..."
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary"
                  type="text"
                />
              </div>
              <button
                className="ml-2 inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50 dark:bg-primary dark:hover:bg-primary/90 dark:focus:ring-primary/50"
                type="submit"
              >
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Buscar
              </button>
            </form>
          </div>

          <CourseCategories />

          {/* CAROUSEL TOP CURSOS */}
          <div className="relative">
            <h2 className="ml-4 text-xl text-primary md:text-2xl">
              Top Cursos
            </h2>
            <Carousel className="w-full p-4">
              <CarouselContent>
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="mx-4 ml-2 h-48 w-full rounded-lg md:h-64"
                      />
                    ))
                  : courses.map((course) => (
                      <CarouselItem
                        key={course.id}
                        className="pl-4 md:basis-1/2 lg:basis-1/3"
                      >
                        <div className="relative h-48 w-full md:h-64">
                          <Image
                            src={
                              course.coverImageKey
                                ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                                : "https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT"
                            }
                            alt={course.title}
                            fill
                            className="rounded-lg object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={80}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAFzAooDASIAAhEBAxEB/8QAGgABAQEBAQEBAAAAAAAAAAAAAAIBAwYFBP/EABkQAQEBAQEBAAAAAAAAAAAAAAABEQISIf/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAaEQEBAQEBAQEAAAAAAAAAAAAAEQECEiEx/9oADAMBAAIRAxEAPwD1ICNAAAADWANAAAAABowBoMBrAAABgAMBgDGsBjK1gMqa2soMrK2poMqaqpoMqa2poMqaqpoJqa2poJqaqpqCaiqqaCamqqKCamqqaCamqqaCamqqaDKlVSDAYAAA1jQGsaDWxjQVGxkbBGxSY0FRrI2A1rGqNawBrWNAABoxoPTDAVoADWANGANGNAawBowBowBowBowABgNYMBrBgDBgDBgDKVlBlZW1NBlZW1NBlTW1NBlTW1NBlTW1NQZUVVTQTU1tTQTU1VRQZU1tTQTU1VTQTWVtTQZWFYAwEAYA0Y0GtS1RTYloKioiKgimpaCo1Kga1jQa1gooY0GjAGgA9MMBWjAGjAGjAFCWg0YA0YaDRmmg0ZpoNGaaDWM00GsNYDWDAGDAGDAGUrKBU1tTQKmtqaDKmtqagypramgypramgypramgmpqqigypramgmpramgypramgyprbU1AqW2ptAGMBowBrU63Qa1LQU1LYqLjYmNgKbExoLaloKaloKaloNanW6DWp1uqjRmgPS6azTUaaazTVG63U6aCtNTpqCtNTrdUbprNNBWmp00FaanTQVpqdNBums00G6anTQbprNZoN01ms0G6zWazQbrNZrNBustZay0C1lpam0CstLU2gWptLU2oFqbS1NoFqbS1NoFqbS1NoMtTa21FoFqLW2ptBlqbW2otAtRa21NqBU0tTaBWFqbQbrNZpqDdNTpoKE63QU3Ua3VRet1EqpQVKrUStlBet1EqpVFSt1Ot0F63Ua3RFa1Ot0FCdboKE63QaazTQel01OmjStNTpoK01OmgrTU6aCtbqNboK01OmgrTU6aCtNTpoK01OmgrTU6aCtZqdNBWs1ms0FazU6aDdZrNZoN1ms1miNtZazWWg21NrLWWittTaWptAtTaWstAtTaWptAtTaWptBlqbW2otAtTaWptAtRa21FqBam0tTaDLU2lqbQLWWstTag21Npam1Bump1mlFaanTSitbqNNKi9bqNboOkrdc9VKouVsqJWyqOmtlRrZRFyt1ErdBet1Ot1RWt1Gt0F6anTQXpqdNBWmp00HpdNRpo0vTUaaC9NRpoL01Gt0FaanTQXpqNNBemo00F6ajTQXpqNNBWmp00RWmo00FaanWaCtZrNZoK1mp1mgrWazU6CtZanWWg21lrLU2g21lrLU2g21Npam0C1lrLU2g21NrLU2gWptLU2oFqbS1FoFqbS1NoFqbWWptQLU2lqLUG2ptZam1KNtZam1NrO6qtZqdZqUXrNRppdR001z1ulHTWyuetnS0ddbK5ytlaqOsrZXOVsq0dJVSucrZVHSVsrnKqUF63Ua3VF63UaaDppqNboL01Gt0Faa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"
                            onLoad={() =>
                              console.log(`Image ${course.title} loaded`)
                            }
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                            <h3 className="text-lg font-bold text-white">
                              {course.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className="mb-2 border-primary bg-background text-primary hover:bg-black hover:bg-opacity-90"
                            >
                              {course.category.name}
                            </Badge>
                            <div className="flex w-full justify-between">
                              <p className="italic text-primary">
                                Educador:{" "}
                                <span className="underline">
                                  {course.instructor}
                                </span>
                              </p>
                              <p className="text-primary">
                                <span className="text-red-500">
                                  {course.modalidad.name}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center">
                              <StarIcon className="h-5 w-5 text-yellow-500" />
                              <span className="ml-1 text-sm font-bold text-yellow-500">
                                {(course.rating ?? 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
              </CarouselContent>
              <CarouselPrevious className="mr-7 h-12 w-12 bg-black bg-opacity-50 text-white" />
              <CarouselNext className="ml-4 h-12 w-12 bg-black bg-opacity-50 text-white" />
            </Carousel>
          </div>

          {/* BUSCADOR Cursos Disponibles */}
          <div className="flex justify-end">
            <form className="flex max-w-lg items-center">
              <div className="mr-4 flex h-full items-center">
                <AcademicCapIcon className="size-5 h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="ml-2 whitespace-nowrap text-xl text-gray-500 dark:text-gray-400">
                  Busca Tu Curso
                </span>
              </div>
              <label className="sr-only" htmlFor="course-search">
                Buscar...
              </label>
              <div className="relative w-full max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  required
                  placeholder="Search..."
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <button
                className="ml-2 inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50 dark:bg-primary dark:hover:bg-primary/90 dark:focus:ring-primary/50"
                type="submit"
              >
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Buscar
              </button>
            </form>
          </div>
          <h2 className="text-3xl font-bold">Cursos Disponibles</h2>
          {loading && <LoadingCourses />}
          <Suspense fallback={<LoadingCourses />}>
            <CourseListStudent courses={paginatedCourses} />
          </Suspense>

          <Pagination className="pb-8">
            <PaginationContent className="cursor-pointer">
              {currentPage > 1 && (
                <PaginationPrevious
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
              )}
              {Array.from({ length: totalPages }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => setCurrentPage(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {currentPage < totalPages && (
                <PaginationNext
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              )}
            </PaginationContent>
          </Pagination>
        </div>
      </main>
      <Footer />
    </div>
  );
}
