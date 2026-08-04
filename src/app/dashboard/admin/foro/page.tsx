import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import ForumHome from '~/components/ZoneForum/Forum';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function page() {
  // Vista sencilla que muestra el componente and la lista de foros con detalles basicos y botones para ver el forto mas especifico
  return (
    <>
      <Breadcrumb className="mt-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="
                text-primary
                hover:text-gray-300
              "
              href="/"
            >
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="
                text-primary
                hover:text-gray-300
              "
              href="/dashboard/super-admin/foro"
            >
              Foros
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <ForumHome allowGuidedProjects={false} />
    </>
  );
}
