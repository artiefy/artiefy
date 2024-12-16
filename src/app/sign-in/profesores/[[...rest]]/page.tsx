
// app/sign-in/profesores/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function ProfesoresSignInPage() {
  return <div>
    <h3 className='font-sans font-extrabold'>LOGIN PROFESORES</h3>
      <SignIn  />
  </div>;
}