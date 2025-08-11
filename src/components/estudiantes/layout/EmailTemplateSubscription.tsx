export interface EmailTemplateProps {
  to: string;
  userName: string;
  expirationDate: string;
  timeLeft: string;
}

interface TemplateProps {
  userName: string;
  expirationDate: string;
  timeLeft: string;
}

export function EmailTemplateSubscription({
  userName,
  expirationDate,
  timeLeft,
}: TemplateProps): string {
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
            max-width:480px;
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
              <h1 style="color:#01142B;font-size:2.2rem;font-weight:700;margin-bottom:16px;">¡Hola${userName ? `, ${userName}` : ""}!</h1>
              <p style="color:#01142B;font-size:1.3rem;font-weight:600;margin-bottom:24px;">
                Tu suscripción <span style="color:#3B82F6;">Artiefy</span> está por vencer.
              </p>
              <p style="color:#01142B;font-size:1.1rem;margin-bottom:24px;">
                ${
                  timeLeft === "hoy"
                    ? '<span style="color:#3B82F6;font-weight:600;">¡Hoy es el último día!</span>'
                    : `Quedan <span style='color:#3B82F6;font-weight:600;'>${timeLeft}</span> para renovar tu acceso.`
                }
              </p>
              <p style="color:#01142B;font-size:1rem;margin-bottom:32px;">
                Fecha de expiración: <span style="color:#3B82F6;font-weight:600;">${expirationDate}</span>
              </p>
              <a href="https://artiefy.com/planes" style="
                display:inline-block;
                width:100%;
                max-width:320px;
                padding:16px 0;
                background:linear-gradient(90deg,#3AF4EF,#00BDD8,#2ecc71);
                color:#01142B;
                font-size:1.2rem;
                font-weight:700;
                border-radius:8px;
                text-decoration:none;
                margin-bottom:24px;
                box-shadow:0 2px 8px rgba(0,0,0,0.12);
                letter-spacing:1px;
                transition:background 0.3s;
                text-align:center;
              ">
                Renovar suscripción
              </a>
              <p style="color:#01142B;font-size:0.95rem;margin-top:32px;">Si ya renovaste, puedes ignorar este mensaje.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
