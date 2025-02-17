import fetch from 'node-fetch';

const CLERK_API_URL = 'https://api.clerk.dev/v1';
const CLERK_API_KEY = process.env.CLERK_SECRET_KEY;

export async function updateUserRole(userId: string, newRole: string) {
  const response = await fetch(`${CLERK_API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLERK_API_KEY}`,
    },
    body: JSON.stringify({
      public_metadata: {
        role: newRole,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user role: ${response.statusText}`);
  }

  return await response.json();
}
