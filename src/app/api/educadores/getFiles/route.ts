// src/app/api/getFiles/route.ts
import { NextResponse } from 'next/server';

import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

// Configura tu conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Verifica que la URL esté correcta
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Configura tu conexión a S3
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
});

// Función para detectar si es una URL externa
const isExternalUrl = (key: string): boolean => {
  return key.startsWith('http://') || key.startsWith('https://');
};

// Método GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url); // Obtén los parámetros de búsqueda desde la URL
  const lessonId = searchParams.get('lessonId'); // El parámetro 'lessonId' es el que buscas

  // Verificar que el parámetro 'lessonId' sea válido
  if (!lessonId || isNaN(Number(lessonId))) {
    console.error('lessonId no válido:', lessonId);
    return NextResponse.json(
      { message: 'lessonId no válido' },
      { status: 400 }
    );
  }

  const lessonIdNumber = Number(lessonId); // Convertimos el lessonId a un número
  try {
    // Realiza la consulta en la base de datos
    const result = await pool.query<{ resource_key: string }>(
      'SELECT resource_key FROM lessons WHERE id = $1',
      [lessonIdNumber]
    );

    // Si encontramos resultados, obtenemos los nombres de los archivos desde S3
    if (result.rows.length > 0) {
      const resourceKeys = result.rows[0]?.resource_key ?? '';
      const keys = resourceKeys
        ? resourceKeys.split(',').filter((key) => key)
        : [];

      const bucketName = process.env.AWS_BUCKET_NAME;
      if (!bucketName) {
        throw new Error('AWS_S3_BUCKET_NAME is not defined');
      }

      // Obtener tanto la clave como el nombre del archivo
      const filesInfo = await Promise.all(
        keys.map(async (key) => {
          const params = {
            Bucket: bucketName,
            Key: key,
          };
          try {
            if (isExternalUrl(key)) {
              // Si es una URL externa, devuelve la URL como nombre y clave
              return { key, fileName: key };
            } else {
              // Lógica existente para archivos S3
              const headData = await s3Client.send(
                new HeadObjectCommand(params)
              );
              return { key, fileName: headData.Metadata?.filename ?? key }; // Regresamos clave y nombre
            }
          } catch (err) {
            console.error(
              `Error al obtener metadata para el archivo ${key}`,
              err
            );
            // Aun si hay error, devuelve algo útil
            return { key, fileName: key.split('/').pop() ?? key }; // Si no hay metadata, usamos la clave como nombre
          }
        })
      );

      return NextResponse.json(filesInfo); // Responde con el array de nombres de archivos
    } else {
      // Si no se encuentran resultados
      console.log('Archivos no encontrados para lessonId:', lessonIdNumber);
      return NextResponse.json(
        { message: 'Archivos no encontrados' },
        { status: 404 }
      );
    }
  } catch (error) {
    // Si ocurre un error en la consulta, respondemos con error 500
    console.error('Error en la consulta a la base de datos:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
