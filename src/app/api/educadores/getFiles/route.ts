// src/app/api/getFiles/route.ts
import { S3 } from 'aws-sdk';
import { NextResponse } from 'next/server';
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
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

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

      const bucketName = process.env.AWS_S3_BUCKET_NAME;
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
            const headData = await s3.headObject(params).promise();
            return { key, fileName: headData.Metadata?.filename ?? key }; // Regresamos clave y nombre
          } catch (err) {
            console.error(
              `Error al obtener metadata para el archivo ${key}`,
              err
            );
            return { key, fileName: key }; // Si no hay metadata, usamos la clave como nombre
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
