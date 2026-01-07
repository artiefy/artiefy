import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import ForumHome from '~/components/ZoneForumSA/Forum';

export default function page() {
  // Vista sencilla que muestra el componente and la lista de foros con detalles basicos y botones para ver el forto mas especifico
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="text-primary text-sm hover:text-gray-300"
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
