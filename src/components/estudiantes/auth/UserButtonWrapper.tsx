import { useEffect, useState } from 'react';

import { UserButton, useUser } from '@clerk/nextjs';
import {
  AcademicCapIcon,
  FolderIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { FaCrown, FaRegCalendarAlt } from 'react-icons/fa';

export function UserButtonWrapper() {
  const { user } = useUser();
  const planType = user?.publicMetadata?.planType as string | undefined;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as
    | string
    | undefined;
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    | string
    | undefined;

  // Detectar si la suscripción está vencida o inactiva
  let isExpired = false;
  if (planType === 'Premium' || planType === 'Pro') {
    if (subscriptionStatus !== 'active') {
      isExpired = true;
    }
    if (subscriptionEndDate) {
      const end = new Date(subscriptionEndDate);
      if (end < new Date()) isExpired = true;
    }
  }

  // Badge visual para planType
  const renderPlanBadge = () => {
    if (planType === 'Premium') {
      return (
        <span
          className={`ml-2 inline-flex cursor-pointer items-center rounded px-2 py-0.5 text-xs font-bold text-white ${
            isExpired ? 'bg-gray-500' : 'bg-purple-500'
          }`}
          onClick={
            isExpired ? () => window.open('/planes', '_blank') : undefined
          }
          title={
            isExpired
              ? 'Suscripción vencida. Haz click para renovar.'
              : 'Premium activo'
          }
        >
          <FaCrown className="mr-1 text-yellow-300" />
          <span
            className={isExpired ? 'relative' : ''}
            style={
              isExpired
                ? {
                    textDecoration: 'line-through',
                    textDecorationColor: '#000',
                    textDecorationThickness: '2.5px',
                  }
                : undefined
            }
          >
            PREMIUM
          </span>
        </span>
      );
    }
    if (planType === 'Pro') {
      return (
        <span
          className={`ml-2 inline-flex cursor-pointer items-center rounded px-2 py-0.5 text-xs font-bold text-white ${
            isExpired ? 'bg-gray-500' : 'bg-orange-500'
          }`}
          onClick={
            isExpired ? () => window.open('/planes', '_blank') : undefined
          }
          title={
            isExpired
              ? 'Suscripción vencida. Haz click para renovar.'
              : 'Pro activo'
          }
        >
          <FaCrown className="mr-1 text-yellow-300" />
          <span
            className={isExpired ? 'relative' : ''}
            style={
              isExpired
                ? {
                    textDecoration: 'line-through',
                    textDecorationColor: '#000',
                    textDecorationThickness: '2.5px',
                  }
                : undefined
            }
          >
            PRO
          </span>
        </span>
      );
    }
    return null;
  };

  // Estado para los detalles de suscripción y si la página está abierta
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    purchaseDate?: string;
    subscriptionEndDate?: string;
    planType?: string;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [profilePageOpen, setProfilePageOpen] = useState(false);

  // Cargar los datos desde la API cuando la página personalizada está abierta
  useEffect(() => {
    if (!profilePageOpen) return;
    setLoadingDetails(true);
    fetch(`/api/estudiantes/user-subscription-details`)
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as {
            purchaseDate?: string;
            subscriptionEndDate?: string;
            planType?: string;
          } | null;
          setSubscriptionDetails(data);
        } else {
          setSubscriptionDetails(null);
        }
      })
      .catch(() => setSubscriptionDetails(null))
      .finally(() => setLoadingDetails(false));
  }, [profilePageOpen]);

  return (
    <div className="flex items-center">
      <UserButton
        showName
        appearance={{
          elements: {
            rootBox: 'flex items-center justify-end',
            userButtonTrigger: 'focus:shadow-none',
            userButtonPopoverCard: 'z-[100]',
            userProfilePageLabel: 'whitespace-nowrap', // Aplica la clase aquí si Clerk lo soporta
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
        {/* Página personalizada dentro del modal de administrar cuenta */}
        <UserButton.UserProfilePage
          label="Detalles de suscripción"
          labelIcon={<FaRegCalendarAlt className="size-4" />}
          url="subscription-details"
        >
          <SubscriptionDetailsPage
            details={subscriptionDetails}
            loading={loadingDetails}
            setProfilePageOpen={setProfilePageOpen}
          />
        </UserButton.UserProfilePage>
      </UserButton>
      {/* Badge de planType */}
      {renderPlanBadge()}
    </div>
  );
}

// Componente para la página de detalles con estilo elegante
function SubscriptionDetailsPage({
  details,
  loading,
  setProfilePageOpen,
}: {
  details: {
    purchaseDate?: string;
    subscriptionEndDate?: string;
    planType?: string;
  } | null;
  loading: boolean;
  setProfilePageOpen: (open: boolean) => void;
}) {
  // Detectar si la página está abierta (renderizada)
  useEffect(() => {
    setProfilePageOpen(true);
    return () => setProfilePageOpen(false);
  }, [setProfilePageOpen]);

  // Determinar si está vencida
  const expired =
    details?.planType === 'Premium' || details?.planType === 'Pro'
      ? details?.subscriptionEndDate
        ? new Date(details.subscriptionEndDate) < new Date()
        : false
      : false;

  const badgeStyle = getPlanBadgeStyle(details?.planType, expired);

  return (
    <div className="flex flex-col items-center justify-center px-2 py-4">
      <h3 className="mb-4 text-center text-xl font-extrabold whitespace-nowrap text-gray-900">
        Detalles de Suscripción
      </h3>
      <div className="mb-6 flex flex-col items-center">
        <span
          className={`inline-flex items-center rounded-full px-4 py-2 text-lg font-bold shadow-lg ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.textColor}`}
          style={{
            boxShadow: expired
              ? '0 0 0 2px #888'
              : badgeStyle.bg === 'bg-purple-500'
                ? '0 0 12px 2px #a855f7'
                : badgeStyle.bg === 'bg-orange-500'
                  ? '0 0 12px 2px #fb923c'
                  : badgeStyle.bg === 'bg-blue-800'
                    ? '0 0 12px 2px #1e40af'
                    : undefined,
            textDecoration: expired ? 'line-through' : undefined,
            textDecorationColor: expired ? '#000' : undefined,
            textDecorationThickness: expired ? '2.5px' : undefined,
          }}
          title={
            expired
              ? 'Suscripción vencida. Haz click para renovar.'
              : badgeStyle.text + ' activo'
          }
        >
          {badgeStyle.icon}
          <span>{badgeStyle.text}</span>
        </span>
        {expired && (
          <span className="mt-2 text-xs font-semibold text-red-600">
            Suscripción vencida
          </span>
        )}
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Cargando...</div>
      ) : details ? (
        // Tarjeta más ancha, horizontal, sin saltos de línea
        <div className="flex w-full max-w-2xl min-w-[350px] flex-row items-center gap-8 overflow-x-auto rounded-lg bg-gray-800 p-4 whitespace-nowrap shadow">
          <div className="flex w-1/3 flex-col items-start gap-2">
            <span className="font-semibold text-gray-300">Plan:</span>
            <span className="font-semibold text-gray-300">
              Fecha de compra:
            </span>
            <span className="font-semibold text-gray-300">
              Fecha de vencimiento:
            </span>
          </div>
          <div className="flex w-2/3 flex-col items-start gap-2">
            <span className="truncate font-bold text-white">
              {details.planType ?? 'N/A'}
            </span>
            <span className="truncate font-bold text-white">
              {details.purchaseDate
                ? new Date(details.purchaseDate).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
            <span className="truncate font-bold text-white">
              {details.subscriptionEndDate
                ? new Date(details.subscriptionEndDate).toLocaleDateString(
                    'es-CO',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )
                : 'N/A'}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-red-500">
          No se pudo cargar la información.
        </div>
      )}
      {/* Botón para renovar si está vencido */}
      {expired && (
        <button
          className="mt-4 rounded bg-purple-500 px-4 py-2 font-bold text-white shadow hover:bg-purple-600"
          onClick={() => window.open('/planes', '_blank')}
        >
          Renovar Suscripción
        </button>
      )}
    </div>
  );
}

// Estilo visual para el badge del plan en la página de detalles
function getPlanBadgeStyle(type: string | undefined, expired: boolean) {
  if (type === 'Premium') {
    return {
      bg: expired ? 'bg-gray-500' : 'bg-purple-500',
      border: 'border-2 border-purple-500',
      icon: <FaCrown className="mr-2 text-yellow-300" />,
      text: 'PREMIUM',
      textColor: 'text-white',
    };
  }
  if (type === 'Pro') {
    return {
      bg: expired ? 'bg-gray-500' : 'bg-orange-500',
      border: 'border-2 border-orange-500',
      icon: <FaCrown className="mr-2 text-yellow-300" />,
      text: 'PRO',
      textColor: 'text-white',
    };
  }
  if (type === 'Enterprise') {
    return {
      bg: expired ? 'bg-gray-500' : 'bg-blue-800',
      border: 'border-2 border-blue-800',
      icon: <FaCrown className="mr-2 text-yellow-300" />,
      text: 'ENTERPRISE',
      textColor: 'text-white',
    };
  }
  return {
    bg: 'bg-gray-300',
    border: 'border-2 border-gray-400',
    icon: null,
    text: 'Sin plan',
    textColor: 'text-gray-700',
  };
}
