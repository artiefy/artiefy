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
      <body style="margin:0;padding:0;background:#01142B;font-family:'Montserrat',Arial,sans-serif;">
        <div style="
          min-height:100vh;
          width:100vw;
          padding:0;
          margin:0;
          position:relative;
          background: #01142B url('https://artiefy.com/backcorreo.jpg') no-repeat center center;
          background-size: cover;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            max-width:480px;
            width:100%;
            margin:0 auto;
            padding:40px 24px;
            text-align:center;
            background: rgba(1, 20, 43, 0.85);
            border-radius: 16px;
          ">
            <!-- Logo eliminado -->
            <h1 style="color:#fff;font-size:2.2rem;font-weight:700;margin-bottom:16px;">¡Hola${userName ? `, ${userName}` : ''}!</h1>
            <p style="color:#fff;font-size:1.3rem;font-weight:600;margin-bottom:24px;">Tu suscripción <span style="color:#3AF4EF;">Artiefy</span> está por vencer.</p>
            <p style="color:#fff;font-size:1.1rem;margin-bottom:24px;">${timeLeft === 'hoy' ? '¡Hoy es el último día!' : `Quedan <span style='color:#3AF4EF;'>${timeLeft}</span> para renovar tu acceso.`}</p>
            <p style="color:#fff;font-size:1rem;margin-bottom:32px;">Fecha de expiración: <span style="color:#3AF4EF;">${expirationDate}</span></p>
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
            ">
              Renovar suscripción
            </a>
            <p style="color:#fff;font-size:0.95rem;margin-top:32px;">Si ya renovaste, puedes ignorar este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
