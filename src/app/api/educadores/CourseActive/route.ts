import { NextResponse } from 'next/server';


export function GET() {
	return NextResponse.json([
		{ id: true, name: 'Activo' },
		{ id: false, name: 'Inactivo' },
	]);
}
