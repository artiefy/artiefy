import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/admin/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/admin/ui/card';

export default function Profile() {
  // Estos datos serían normalmente obtenidos de un backend
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Estudiante',
    joinDate: '01/01/2023',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Avatar className="size-20">
            <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-semibold">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500">Rol: {user.role}</p>
            <p className="text-sm text-gray-500">
              Miembro desde: {user.joinDate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aquí puedes agregar más secciones como cursos inscritos, logros, etc. */}
    </div>
  );
}
