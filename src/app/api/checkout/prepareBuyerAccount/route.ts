import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';

import { EmailTemplateNewAccount } from '~/components/estudiantes/layout/EmailTemplateNewAccount';
import { sendTicketEmail } from '~/lib/emails/ticketEmails';
import { generarPasswordSegura } from '~/utils/generatePassword';

type RequestBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

function buildNames(email: string, firstName?: string, lastName?: string) {
  if (firstName && lastName) {
    return {
      firstName: firstName.trim().slice(0, 40),
      lastName: lastName.trim().slice(0, 60),
    };
  }

  const local = email.split('@')[0] ?? 'estudiante';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, ' ').trim();
  const parts = cleaned
    .split(/[._\-\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    firstName: (parts[0] ?? 'Estudiante').slice(0, 40),
    lastName: (parts.slice(1).join(' ') || 'Artiefy').slice(0, 60),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const normalizedEmail = body.email?.trim().toLowerCase() ?? '';

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
    }

    const clerk = await clerkClient();
    const existing = await clerk.users.getUserList({
      emailAddress: [normalizedEmail],
    });

    if (existing.totalCount > 0) {
      return NextResponse.json({
        hasExistingAccount: true,
        accountCreated: false,
        credentialsEmailSent: false,
      });
    }

    const { firstName, lastName } = buildNames(
      normalizedEmail,
      body.firstName,
      body.lastName
    );
    const temporaryPassword = generarPasswordSegura();

    const usernameBase = normalizedEmail
      .split('@')[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 16);

    await clerk.users.createUser({
      firstName,
      lastName,
      username:
        `payu_${usernameBase || 'student'}_${Date.now().toString(36)}`.slice(
          0,
          40
        ),
      password: temporaryPassword,
      emailAddress: [normalizedEmail],
      publicMetadata: {
        role: 'estudiante',
        mustChangePassword: true,
        subscriptionStatus: 'inactive',
        createdFrom: 'payu_pre_payment_account_creation',
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
      'https://artiefy.com';
    const signInUrl = `${baseUrl}/sign-in?email=${encodeURIComponent(normalizedEmail)}`;

    const emailResponse = await sendTicketEmail({
      to: normalizedEmail,
      subject: 'Tu nueva cuenta de Artiefy ya esta lista',
      html: EmailTemplateNewAccount({
        userName: firstName,
        email: normalizedEmail,
        temporaryPassword,
        signInUrl,
      }),
    });

    if (!emailResponse.success) {
      return NextResponse.json(
        {
          error:
            'Cuenta creada, pero no fue posible enviar credenciales por correo. Contacta soporte.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasExistingAccount: false,
      accountCreated: true,
      credentialsEmailSent: true,
      temporaryPassword,
    });
  } catch (error) {
    console.error('❌ prepareBuyerAccount error:', error);
    return NextResponse.json(
      { error: 'Error preparando la cuenta del comprador' },
      { status: 500 }
    );
  }
}
