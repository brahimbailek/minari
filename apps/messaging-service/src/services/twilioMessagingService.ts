import twilio from 'twilio';
import { AppError } from '../middleware/errorHandler';

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new AppError('Twilio credentials not configured', 500);
  }

  return twilio(accountSid, authToken);
};

export const twilioMessagingService = {
  /**
   * Send SMS message
   */
  sendSMS: async (from: string, to: string, body: string) => {
    try {
      const client = getTwilioClient();

      const message = await client.messages.create({
        from,
        to,
        body,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
      });

      return {
        sid: message.sid,
        status: message.status,
        dateCreated: message.dateCreated,
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      throw new AppError(
        error.message || 'Failed to send SMS',
        error.status || 500
      );
    }
  },

  /**
   * Send MMS message with media
   */
  sendMMS: async (from: string, to: string, body: string, mediaUrls: string[]) => {
    try {
      const client = getTwilioClient();

      const message = await client.messages.create({
        from,
        to,
        body,
        mediaUrl: mediaUrls,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
      });

      return {
        sid: message.sid,
        status: message.status,
        dateCreated: message.dateCreated,
        numMedia: message.numMedia,
      };
    } catch (error: any) {
      console.error('Twilio MMS error:', error);
      throw new AppError(
        error.message || 'Failed to send MMS',
        error.status || 500
      );
    }
  },

  /**
   * Validate Twilio webhook signature for security
   */
  validateWebhook: (signature: string, url: string, params: any): boolean => {
    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!authToken) {
        throw new Error('TWILIO_AUTH_TOKEN not configured');
      }

      return twilio.validateRequest(authToken, signature, url, params);
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  },
};
