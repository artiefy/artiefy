import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import ForumHome from '~/components/ZoneForumSA/Forum';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function page() {
  // Vista sencilla que muestra el componente and la lista de foros con detalles basicos y botones para ver el forto mas especifico
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 px-4 py-3">
        <Breadcrumb className="mt-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="
                  text-sm text-primary
                  hover:text-gray-300
                "
                href="/"
              >
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-sm text-gray-400">Foros</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ForumHome />
    </div>
  );
}
