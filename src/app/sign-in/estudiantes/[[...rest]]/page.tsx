import { SignIn } from "@clerk/nextjs";

export default function EstudiantesSignInPage() { 
  return (
    <div>
      <h3 className="font-sans font-extrabold">LOGIN ESTUDIANTES</h3> 
      <SignIn  /> 
    </div>
  );
}

