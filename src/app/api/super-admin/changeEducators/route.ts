import { NextResponse } from 'next/server';

import { getAllEducators, updateCourseInstructor } from '~/models/super-adminModels/courseModelsSuperAdmin';


// ✅ Definir tipo de datos esperado
interface ChangeEducatorRequest {
    courseId: number;
    newInstructor: string;
  }
 
  // ✅ Obtener la lista de educadores
export async function GET() {
    try {
      console.log('📌 [API] Solicitando lista de educadores...');
  
      const educators = await getAllEducators();
      
      console.log('✅ [API] Educadores obtenidos:', educators);
  
      if (!educators || educators.length === 0) {
        console.warn('⚠️ [API] No hay educadores disponibles');
        return NextResponse.json({ error: 'No hay educadores disponibles' }, { status: 404 });
      }
  
      return NextResponse.json(educators);
    } catch (error) {
      console.error('❌ [API] Error al obtener educadores:', error);
      return NextResponse.json({ error: 'Error al obtener educadores' }, { status: 500 });
    }
  }
  


// ✅ Actualizar el educador de un curso
export async function PUT(req: Request) {
  try {
    // 📌 Asegurar que la respuesta tiene el tipo correcto
    const body = (await req.json()) as ChangeEducatorRequest;

    // 📌 Validar que los valores existen y tienen el tipo correcto
    if (!body.courseId || typeof body.courseId !== 'number' || 
        !body.newInstructor || typeof body.newInstructor !== 'string') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Extraer los valores después de validar
    const { courseId, newInstructor } = body;

    await updateCourseInstructor(courseId, newInstructor);
    return NextResponse.json({ message: '✅ Educador actualizado exitosamente' });
  } catch (error) {
    console.error('❌ Error al actualizar el educador:', error);
    return NextResponse.json({ error: 'Error al actualizar educador' }, { status: 500 });
  }
}
