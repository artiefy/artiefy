
import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div>
      <h1 className="font-mono font-extrabold">LOGIN ADMIN</h1>
      <SignIn redirectUrl="/sign-in"/>
    </div>
  );
}