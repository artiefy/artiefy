import { NextResponse } from 'next/server';

import nodemailer from 'nodemailer';

import {
  type EmailTemplateProps,
  EmailTemplateSubscription,
} from '~/components/estudiantes/layout/EmailTemplateSubscription';
import {
  claimDailySubscriptionEmail,
  releaseDailySubscriptionEmail,
} from '~/server/notifications/subscriptionEmailThrottle';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'direcciongeneral@artiefy.com',
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const SUBJECTS = {
  reminder: '¡Importante! Tu suscripción está por vencer',
  expired: 'Tu suscripción de Artiefy ha expirado',
} as const;

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as EmailTemplateProps;
    const { to, userName, expirationDate, timeLeft } = data;
    // Normalized instead of trusted: the payload comes from the browser.
    const kind = data.kind === 'expired' ? 'expired' : 'reminder';

    if (!to?.trim()) {
      return NextResponse.json(
        { error: 'Falta el destinatario del correo' },
        { status: 400 }
      );
    }

    if (!process.env.PASS) {
      return NextResponse.json(
        { error: 'Falta contraseña en variables de entorno' },
        { status: 500 }
      );
    }

    // At most one notification per recipient per day. The banner check runs on
    // every client navigation, so before this claim a student got one email per
    // route they opened.
    const claimed = await claimDailySubscriptionEmail(to);
    if (!claimed) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const html = EmailTemplateSubscription({
      userName,
      expirationDate,
      timeLeft,
      kind,
    });

    const mailOptions = {
      from: '"Artiefy" <direcciongeneral@artiefy.com>',
      to,
      subject: SUBJECTS[kind],
      html,
      replyTo: 'direcciongeneral@artiefy.com',
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      await releaseDailySubscriptionEmail(to);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending email:', (error as Error)?.message ?? error);
    return NextResponse.json(
      { error: 'Error enviando el correo' },
      { status: 500 }
    );
  }
}
