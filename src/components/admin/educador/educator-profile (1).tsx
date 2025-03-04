import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CourseList } from "./course-list"
import type { Course, Educator } from "@/types"

interface EducatorProfileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  educator: Educator
  onViewCourse: (course: Course) => void
}

export function EducatorProfile({ open, onOpenChange, educator, onViewCourse }: EducatorProfileProps) {
  if (!educator) {
    return null
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "educador":
        return "Educador"
      case "admin":
        return "Administrador"
      case "assistant":
        return "Asistente"
      default:
        return role
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[#0a1123] overflow-y-auto max-h-[90vh] border-none p-6">
        <div className="grid gap-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-cyan-400">
              <AvatarImage src={educator.avatar} alt={educator.name} />
              <AvatarFallback className="bg-[#1a2234] text-white">
                {educator.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-3">
              <h2 className="text-2xl font-bold text-white">{educator.name}</h2>
              <div className="space-y-1">
                <p className="text-gray-400">{educator.email}</p>
                <p className="text-gray-400">{educator.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                  Rol: {getRoleText(educator.role)}
                </Badge>
                <Badge variant="outline" className="border-purple-400 text-purple-400">
                  Especialización: {educator.specialization}
                </Badge>
                <Badge
                  variant={educator.status === "active" ? "default" : "secondary"}
                  className={educator.status === "active" ? "bg-green-600" : "bg-gray-600"}
                >
                  Estado: {educator.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">
                Fecha de Incorporación: {format(new Date(educator.joinDate), "PP", { locale: es })}
              </p>
            </div>
          </div>

          <CourseList
            courses={educator.courses}
            onViewCourse={onViewCourse}
            onClose={() => onOpenChange(false)}
            className="pt-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

