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

export const twilioVoiceService = {
  /**
   * Initiate an outbound call
   */
  initiateCall: async (from: string, to: string, webhookUrl: string) => {
    try {
      const client = getTwilioClient();

      const call = await client.calls.create({
        from,
        to,
        url: webhookUrl, // TwiML webhook URL
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
      });

      return {
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        direction: call.direction,
        dateCreated: call.dateCreated,
      };
    } catch (error: any) {
      console.error('Twilio call initiation error:', error);
      throw new AppError(
        error.message || 'Failed to initiate call',
        error.status || 500
      );
    }
  },

  /**
   * Get call details from Twilio
   */
  getCall: async (callSid: string) => {
    try {
      const client = getTwilioClient();
      const call = await client.calls(callSid).fetch();

      return {
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        direction: call.direction,
        duration: call.duration,
        price: call.price,
        priceUnit: call.priceUnit,
        startTime: call.startTime,
        endTime: call.endTime,
        answeredBy: call.answeredBy,
      };
    } catch (error: any) {
      console.error('Twilio get call error:', error);
      throw new AppError(
        error.message || 'Failed to fetch call details',
        error.status || 500
      );
    }
  },

  /**
   * Hangup/terminate an ongoing call
   */
  hangupCall: async (callSid: string) => {
    try {
      const client = getTwilioClient();
      await client.calls(callSid).update({ status: 'completed' });
    } catch (error: any) {
      console.error('Twilio hangup error:', error);
      throw new AppError(
        error.message || 'Failed to hangup call',
        error.status || 500
      );
    }
  },

  /**
   * Get call quality metrics
   */
  getCallQuality: async (callSid: string) => {
    try {
      const client = getTwilioClient();

      // Get call events for quality metrics
      const events = await client.calls(callSid).events.list({ limit: 100 });

      // Extract quality metrics from events
      const qualityMetrics = events
        .filter((event: any) => event.name === 'quality')
        .map((event: any) => ({
          timestamp: event.timestamp,
          metrics: event.data,
        }));

      return qualityMetrics;
    } catch (error: any) {
      console.error('Twilio quality metrics error:', error);
      // Return empty array if metrics not available
      return [];
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
