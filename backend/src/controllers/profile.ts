import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', '']).optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
});

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { documents: true, healthMeasurements: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({ profile: user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        profilePhoto: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'Profile updated', profile: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => e.message).join(', ');
      next(new ValidationError(message));
    } else {
      next(error);
    }
  }
}
