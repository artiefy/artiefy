import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import { activities, courses, lessons, users } from '~/server/db/schema';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.PASS,
  },
});

interface GradeEmailData {
  studentName: string;
  courseName: string;
  lessonName: string;
  activityName: string;
  grade: number;
  gradesUrl: string;
}

function buildGradeEmailHtml({
  studentName,
  courseName,
  lessonName,
  activityName,
  grade,
  gradesUrl,
}: GradeEmailData): string {
  return `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap');
        </style>
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Montserrat',Arial,sans-serif;">
        <div style="min-height:100vh;width:100%;padding:32px 16px;background:#f3f4f6;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;box-shadow:0 2px 16px rgba(1,20,43,0.08);padding:40px 32px;">
            <h1 style="color:#01142B;font-size:1.5rem;font-weight:700;margin:0 0 8px 0;">
              Calificación registrada
            </h1>
            <p style="color:#01142B;font-size:1rem;line-height:1.5;margin:0 0 24px 0;">
              Estimado(a) ${studentName}, le informamos que se ha registrado una calificación para la siguiente actividad.
            </p>
            <div style="text-align:left;background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 10px 0;color:#01142B;font-size:0.95rem;"><strong>Curso:</strong> ${courseName}</p>
              <p style="margin:0 0 10px 0;color:#01142B;font-size:0.95rem;"><strong>Clase:</strong> ${lessonName}</p>
              <p style="margin:0;color:#01142B;font-size:0.95rem;"><strong>Actividad:</strong> ${activityName}</p>
            </div>
            <div style="text-align:center;background:linear-gradient(90deg,#3AF4EF,#00BDD8,#2ecc71);border-radius:12px;padding:18px;margin-bottom:28px;">
              <p style="margin:0;color:#01142B;font-size:0.8rem;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">
                Calificación obtenida
              </p>
              <p style="margin:4px 0 0 0;color:#01142B;font-size:2rem;font-weight:700;">
                ${grade.toFixed(1)}
              </p>
            </div>
            <a href="${gradesUrl}" style="display:inline-block;width:100%;max-width:320px;padding:14px 0;background:#01142B;color:#ffffff;font-size:1rem;font-weight:700;border-radius:8px;text-decoration:none;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
              Ver mis calificaciones
            </a>
            <p style="color:#64748b;font-size:0.8rem;line-height:1.5;margin-top:28px;">
              Este es un mensaje automático de Artiefy. Si considera que existe un error en esta calificación, comuníquese con su educador.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface SendActivityGradeEmailParams {
  activityId: number;
  userId: string;
  grade: number;
}

// Se usa desde los tres puntos de calificación manual de actividades de curso
// (archivo/URL, consolidado de notas y autocompletado). Nunca lanza: un fallo
// de correo no debe tumbar la respuesta de la calificación en sí.
export async function sendActivityGradeEmail({
  activityId,
  userId,
  grade,
}: SendActivityGradeEmailParams): Promise<void> {
  try {
    const [context] = await db
      .select({
        activityName: activities.name,
        lessonId: lessons.id,
        lessonName: lessons.title,
        courseName: courses.title,
      })
      .from(activities)
      .innerJoin(lessons, eq(activities.lessonsId, lessons.id))
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(activities.id, activityId));

    const [student] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    if (!context || !student?.email) {
      console.warn(
        `No se pudo enviar correo de calificación: faltan datos para activityId=${activityId} userId=${userId}`
      );
      return;
    }

    // Corrige en vuelo un typo conocido en datos existentes (gmaail.com en
    // lugar de gmail.com) sin tocar el registro en la base de datos.
    const to = student.email.replace(/@gmaail\.com$/i, '@gmail.com');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
    const html = buildGradeEmailHtml({
      studentName: student.name ?? 'estudiante',
      courseName: context.courseName,
      lessonName: context.lessonName,
      activityName: context.activityName,
      grade,
      gradesUrl: `${baseUrl}/estudiantes/clases/${context.lessonId}`,
    });

    const info = await transporter.sendMail({
      from: `"Artiefy" <${process.env.SMTP_USER}>`,
      to,
      subject: `Calificación registrada - ${context.activityName}`,
      html,
    });
    console.log(`Correo de calificación enviado a ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('Error enviando correo de calificación:', error);
  }
}
