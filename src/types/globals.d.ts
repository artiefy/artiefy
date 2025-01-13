export {};

// Create a type for the roles
export type Roles = 'admin' | 'educador' | 'estudiante';

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: Roles;
        };
    }
}
