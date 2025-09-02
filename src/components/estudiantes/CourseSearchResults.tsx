import Link from 'next/link';

interface CourseResult {
  id: number;
  title: string;
  description: string | null;
  category: { id: number; name: string };
}

interface Props {
  results: CourseResult[];
}

export default function CourseSearchResults({ results }: Props) {
  return (
    <div className="grid gap-6">
      {results.map((course) => (
        <div key={course.id} className="rounded-lg border p-4 shadow">
          <h3 className="text-lg font-bold">{course.title}</h3>
          <p className="mb-2">{course.description}</p>
          {/* Opcional: mostrar categoría */}
          {/* <span className="text-xs text-gray-500">{course.category.name}</span> */}
          <Link
            href={`/curso/${course.id}`}
            className="bg-primary hover:bg-primary/80 mt-2 inline-block rounded px-4 py-2 text-white"
          >
            Ir al curso
          </Link>
        </div>
      ))}
    </div>
  );
}
