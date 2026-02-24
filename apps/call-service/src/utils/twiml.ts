/**
 * TwiML (Twilio Markup Language) Generators
 * Generate XML responses for Twilio Voice webhooks
 */

export const twimlGenerators = {
  /**
   * Generate TwiML for outbound call
   */
  dial: (toNumber: string, callerId: string, timeout: number = 30): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}" timeout="${timeout}">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`;
  },

  /**
   * Generate TwiML for inbound call (forward to user device)
   */
  forward: (userNumber: string, timeout: number = 30): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Vous avez un appel entrant. Connexion en cours.</Say>
  <Dial timeout="${timeout}" action="/webhook/voice/completed">
    <Number>${userNumber}</Number>
  </Dial>
</Response>`;
  },

  /**
   * Generate TwiML for voicemail
   */
  voicemail: (maxLength: number = 60): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">La personne que vous essayez de joindre n'est pas disponible. Veuillez laisser un message après le bip.</Say>
  <Record maxLength="${maxLength}" action="/webhook/voice/recording" playBeep="true" />
</Response>`;
  },

  /**
   * Generate TwiML to reject call
   */
  reject: (reason: 'busy' | 'rejected' = 'busy'): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Reject reason="${reason}" />
</Response>`;
  },

  /**
   * Generate TwiML for call completed
   */
  hangup: (): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup />
</Response>`;
  },

  /**
   * Generate TwiML to play message
   */
  say: (message: string, language: string = 'fr-FR', voice: string = 'alice'): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${message}</Say>
</Response>`;
  },
};
