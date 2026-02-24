import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@commpro/database';
import { AppError } from '../middleware/errorHandler';
import { twilioVoiceService } from '../services/twilioVoiceService';
import { twimlGenerators } from '../utils/twiml';
import { initiateCallSchema, getCallsSchema } from '../utils/validation';

export const callsController = {
  /**
   * Initiate an outbound call
   * POST /api/calls/initiate
   */
  initiateCall: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = initiateCallSchema.parse(req.body);

      // Verify that 'from' number belongs to user
      const phoneNumber = await prisma.phoneNumber.findFirst({
        where: {
          phoneNumber: data.from,
          userId: req.user.userId,
        },
      });

      if (!phoneNumber) {
        throw new AppError('From number does not belong to you', 403);
      }

      // Get or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          userId: req.user.userId,
          phoneNumber: data.to,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            userId: req.user.userId,
            phoneNumber: data.to,
          },
        });
      }

      // Create TwiML webhook URL (will dial the 'to' number)
      const webhookUrl = `${process.env.TWILIO_VOICE_WEBHOOK_URL}/outbound`;

      // Initiate call via Twilio
      const twilioCall = await twilioVoiceService.initiateCall(
        data.from,
        data.to,
        webhookUrl
      );

      // Save to database
      const call = await prisma.call.create({
        data: {
          userId: req.user.userId,
          contactId: contact.id,
          fromNumber: data.from,
          toNumber: data.to,
          direction: 'OUTBOUND',
          twilioCallSid: twilioCall.sid,
          status: 'QUEUED',
          startedAt: twilioCall.dateCreated,
        },
      });

      res.status(201).json({
        message: 'Call initiated successfully',
        call: {
          id: call.id,
          from: call.fromNumber,
          to: call.toNumber,
          status: call.status,
          direction: call.direction,
          twilioSid: call.twilioCallSid,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Get call history
   * GET /api/calls
   */
  getCalls: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const query = getCallsSchema.parse({
        direction: req.query.direction,
        status: req.query.status,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      const where: any = {
        userId: req.user.userId,
      };

      if (query.direction) {
        where.direction = query.direction;
      }

      if (query.status) {
        where.status = query.status;
      }

      const calls = await prisma.call.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      });

      res.status(200).json({
        count: calls.length,
        calls,
        limit: query.limit,
        offset: query.offset,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(`Validation error: ${error.errors[0].message}`, 400));
      } else {
        next(error);
      }
    }
  },

  /**
   * Get call details
   * GET /api/calls/:id
   */
  getCall: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const call = await prisma.call.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
        include: {
          contact: {
            select: {
              id: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!call) {
        throw new AppError('Call not found', 404);
      }

      res.status(200).json({ call });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get call quality metrics
   * GET /api/calls/:id/quality
   */
  getCallQuality: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const call = await prisma.call.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
      });

      if (!call) {
        throw new AppError('Call not found', 404);
      }

      // Get quality metrics from Twilio
      const qualityMetrics = await twilioVoiceService.getCallQuality(call.twilioCallSid || '');

      res.status(200).json({
        callId: call.id,
        twilioSid: call.twilioCallSid,
        metrics: qualityMetrics,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Webhook: Handle incoming call from Twilio
   * POST /webhook/voice
   */
  handleIncomingCall: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { From, To, CallSid } = req.body;

      console.log(`📞 Incoming call: From=${From}, To=${To}, CallSid=${CallSid}`);

      // Find which user owns the 'To' number
      const phoneNumber = await prisma.phoneNumber.findUnique({
        where: { phoneNumber: To },
      });

      if (!phoneNumber) {
        console.warn(`Received call for unknown number: ${To}`);
        // Reject call
        return res.status(200).type('text/xml').send(twimlGenerators.reject('rejected'));
      }

      // Get or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          userId: phoneNumber.userId,
          phoneNumber: From,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            userId: phoneNumber.userId,
            phoneNumber: From,
          },
        });
      }

      // Save call to database
      await prisma.call.create({
        data: {
          userId: phoneNumber.userId,
          contactId: contact.id,
          fromNumber: From,
          toNumber: To,
          direction: 'INBOUND',
          twilioCallSid: CallSid,
          status: 'RINGING',
          startedAt: new Date(),
        },
      });

      // TODO: Send push notification to user's mobile app (CallKit/Telecom)
      // For now, just forward to a default number or voicemail

      // Generate TwiML to forward call
      // In production, this would forward to user's registered mobile device
      const twiml = twimlGenerators.voicemail(60);

      res.status(200).type('text/xml').send(twiml);
    } catch (error) {
      console.error('Incoming call webhook error:', error);
      // Always return 200 to Twilio
      res.status(200).type('text/xml').send(twimlGenerators.hangup());
    }
  },

  /**
   * Webhook: Handle outbound call TwiML
   * POST /webhook/voice/outbound
   */
  handleOutboundCall: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { From, To, CallSid } = req.body;

      console.log(`📞 Outbound call TwiML: From=${From}, To=${To}, CallSid=${CallSid}`);

      // Generate TwiML to dial the 'To' number
      const twiml = twimlGenerators.dial(To, From, 30);

      res.status(200).type('text/xml').send(twiml);
    } catch (error) {
      console.error('Outbound call TwiML error:', error);
      res.status(200).type('text/xml').send(twimlGenerators.hangup());
    }
  },

  /**
   * Webhook: Handle call status updates from Twilio
   * POST /webhook/voice/status
   */
  handleCallStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        CallSid,
        CallStatus,
        CallDuration,
        RecordingUrl,
        RecordingDuration,
        From,
        To,
      } = req.body;

      console.log(`🔄 Call status update: CallSid=${CallSid}, Status=${CallStatus}`);

      // Find call in database
      const call = await prisma.call.findUnique({
        where: { twilioCallSid: CallSid },
      });

      if (!call) {
        console.warn(`Status update for unknown call: ${CallSid}`);
        return res.status(200).send('OK');
      }

      // Map Twilio status to our status
      const statusMap: Record<string, any> = {
        initiated: 'QUEUED',
        queued: 'QUEUED',
        ringing: 'RINGING',
        'in-progress': 'IN_PROGRESS',
        completed: 'COMPLETED',
        busy: 'BUSY',
        failed: 'FAILED',
        'no-answer': 'NO_ANSWER',
        canceled: 'CANCELLED',
        cancelled: 'CANCELLED',
      };

      const updateData: any = {
        status: statusMap[CallStatus] || CallStatus.toUpperCase(),
      };

      // Update call duration and ended time for completed calls
      if (CallStatus === 'completed' && CallDuration) {
        updateData.duration = parseInt(CallDuration);
        updateData.endedAt = new Date();

        // Fetch pricing from Twilio
        try {
          const twilioCall = await twilioVoiceService.getCall(CallSid);
          if (twilioCall.price) {
            updateData.cost = Math.abs(parseFloat(twilioCall.price));
          }
        } catch (error) {
          console.error('Failed to fetch call pricing:', error);
        }
      }

      // Save recording URL if available
      if (RecordingUrl) {
        updateData.recordingUrl = RecordingUrl;
        updateData.recordingDuration = parseInt(RecordingDuration || '0');
      }

      // Update call in database
      await prisma.call.update({
        where: { id: call.id },
        data: updateData,
      });

      res.status(200).send('OK');
    } catch (error) {
      console.error('Call status webhook error:', error);
      res.status(200).send('OK');
    }
  },
};
