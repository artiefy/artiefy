import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Course } from "@/types"

interface CourseDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course
}

export function CourseDetails({ open, onOpenChange, course }: CourseDetailsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#0a1123] text-white border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">{course.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="aspect-video relative bg-[#1a2234] rounded-lg overflow-hidden">
            <img
              src={course.imageUrl || "/placeholder.svg?height=400&width=600"}
              alt={course.title}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="grid gap-4">
            <h3 className="text-xl font-semibold text-white">Estudiantes Inscritos ({course.students.length})</h3>
            <div className="rounded-md border border-[#1a2234] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#1a2234]">
                    <TableHead className="text-white">Nombre</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {course.students.map((student) => (
                    <TableRow key={student.id} className="border-b border-[#1a2234]">
                      <TableCell className="text-gray-300">{student.name}</TableCell>
                      <TableCell className="text-gray-300">{student.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={student.status === "active" ? "default" : "secondary"}
                          className={student.status === "active" ? "bg-green-600" : "bg-gray-600"}
                        >
                          {student.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

