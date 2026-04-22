import { auth } from '@clerk/nextjs/server';

import { type Roles } from '~/types/globals';

import 'server-only';

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata.role === role;
};
