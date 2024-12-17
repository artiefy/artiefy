//src\utils\roles.ts

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Roles } from '~/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata.role === role
}