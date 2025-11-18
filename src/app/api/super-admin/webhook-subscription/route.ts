import { NextRequest, NextResponse } from 'next/server';

interface WebhookPayload {
    userId: string;
    email: string;
    name: string;
    daysRemaining: number;
    subscriptionEndDate: string;
    timestamp: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, name, daysRemaining, subscriptionEndDate } = body;

        if (!userId || !email) {
            return NextResponse.json(
                { error: 'Datos de usuario requeridos' },
                { status: 400 }
            );
        }

        // Payload del webhook
        const payload: WebhookPayload = {
            userId,
            email,
            name: name ?? 'N/A',
            daysRemaining: daysRemaining ?? 0,
            subscriptionEndDate: subscriptionEndDate ?? new Date().toISOString(),
            timestamp: new Date().toISOString(),
        };

        // URL del webhook (configurable via variable de entorno)
        const webhookUrl = process.env.SUBSCRIPTION_WEBHOOK_URL;

        // Si no hay URL configurada, solo registrar en logs
        if (!webhookUrl) {
            console.log('Webhook de suscripción activa:', payload);
            return NextResponse.json({
                success: true,
                message: 'Webhook registrado en logs (no hay URL configurada)',
                payload,
            });
        }

        // Enviar webhook al endpoint configurado
        const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Artiefy-Subscription-Checker/1.0',
                // Agregar autenticación si es necesaria
                ...(process.env.WEBHOOK_AUTH_TOKEN && {
                    Authorization: `Bearer ${process.env.WEBHOOK_AUTH_TOKEN}`,
                }),
            },
            body: JSON.stringify(payload),
        });

        if (!webhookResponse.ok) {
            throw new Error(
                `Webhook falló: ${webhookResponse.status} ${webhookResponse.statusText}`
            );
        }

        const responseData = await webhookResponse.json().catch(() => ({}));

        // Log exitoso
        console.log('Webhook enviado exitosamente:', {
            url: webhookUrl,
            userId,
            email,
            status: webhookResponse.status,
        });

        return NextResponse.json({
            success: true,
            message: 'Webhook enviado exitosamente',
            webhookResponse: {
                status: webhookResponse.status,
                data: responseData,
            },
        });
    } catch (error) {
        console.error('Error al enviar webhook:', error);

        // Registrar el error pero no fallar completamente
        return NextResponse.json(
            {
                success: false,
                error: 'Error al enviar webhook',
                details: error instanceof Error ? error.message : 'Error desconocido',
                // Aún así, el usuario verá que la búsqueda fue exitosa
                fallback: 'El webhook no se pudo enviar pero la búsqueda fue exitosa',
            },
            { status: 500 }
        );
    }
}