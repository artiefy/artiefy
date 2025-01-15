import {
  AbortMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const MAX_SIMPLE_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

// Simplificamos la creación del cliente S3
const client = new S3Client({ region: process.env.AWS_REGION });

export async function POST(request: Request) {
  const { contentType, fileSize } = (await request.json()) as {
    contentType: string;
    fileSize: number;
  };

  try {
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error("AWS_BUCKET_NAME no está definido");
    }
    const key = `uploads/${uuidv4()}`; // Agregamos un prefijo 'uploads/' para mejor organización

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(
        "El archivo es demasiado grande. El tamaño máximo permitido es 1 GB.",
      );
    }

    if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
      // Carga simple para archivos pequeños (hasta 100 MB)
      const { url, fields } = await createPresignedPost(client, {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Conditions: [
          ["content-length-range", 0, MAX_SIMPLE_UPLOAD_SIZE],
          ["starts-with", "$Content-Type", ""],
        ],
        Fields: {
          "Content-Type": contentType,
          acl: "public-read", // Aseguramos que el objeto sea público
        },
        Expires: 3600, // 1 hora
      });

      return Response.json({ url, fields, key, uploadType: "simple" });
    } else {
      // Carga multiparte para archivos grandes (100 MB - 1 GB)
      const multipartUpload = await client.send(
        new CreateMultipartUploadCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          ContentType: contentType,
          ACL: "public-read", // Aseguramos que el objeto sea público
        }),
      );

      return Response.json({
        uploadId: multipartUpload.UploadId,
        key: key,
        uploadType: "multipart",
      });
    }
  } catch (error) {
    console.error("Error en la carga:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { uploadId, key } = (await request.json()) as {
    uploadId: string;
    key: string;
  };

  try {
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error("AWS_BUCKET_NAME no está definido");
    }

    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
      }),
    );

    return Response.json({ message: "Carga multiparte abortada con éxito" });
  } catch (error) {
    console.error("Error al abortar la carga multiparte:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function PUT(request: NextRequest) {
  try {
    const { key, fileContent, contentType } = await request.json();

    if (!key || !fileContent || !contentType) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 },
      );
    }

    // Verificar si el objeto existe en el bucket
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }),
      );
    } catch (error) {
      return NextResponse.json(
        { error: "El objeto no existe en el bucket" },
        { status: 404 },
      );
    }

    const buffer = Buffer.from(fileContent, "base64");

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: "Imagen actualizada con éxito" });
  } catch (error) {
    console.error("Error al actualizar la imagen:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
