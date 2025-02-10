let authToken: string | null = null;
let tokenExpiry: number | null = null;

interface AuthResponse {
  token: string;
}

const getAuthToken = async (): Promise<string> => {
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('Using existing JWT token');
    return authToken;
  }

  console.log('Fetching new JWT token with public key:', process.env.EPAYCO_PUBLIC_KEY);

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener el token de autenticación');
  }

  const data: AuthResponse = await response.json() as AuthResponse;
  authToken = data.token;
  tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutos

  console.log('Obtained new JWT token:', authToken);

  return authToken;
};

export { getAuthToken };
