export {};

// Create a type for the roles
export type Roles = 'admin' | 'educador' | 'estudiante' | 'super-admin';

declare global {
	interface CustomJwtSessionClaims {
		metadata: {
			role?: Roles;
			isNewUser?: boolean;
		};
	}
}

