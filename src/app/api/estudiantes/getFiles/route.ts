import { NextResponse } from "next/server";

import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { lessons } from "~/server/db/schema";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId || isNaN(Number(lessonId))) {
    return NextResponse.json({ message: "Invalid lessonId" }, { status: 400 });
  }

  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, parseInt(lessonId)),
      columns: {
        resourceKey: true,
        resourceNames: true,
      },
    });

    if (!lesson?.resourceKey || !lesson?.resourceNames) {
      return NextResponse.json({ files: [] });
    }

    const resourceKeys = lesson.resourceKey.split(",").filter(Boolean);
    const resourceNames = lesson.resourceNames.split(",").filter(Boolean);

    const filesInfo = await Promise.all(
      resourceKeys.map(async (key, index) => {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key.trim(),
        };

        try {
          await s3Client.send(new HeadObjectCommand(params));
          return {
            key: key.trim(),
            fileName: resourceNames[index]?.trim() || key.trim(),
          };
        } catch (err) {
          console.error(`Error checking file ${key}:`, err);
          return null;
        }
      }),
    );

    const validFiles = filesInfo.filter(
      (file): file is NonNullable<typeof file> => file !== null,
    );
    return NextResponse.json(validFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
