// Esta función se encarga de obtener el total de cursos 
import { NextResponse } from 'next/server';

import { getTotalCourses } from '~/models/educatorsModels/courseModelsEducator';


export async function GET(_req: Request) {
    try {
      const totalCourses = await getTotalCourses();
      console.log('Total de cursos:', totalCourses);
      return NextResponse.json({ total: totalCourses });
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json(
        { error: 'Error al obtener el total de cursos' },
        { status: 500 }
      );
    }
  }


  
