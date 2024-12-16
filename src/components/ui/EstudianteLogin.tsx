// src/components/ui/EstudianteLogin.tsx
import { SignIn } from "@clerk/nextjs";

const EstudianteLogin = () => {
  return (
    <div className="flex justify-center p-5">
      <h2>Login as Estudiante</h2>
      <SignIn path="/dashboard/estudiantes/login" />
    </div>
  );
};

export default EstudianteLogin;
