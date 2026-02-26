interface TemplateProps {
  userName: string;
  projectName: string;
  activityDescription: string;
  dueDate: string;
  timeLeft: string;
  projectUrl: string;
  objectiveDescription?: string;
}

export function EmailTemplateProjectActivityDue({
  userName,
  projectName,
  activityDescription,
  dueDate,
  timeLeft,
  projectUrl,
  objectiveDescription,
}: TemplateProps): string {
  const timeLeftMessage =
    timeLeft === 'hoy'
      ? '¡Hoy es el último día para entregar!'
      : `Quedan ${timeLeft} para entregar.`;

  return `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap" rel="stylesheet" type="text/css" />
        <style>
          @import url('https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap');
        </style>
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Montserrat',Arial,sans-serif;">
        <div style="
          min-height:100vh;
          width:100vw;
          padding:0;
          margin:0;
          position:relative;
          background: #f3f4f6;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        ">
          <div style="
            max-width:520px;
            width:100%;
            margin:48px 0 0 8vw;
            padding:0;
            background:transparent;
            border:none;
            box-shadow:none;
          ">
            <div style="
              background: #fff;
              border-radius: 18px;
              box-shadow: 0 2px 16px rgba(1,20,43,0.08);
              padding:40px 24px;
              text-align:center;
              width:100%;
              display:block;
            ">
              <img
                src="cid:logo@artiefy.com"
                alt="Artiefy Logo"
                style="width:60px;height:auto;max-width:100%;display:block;margin:0 auto 32px auto;"
              />
              <h1 style="color:#01142B;font-size:2rem;font-weight:700;margin-bottom:12px;">
                ¡Hola${userName ? `, ${userName}` : ''}!
              </h1>
              <p style="color:#01142B;font-size:1.2rem;font-weight:600;margin-bottom:20px;">
                Tienes un entregable pendiente en tu proyecto.
              </p>
              <div style="text-align:left;background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 8px 0;color:#01142B;font-size:0.95rem;">
                  <strong>Proyecto:</strong> ${projectName}
                </p>
                ${
                  objectiveDescription
                    ? `<p style="margin:0 0 8px 0;color:#01142B;font-size:0.95rem;"><strong>Objetivo:</strong> ${objectiveDescription}</p>`
                    : ''
                }
                <p style="margin:0 0 8px 0;color:#01142B;font-size:0.95rem;">
                  <strong>Actividad:</strong> ${activityDescription}
                </p>
                <p style="margin:0;color:#01142B;font-size:0.95rem;">
                  <strong>Fecha límite:</strong> <span style="color:#3B82F6;font-weight:600;">${dueDate}</span>
                </p>
              </div>
              <p style="color:#01142B;font-size:1rem;margin-bottom:28px;">
                <span style="color:#3B82F6;font-weight:600;">${timeLeftMessage}</span>
              </p>
              <a href="${projectUrl}" style="
                display:inline-block;
                width:100%;
                max-width:320px;
                padding:14px 0;
                background:linear-gradient(90deg,#3AF4EF,#00BDD8,#2ecc71);
                color:#01142B;
                font-size:1.05rem;
                font-weight:700;
                border-radius:8px;
                text-decoration:none;
                margin-bottom:16px;
                box-shadow:0 2px 8px rgba(0,0,0,0.12);
                letter-spacing:0.5px;
                text-align:center;
              ">
                Ir al proyecto
              </a>
              <p style="color:#01142B;font-size:0.9rem;margin-top:24px;">
                Si ya entregaste la actividad, puedes ignorar este mensaje.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
