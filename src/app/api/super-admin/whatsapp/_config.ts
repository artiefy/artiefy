// src/app/api/super-admin/whatsapp/_config.ts

export interface WhatsAppSession {
  name: string;
  displayName: string;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  phoneNumber: string;
}

export const WHATSAPP_SESSIONS: Record<string, WhatsAppSession> = {
  soporte: {
    name: 'soporte',
    displayName: 'Soporte',
    wabaId: '683921414745007',
    phoneNumberId: '805951652593761',
    accessToken:
      'EAAgXFWT4Gt8BPRnyw8HZA038BKjYZAgQQN4q83KlIfQPeaq58gFlZAerzNTYmthlZA6h9CZBqZC9ZCS2Sp21JeRiW9go6iKonNdRsRzZBVrC5FkMgt84O8hMkpg8GODzU5tL8cCyKocnKl7ymjZCe84KompirjoRHZBvyX9uilAqEBBEF9gZABzTcf47ZCPpe9ovB4u0CAZDZD',
    phoneNumber: '+57 318 4446976',
  },
  sesion2: {
    name: 'sesion2',
    displayName: 'Sesión 2',
    // 🔄 CAMBIAR ESTOS VALORES CUANDO EL NUEVO NÚMERO ESTÉ VERIFICADO
    wabaId: '683921414745007', // ← Cambiar por el WABA ID del nuevo número
    phoneNumberId: '805951652593761', // ← Cambiar por el Phone Number ID del nuevo número
    accessToken:
      'EAAgXFWT4Gt8BPRnyw8HZA038BKjYZAgQQN4q83KlIfQPeaq58gFlZAerzNTYmthlZA6h9CZBqZC9ZCS2Sp21JeRiW9go6iKonNdRsRzZBVrC5FkMgt84O8hMkpg8GODzU5tL8cCyKocnKl7ymjZCe84KompirjoRHZBvyX9uilAqEBBEF9gZABzTcf47ZCPpe9ovB4u0CAZDZD', // ← Cambiar por el token del nuevo número
    phoneNumber: '+57 318 3414976', // ← Cambiar por el nuevo número
  },
};

export function getSession(sessionName?: string): WhatsAppSession {
  const name = sessionName ?? 'soporte';
  return WHATSAPP_SESSIONS[name] || WHATSAPP_SESSIONS.soporte!;
}
