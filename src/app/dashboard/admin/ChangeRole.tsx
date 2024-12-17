//src\app\dashboard\admin\ChangeRole.tsx

"use client";

import React from "react";
import { Button } from "~/components/ui/button"; // Asegúrate de tener el componente de Button
import {
  removeRoleWrapper,
  setRoleWrapper,
} from "~/server/wrappers/serverWrappers";

interface UserCardProps {
  user: {
    id: string;
    firstName: string | null; // Permite null
    lastName: string | null; // Permite null
    email: string | undefined;
    role: string | null; // Permite null
  };
}

export const ChangeRole: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="border-b border-gray-200 p-4">
      <div className="text-lg font-medium">
        {user.firstName} {user.lastName}
      </div>
      <div className="text-sm text-gray-500">{user.email}</div>
      <div className="text-sm text-gray-600">{user.role}</div>

      <div className="mt-4 space-y-4">
        {/* Botones para cambiar el rol */}
        <form action={setRoleWrapper} className="flex items-center space-x-4">
          <input type="hidden" value={user.id} name="id" />
          <input type="hidden" value="admin" name="role" />
          <Button type="submit" variant="default">
            Cambiar a Admin
          </Button>
        </form>

        <form action={setRoleWrapper} className="flex items-center space-x-4">
          <input type="hidden" value={user.id} name="id" />
          <input type="hidden" value="profesor" name="role" />
          <Button type="submit" variant="secondary">
            Cambiar a Profesor
          </Button>
        </form>

        <form
          action={removeRoleWrapper}
          className="flex items-center space-x-4"
        >
          <input type="hidden" value={user.id} name="id" />
          <Button type="submit" variant="destructive">
            Eliminar Role
          </Button>
        </form>
      </div>
    </div>
  );
};
