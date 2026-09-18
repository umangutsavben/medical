import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { z } from 'zod';

const prisma = new PrismaClient();

export async function getCategories(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.medicalCategory.findMany({
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function getHealthParameters(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parameters = await prisma.healthParameter.findMany({
      include: {
        measurements: {
          where: { userId: req.userId },
          orderBy: { measuredAt: 'desc' },
          take: 1,
          select: {
            value: true,
            unit: true,
            measuredAt: true,
          },
        },
        _count: {
          select: {
            measurements: {
              // @ts-ignore - Prisma count with where
            },
          },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    // Count measurements per parameter for this user
    const paramCounts = await Promise.all(
      parameters.map(async (p) => {
        const count = await prisma.healthMeasurement.count({
          where: { userId: req.userId, parameterId: p.id },
        });
        return { parameterId: p.id, count };
      })
    );

    const countMap = new Map(paramCounts.map(c => [c.parameterId, c.count]));

    const result = parameters.map(p => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      defaultUnit: p.defaultUnit,
      description: p.description,
      normalMin: p.normalMin,
      normalMax: p.normalMax,
      latestMeasurement: p.measurements[0] || null,
      measurementCount: countMap.get(p.id) || 0,
    }));

    res.json({ parameters: result });
  } catch (error) {
    next(error);
  }
}

export async function getParameterMeasurements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const paramType = req.params.type;

    const parameter = await prisma.healthParameter.findUnique({
      where: { name: paramType },
    });

    if (!parameter) {
      throw new NotFoundError(`Health parameter '${paramType}' not found`);
    }

    const measurements = await prisma.healthMeasurement.findMany({
      where: {
        userId: req.userId,
        parameterId: parameter.id,
      },
      include: {
        document: { select: { id: true, originalName: true } },
      },
      orderBy: { measuredAt: 'asc' },
    });

    res.json({
      parameter,
      measurements,
    });
  } catch (error) {
    next(error);
  }
}

const correctSchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  measuredAt: z.string().optional(),
});

export async function correctMeasurement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = correctSchema.parse(req.body);
    const measurementId = req.params.id;

    const measurement = await prisma.healthMeasurement.findUnique({
      where: { id: measurementId },
    });

    if (!measurement) {
      throw new NotFoundError('Measurement not found');
    }

    if (measurement.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    const updated = await prisma.healthMeasurement.update({
      where: { id: measurementId },
      data: {
        value: data.value,
        unit: data.unit || measurement.unit,
        measuredAt: data.measuredAt ? new Date(data.measuredAt) : measurement.measuredAt,
        isManualEntry: true,
      },
      include: { parameter: true },
    });

    res.json({ message: 'Measurement corrected', measurement: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors.map(e => e.message).join(', ')));
    } else {
      next(error);
    }
  }
}

export async function getHealthTrends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const paramType = req.params.parameter;

    const parameter = await prisma.healthParameter.findUnique({
      where: { name: paramType },
    });

    if (!parameter) {
      throw new NotFoundError(`Health parameter '${paramType}' not found`);
    }

    const measurements = await prisma.healthMeasurement.findMany({
      where: {
        userId: req.userId,
        parameterId: parameter.id,
      },
      select: {
        id: true,
        value: true,
        unit: true,
        measuredAt: true,
        confidence: true,
        isManualEntry: true,
      },
      orderBy: { measuredAt: 'asc' },
    });

    res.json({
      parameter: {
        name: parameter.name,
        displayName: parameter.displayName,
        defaultUnit: parameter.defaultUnit,
        normalMin: parameter.normalMin,
        normalMax: parameter.normalMax,
      },
      measurements,
      dataPoints: measurements.length,
    });
  } catch (error) {
    next(error);
  }
}
