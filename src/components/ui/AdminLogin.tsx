// src/components/ui/AdminLogin.tsx
import { SignIn } from "@clerk/nextjs";

const AdminLogin = () => {
  return (
    <div className="flex justify-center p-5">
      <h2>Login as Admin</h2>
      <SignIn path="/dashboard/admin/login" />
    </div>
  );
};

export default AdminLogin;
