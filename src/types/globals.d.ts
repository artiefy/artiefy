export {}

// Create a type for the roles
export type Roles = 'admin' | 'profesor' | 'estudiante' 


declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}