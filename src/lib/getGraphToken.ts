interface GraphTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  ext_expires_in?: number;
  error?: string;
  error_description?: string;
}

export async function getGraphToken() {
  const tenant = process.env.NEXT_PUBLIC_TENANT_ID!;
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    }
  );

  const data = (await res.json()) as GraphTokenResponse;

  if (!res.ok)
    throw new Error(data.error_description ?? 'Error obteniendo token');
  return data.access_token;
}
