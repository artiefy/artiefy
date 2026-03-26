interface EmailTemplateNewAccountProps {
  userName: string;
  email: string;
  temporaryPassword: string;
  signInUrl: string;
}

export function EmailTemplateNewAccount({
  userName,
  email,
  temporaryPassword,
  signInUrl,
}: EmailTemplateNewAccountProps): string {
  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:620px;margin:0 auto;padding:24px;">
          <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#01142B;">Bienvenido a Artiefy, ${userName}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">
              Detectamos una compra de curso individual con este correo y te creamos una cuenta para que puedas iniciar sesion de inmediato.
            </p>
            <div style="margin:18px 0;padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;"><strong>Correo:</strong> ${email}</p>
              <p style="margin:0;"><strong>Contrasena temporal:</strong> ${temporaryPassword}</p>
            </div>
            <p style="margin:0 0 16px;font-size:14px;color:#334155;">
              Por seguridad, cambia tu contrasena en cuanto ingreses.
            </p>
            <a href="${signInUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#22C4D3;color:#00111f;text-decoration:none;font-weight:700;">
              Iniciar sesion en Artiefy
            </a>
            <p style="margin:20px 0 0;font-size:12px;color:#64748b;">
              Si no reconoces esta accion, contactanos en direcciongeneral@artiefy.com.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
