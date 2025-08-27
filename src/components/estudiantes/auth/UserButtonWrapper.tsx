import { UserButton, useUser } from '@clerk/nextjs';
import {
  AcademicCapIcon,
  FolderIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { FaCrown } from 'react-icons/fa';

export function UserButtonWrapper() {
  const { user } = useUser();
  const planType = user?.publicMetadata?.planType as string | undefined;

  // Badge visual para planType
  const renderPlanBadge = () => {
    if (planType === 'Premium') {
      return (
        <span className="ml-2 inline-flex items-center rounded bg-purple-500 px-2 py-0.5 text-xs font-bold text-white">
          <FaCrown className="mr-1 text-yellow-300" /> PREMIUM
        </span>
      );
    }
    if (planType === 'Pro') {
      return (
        <span className="ml-2 inline-flex items-center rounded bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
          <FaCrown className="mr-1 text-yellow-300" /> PRO
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center">
      <UserButton
        showName
        appearance={{
          elements: {
            rootBox: 'flex items-center justify-end',
            userButtonTrigger: 'focus:shadow-none',
            userButtonPopoverCard: 'z-[100]',
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
            label="Mis Certificaciones"
            labelIcon={<AcademicCapIcon className="size-4" />}
            href="/estudiantes/certificados"
          />
          <UserButton.Link
            label="Mis Proyectos"
            labelIcon={<FolderIcon className="size-4" />}
            href="/proyectos/MisProyectos"
          />
        </UserButton.MenuItems>
      </UserButton>
      {/* Badge de planType */}
      {renderPlanBadge()}
    </div>
  );
}
