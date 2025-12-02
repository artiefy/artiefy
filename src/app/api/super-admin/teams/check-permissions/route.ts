// Agrega este endpoint temporal para verificar permisos
// src/app/api/super-admin/teams/check-permissions/route.ts

import { NextResponse } from 'next/server';

async function getGraphToken() {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const res = await fetch(
    'https://login.microsoftonline.com/060f4acf-9732-441b-80f7-425de7381dd1/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  const data = (await res.json()) as { access_token?: string };
  return data.access_token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId =
    searchParams.get('userId') ?? '0843f2fa-3e0b-493f-8bb9-84b0aa1b2417';

  console.log('🔐 Verificando permisos para userId:', userId);

  const token = await getGraphToken();
  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 500 });
  }

  const tests = [
    {
      name: 'User Info',
      url: `https://graph.microsoft.com/v1.0/users/${userId}`,
    },
    {
      name: 'Drive Root',
      url: `https://graph.microsoft.com/v1.0/users/${userId}/drive/root`,
    },
    {
      name: 'Drive Children',
      url: `https://graph.microsoft.com/v1.0/users/${userId}/drive/root/children`,
    },
    {
      name: 'Special Folders',
      url: `https://graph.microsoft.com/v1.0/users/${userId}/drive/special/documents`,
    },
    {
      name: 'All Items',
      url: `https://graph.microsoft.com/v1.0/users/${userId}/drive/root/search(q='.mp4')?$top=10`,
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      const res = await fetch(test.url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      results.push({
        name: test.name,
        status: res.status,
        ok: res.ok,
        data: res.ok ? data : { error: data },
      });

      console.log(`${res.ok ? '✅' : '❌'} ${test.name}: ${res.status}`);
    } catch (err) {
      results.push({
        name: test.name,
        error: String(err),
      });
      console.error(`❌ ${test.name}:`, err);
    }
  }

  return NextResponse.json({ results }, { status: 200 });
}
