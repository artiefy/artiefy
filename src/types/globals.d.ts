export {}

// Create a type for the roles
export type Roles = 'admin' | 'profesor' 

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}