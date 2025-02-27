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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 10px; border: 2px solid #00BDD8;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="cid:logo@artiefy.com" alt="Artiefy Logo" style="max-width: 150px;"/>
      </div>
      
      <h2 style="color: #01142B; margin-bottom: 20px;">¡Atención ${userName}!</h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #dc3545; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
          Tu suscripción expirará en ${timeLeft}
        </p>
        <p style="color: #666; margin-bottom: 5px;">
          Fecha de expiración: ${expirationDate}
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/planes" 
           style="background-color: #00BDD8; color: white; padding: 12px 25px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold;">
          Renovar Suscripción
        </a>
      </div>
    </div>
  `;
}
