import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface PreguntaBase {
	id: string;
	pesoPregunta?: string | number;
	porcentaje?: string | number;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const activityId = searchParams.get('activityId');

		if (!activityId) {
			return NextResponse.json(
				{ error: 'activityId es requerido' },
				{ status: 400 }
			);
		}

		let totalUsado = 0;

		console.log(`🟡 Buscando porcentajes para activityId: ${activityId}`);

		const resumen = {
			opcionMultiple: 0,
			verdaderoFalso: 0,
			completar: 0,
		};

		// 🟡 Opción Múltiple
		const preguntasOMRaw = await redis.get(
			`activity:${activityId}:questionsOM`
		);
		console.log('📦 preguntasOM desde Redis:', preguntasOMRaw);

		const preguntasOM = Array.isArray(preguntasOMRaw)
			? (preguntasOMRaw as PreguntaBase[])
			: null;

		if (preguntasOM) {
			const sumaOM = preguntasOM.reduce((acc, p, i) => {
				const raw = p.pesoPregunta ?? p.porcentaje ?? '0';
				const valor = typeof raw === 'number' ? raw : parseFloat(raw);
				console.log(`🔢 OM[${i}] = ${raw} -> ${valor}`);
				return acc + (isNaN(valor) ? 0 : valor);
			}, 0);
			resumen.opcionMultiple = sumaOM;
			totalUsado += sumaOM;
		}

		// 🔵 Verdadero/Falso
		const preguntasVOFRaw = await redis.get(
			`activity:${activityId}:questionsVOF`
		);
		console.log('📦 preguntasVOF desde Redis:', preguntasVOFRaw);

		const preguntasVOF = Array.isArray(preguntasVOFRaw)
			? (preguntasVOFRaw as PreguntaBase[])
			: null;

		if (preguntasVOF) {
			const sumaVOF = preguntasVOF.reduce((acc, p, i) => {
				const raw = p.pesoPregunta ?? p.porcentaje ?? '0';
				const valor = typeof raw === 'number' ? raw : parseFloat(raw);
				console.log(`🔢 VOF[${i}] = ${raw} -> ${valor}`);
				return acc + (isNaN(valor) ? 0 : valor);
			}, 0);
			resumen.verdaderoFalso = sumaVOF;
			totalUsado += sumaVOF;
		}

		// 🟢 Completar
		const preguntasCompletarRaw = await redis.get(
			`activity:${activityId}:questionsACompletar`
		);
		console.log('📦 preguntasCompletar desde Redis:', preguntasCompletarRaw);

		const preguntasCompletar = Array.isArray(preguntasCompletarRaw)
			? (preguntasCompletarRaw as PreguntaBase[])
			: null;

		if (preguntasCompletar) {
			const sumaCompletar = preguntasCompletar.reduce((acc, p, i) => {
				const raw = p.pesoPregunta ?? p.porcentaje ?? '0';
				const valor = typeof raw === 'number' ? raw : parseFloat(raw);
				console.log(`🔢 Completar[${i}] = ${raw} -> ${valor}`);
				return acc + (isNaN(valor) ? 0 : valor);
			}, 0);
			resumen.completar = sumaCompletar;
			totalUsado += sumaCompletar;
		}

		const disponible = Math.max(0, 100 - totalUsado);

		console.log('✅ RESUMEN FINAL:', resumen);
		console.log(`🧮 Total usado: ${totalUsado} | ✅ Disponible: ${disponible}`);

		return NextResponse.json({
			usado: totalUsado,
			disponible,
			resumen,
		});
	} catch (error) {
		console.error('❌ Error al obtener porcentajes de actividad:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
