import { type NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
		const preguntasOM = await redis.get(`activity:${activityId}:questionsOM`);
		console.log('📦 preguntasOM desde Redis:', preguntasOM);
		if (Array.isArray(preguntasOM)) {
			const sumaOM = preguntasOM.reduce((acc, p, i) => {
				const valor = parseFloat(p.pesoPregunta ?? p.porcentaje ?? '0');
				console.log(
					`🔢 OM[${i}] pesoPregunta|porcentaje =`,
					p.pesoPregunta ?? p.porcentaje,
					'->',
					valor
				);
				return acc + (isNaN(valor) ? 0 : valor);
			}, 0);
			resumen.opcionMultiple = sumaOM;
			totalUsado += sumaOM;
		} else {
			console.log('⚠️ preguntasOM no es un array');
		}

		// 🔵 Verdadero/Falso
		const preguntasVOF = await redis.get(`activity:${activityId}:questionsVOF`);
		console.log('📦 preguntasVOF desde Redis:', preguntasVOF);
		if (Array.isArray(preguntasVOF)) {
			const sumaVOF = preguntasVOF.reduce((acc, p, i) => {
				const valor = parseFloat(p.pesoPregunta ?? p.porcentaje ?? '0');
				console.log(
					`🔢 VOF[${i}] pesoPregunta|porcentaje =`,
					p.pesoPregunta ?? p.porcentaje,
					'->',
					valor
				);
				return acc + (isNaN(valor) ? 0 : valor);
			}, 0);
			resumen.verdaderoFalso = sumaVOF;
			totalUsado += sumaVOF;
		} else {
			console.log('⚠️ preguntasVOF no es un array');
		}

		// 🟢 Completar
		const preguntasCompletar = await redis.get(
			`activity:${activityId}:questionsACompletar`
		);
		console.log('📦 preguntasCompletar desde Redis:', preguntasCompletar);
		if (Array.isArray(preguntasCompletar)) {
			const sumaCompletar = preguntasCompletar.reduce((acc, p, i) => {
				const valor = parseFloat(p.pesoPregunta ?? p.porcentaje ?? '0');
				console.log(
					`🔢 Completar[${i}] pesoPregunta|porcentaje =`,
					p.pesoPregunta ?? p.porcentaje,
					'->',
					valor
				);
				return acc + (isNaN(valor) ? 0 : valor);
			}, 0);
			resumen.completar = sumaCompletar;
			totalUsado += sumaCompletar;
		} else {
			console.log('⚠️ preguntasCompletar no es un array');
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
