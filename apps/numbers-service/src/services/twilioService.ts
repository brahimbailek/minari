import twilio from 'twilio';
import { AppError } from '../middleware/errorHandler';

// Country code to Twilio country code mapping
const COUNTRY_CODES: Record<string, string> = {
  FR: 'FR', // France
  US: 'US', // United States
  UK: 'GB', // United Kingdom
  DE: 'DE', // Germany
  ES: 'ES', // Spain
  IT: 'IT', // Italy
};

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new AppError('Twilio credentials not configured', 500);
  }

  return twilio(accountSid, authToken);
};

export const twilioService = {
  /**
   * Search for available phone numbers
   */
  searchAvailableNumbers: async (
    country: string,
    options: {
      areaCode?: string;
      contains?: string;
      limit?: number;
    } = {}
  ) => {
    try {
      const client = getTwilioClient();
      const twilioCountry = COUNTRY_CODES[country];

      if (!twilioCountry) {
        throw new AppError(`Unsupported country: ${country}`, 400);
      }

      // Search for local numbers
      const numbers = await client
        .availablePhoneNumbers(twilioCountry)
        .local.list({
          areaCode: options.areaCode ? parseInt(options.areaCode) : undefined,
          contains: options.contains,
          limit: options.limit || 10,
        });

      return numbers.map((number) => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality,
        region: number.region,
        postalCode: number.postalCode,
        isoCountry: number.isoCountry,
        capabilities: {
          voice: number.capabilities.voice,
          sms: number.capabilities.sms,
          mms: number.capabilities.mms,
        },
      }));
    } catch (error: any) {
      console.error('Twilio search error:', error);
      throw new AppError(
        error.message || 'Failed to search available numbers',
        error.status || 500
      );
    }
  },

  /**
   * Purchase a phone number
   */
  purchaseNumber: async (phoneNumber: string, friendlyName?: string) => {
    try {
      const client = getTwilioClient();

      const purchasedNumber = await client.incomingPhoneNumbers.create({
        phoneNumber,
        friendlyName,
        voiceUrl: process.env.TWILIO_VOICE_WEBHOOK_URL || '',
        smsUrl: process.env.TWILIO_SMS_WEBHOOK_URL || '',
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || '',
      });

      return {
        sid: purchasedNumber.sid,
        phoneNumber: purchasedNumber.phoneNumber,
        friendlyName: purchasedNumber.friendlyName,
        capabilities: purchasedNumber.capabilities,
      };
    } catch (error: any) {
      console.error('Twilio purchase error:', error);
      throw new AppError(
        error.message || 'Failed to purchase number',
        error.status || 500
      );
    }
  },

  /**
   * Release a phone number
   */
  releaseNumber: async (twilioSid: string) => {
    try {
      const client = getTwilioClient();
      await client.incomingPhoneNumbers(twilioSid).remove();
    } catch (error: any) {
      console.error('Twilio release error:', error);
      throw new AppError(
        error.message || 'Failed to release number',
        error.status || 500
      );
    }
  },

  /**
   * Get number details from Twilio
   */
  getNumber: async (twilioSid: string) => {
    try {
      const client = getTwilioClient();
      const number = await client.incomingPhoneNumbers(twilioSid).fetch();

      return {
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: number.capabilities,
        status: number.status,
      };
    } catch (error: any) {
      console.error('Twilio fetch error:', error);
      throw new AppError(
        error.message || 'Failed to fetch number details',
        error.status || 500
      );
    }
  },
};
