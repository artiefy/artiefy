import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';

import { ratelimit } from '~/server/ratelimit/ratelimit';
import { getApiSession } from '~/server/utils/apiAuth';

// Exact-email lookup for the "invite member" modal of student projects
// (ModalInvitarIntegrante). Security best practice: signed-in callers only,
// at most one exact match with the minimum fields the modal renders, never
// the user list. The modal used to download every user's email and phone
// from /api/users and filter them in the browser.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAX_EMAIL_LENGTH = 254;

interface InviteCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function GET(request: Request) {
  try {
    const { userId } = await getApiSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') ?? '').trim().toLowerCase();
    if (
      !email ||
      email.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(email)
    ) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    }

    // Slows down using this lookup to enumerate registered emails.
    const { success } = await ratelimit.limit(`users-search:${userId}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
    }

    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });

    const matches: InviteCandidate[] = data.flatMap((user) => {
      const primaryEmail =
        user.emailAddresses.find(
          (address) => address.id === user.primaryEmailAddressId
        )?.emailAddress ?? '';
      if (primaryEmail.toLowerCase() !== email) return [];
      return [
        {
          id: user.id,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: primaryEmail,
        },
      ];
    });

    return NextResponse.json(matches);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo buscar el usuario' },
      { status: 500 }
    );
  }
}
