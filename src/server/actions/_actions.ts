'use server';

import { clerkClient } from '@clerk/nextjs/server';

export async function setRole(formData: FormData) {
  const client = await clerkClient();

  try {
    const res = await client.users.updateUser(formData.get('id') as string, {
      publicMetadata: { role: formData.get('role') },
    });
    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err };
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient();

  try {
    const res = await client.users.updateUser(formData.get('id') as string, {
      publicMetadata: { role: null },
    });
    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err };
  }
}
