// serverWrappers.ts
'use server';

import { setRole, removeRole } from '~/server/actions/_actions';

// Wrapper para setRole
export async function setRoleWrapper(formData: FormData) {
    await setRole(formData);
}

// Wrapper para removeRole
export async function removeRoleWrapper(formData: FormData) {
    await removeRole(formData);
}
