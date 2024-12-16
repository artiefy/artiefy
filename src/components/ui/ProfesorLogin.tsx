// src/components/ui/ProfesorLogin.tsx
import { SignIn } from "@clerk/nextjs";

const ProfesorLogin = () => {
  return (
    <div className="flex justify-center p-5">
      <h2>Login as Profesor</h2>
      <SignIn path="/dashboard/profesores/login" />
    </div>
  );
};

export default ProfesorLogin;
