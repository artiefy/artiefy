import { useRouter } from 'next/navigation';

import { Button } from '~/components/educators/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/educators/ui/card';
import { type Materia } from '~/server/queries/queries';

interface CourseMateriasListProps {
  materias: Materia[];
}

const CourseMateriasList: React.FC<CourseMateriasListProps> = ({
  materias,
}) => {
  const router = useRouter();

  const handleViewMateria = (materiaId: number) => {
    router.push(`/dashboard/educadores/(inicio)/materias/${materiaId}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {materias.map((materia) => (
        <Card key={materia.id} className="p-4">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{materia.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{materia.description}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleViewMateria(materia.id)}>
              Ver Materia
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CourseMateriasList;
