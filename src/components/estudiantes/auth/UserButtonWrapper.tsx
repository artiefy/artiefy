import { UserButton } from "@clerk/nextjs";
import { AcademicCapIcon, UserCircleIcon } from "@heroicons/react/24/solid";

export function UserButtonWrapper() {
  return (
    <UserButton
      showName
      appearance={{
        elements: {
          rootBox: "flex items-center justify-end",
          userButtonTrigger: "focus:shadow-none",
          userButtonPopoverCard: "z-[100]",
        },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Link
          label="Mis Cursos"
          labelIcon={<UserCircleIcon className="size-4" />}
          href="/estudiantes/myaccount"
        />
        <UserButton.Link
          label="Mis Certificados"
          labelIcon={<AcademicCapIcon className="size-4" />}
          href="/estudiantes/certificados"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
