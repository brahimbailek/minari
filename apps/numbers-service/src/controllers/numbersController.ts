import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@commpro/database';
import { AppError } from '../middleware/errorHandler';
import { twilioService } from '../services/twilioService';
import {
  searchNumbersSchema,
  purchaseNumberSchema,
  updateNumberSchema,
} from '../utils/validation';

export const numbersController = {
  /**
   * Search available numbers
   * GET /api/numbers/available?country=FR&areaCode=33&contains=123
   */
  searchAvailable: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = searchNumbersSchema.parse({
        country: req.query.country,
        areaCode: req.query.areaCode,
        contains: req.query.contains,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      const numbers = await twilioService.searchAvailableNumbers(data.country, {
        areaCode: data.areaCode,
        contains: data.contains,
        limit: data.limit,
      });

      res.status(200).json({
        country: data.country,
        count: numbers.length,
        numbers,
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
   * Get user's phone numbers
   * GET /api/numbers
   */
  getUserNumbers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const numbers = await prisma.phoneNumber.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        count: numbers.length,
        numbers,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a single phone number
   * GET /api/numbers/:id
   */
  getNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const number = await prisma.phoneNumber.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
      });

      if (!number) {
        throw new AppError('Phone number not found', 404);
      }

      res.status(200).json({ number });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Purchase a phone number
   * POST /api/numbers/purchase
   */
  purchaseNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = purchaseNumberSchema.parse(req.body);

      // Check if number already exists
      const existingNumber = await prisma.phoneNumber.findUnique({
        where: { phoneNumber: data.phoneNumber },
      });

      if (existingNumber) {
        throw new AppError('Phone number already purchased', 409);
      }

      // Purchase from Twilio
      const twilioNumber = await twilioService.purchaseNumber(
        data.phoneNumber,
        data.friendlyName
      );

      // Extract country code from phone number
      const countryCode = data.phoneNumber.substring(0, 3); // Simple extraction

      // Save to database
      const number = await prisma.phoneNumber.create({
        data: {
          userId: req.user.userId,
          phoneNumber: twilioNumber.phoneNumber,
          friendlyName: twilioNumber.friendlyName || data.friendlyName,
          countryCode,
          twilioSid: twilioNumber.sid,
          twilioCapabilities: twilioNumber.capabilities as any,
          monthlyCost: 1.0, // TODO: Get actual pricing from Twilio
          status: 'ACTIVE',
        },
      });

      res.status(201).json({
        message: 'Phone number purchased successfully',
        number,
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
   * Update phone number
   * PUT /api/numbers/:id
   */
  updateNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = updateNumberSchema.parse(req.body);

      // Check if number exists and belongs to user
      const existingNumber = await prisma.phoneNumber.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
      });

      if (!existingNumber) {
        throw new AppError('Phone number not found', 404);
      }

      // Update number
      const number = await prisma.phoneNumber.update({
        where: { id: req.params.id },
        data: {
          friendlyName: data.friendlyName,
        },
      });

      res.status(200).json({
        message: 'Phone number updated successfully',
        number,
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
   * Release a phone number
   * DELETE /api/numbers/:id
   */
  releaseNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // Check if number exists and belongs to user
      const number = await prisma.phoneNumber.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
      });

      if (!number) {
        throw new AppError('Phone number not found', 404);
      }

      // Release from Twilio
      await twilioService.releaseNumber(number.twilioSid);

      // Delete from database
      await prisma.phoneNumber.delete({
        where: { id: number.id },
      });

      res.status(200).json({
        message: 'Phone number released successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
