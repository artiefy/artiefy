export function generateEmailTemplate(userName: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <div style="text-align: center;">
        <img src="cid:logo@artiefy.com" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
      </div>
      <h2 style="color: #333;">Hola, ${userName}</h2>
      <p style="color: #555;">${message}</p>
      <p style="color: #555;">Gracias por ser parte de nuestra plataforma.</p>
      <p style="color: #555;">Saludos,<br>El equipo de Artiefy</p>
    </div>
  `;
}
