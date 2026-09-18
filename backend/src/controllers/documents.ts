import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { ocrService } from '../services/ocr';
import { paramExtractorService } from '../services/paramExtractor';
import { categorizerService } from '../services/categorizer';
import { storageService } from '../services/storage';

const prisma = new PrismaClient();

export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const file = req.file;

    const document = await prisma.medicalDocument.create({
      data: {
        userId: req.userId!,
        fileName: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storagePath: storageService.getFileUrl(file.filename),
        processingStatus: 'UPLOADED',
      },
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        processingStatus: document.processingStatus,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const status = req.query.status as string;
    const categoryId = req.query.categoryId as string;

    const where: any = { userId: req.userId };
    if (status) where.processingStatus = status;
    if (categoryId) where.categoryId = categoryId;

    const [documents, total] = await Promise.all([
      prisma.medicalDocument.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          tags: { select: { id: true, tag: true } },
          extractedText: { select: { id: true, confidence: true } },
          _count: { select: { healthMeasurements: true } },
        },
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.medicalDocument.count({ where }),
    ]);

    res.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const document = await prisma.medicalDocument.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        tags: true,
        extractedText: true,
        healthMeasurements: {
          include: { parameter: true },
          orderBy: { measuredAt: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Authorization: ensure document belongs to requesting user
    if (document.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    res.json({ document });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const document = await prisma.medicalDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    // Delete file from storage
    await storageService.deleteFile(document.fileName);

    // Delete from database (cascade deletes related records)
    await prisma.medicalDocument.delete({
      where: { id: document.id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function processDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const document = await prisma.medicalDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    // Update status to PROCESSING
    await prisma.medicalDocument.update({
      where: { id: document.id },
      data: { processingStatus: 'PROCESSING', processingError: null },
    });

    // Start async processing
    processDocumentAsync(document.id, document.fileName, document.originalName, req.userId!).catch(
      (err) => console.error('Background processing error:', err)
    );

    res.json({
      message: 'Processing started',
      processingStatus: 'PROCESSING',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Async document processing pipeline:
 * 1. OCR text extraction
 * 2. Health parameter extraction
 * 3. Document categorization
 * 4. Tag generation
 */
async function processDocumentAsync(
  documentId: string,
  fileName: string,
  originalName: string,
  userId: string
) {
  try {
    // Step 1: OCR
    console.log(`[OCR] Processing document: ${documentId}`);
    const ocrResult = await ocrService.processFile(fileName);

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      await prisma.medicalDocument.update({
        where: { id: documentId },
        data: {
          processingStatus: 'FAILED',
          processingError: 'No text could be extracted from the document. The image may be blurry or unreadable.',
        },
      });
      return;
    }

    // Step 2: Save extracted text
    await prisma.extractedText.upsert({
      where: { documentId },
      update: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount,
      },
      create: {
        documentId,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount,
      },
    });

    // Step 3: Extract health parameters
    const extractedParams = paramExtractorService.extract(ocrResult.text);
    console.log(`[Params] Extracted ${extractedParams.length} parameters from document: ${documentId}`);

    // Get parameter definitions from DB
    const paramDefs = await prisma.healthParameter.findMany();
    const paramMap = new Map(paramDefs.map(p => [p.name, p]));

    // Save health measurements
    for (const param of extractedParams) {
      const paramDef = paramMap.get(param.parameterName);
      if (!paramDef) continue;

      await prisma.healthMeasurement.create({
        data: {
          userId,
          parameterId: paramDef.id,
          documentId,
          value: param.value,
          unit: param.unit,
          measuredAt: new Date(), // Use current date; user can correct later
          confidence: param.confidence,
          originalText: param.originalText,
        },
      });
    }

    // Step 4: Categorize document
    const categorization = categorizerService.categorize(ocrResult.text, originalName);
    
    let categoryId: string | null = null;
    if (categorization.categoryName) {
      const category = await prisma.medicalCategory.findUnique({
        where: { name: categorization.categoryName },
      });
      categoryId = category?.id || null;
    }

    // Step 5: Add tags
    for (const tag of categorization.tags) {
      await prisma.documentTag.upsert({
        where: { documentId_tag: { documentId, tag } },
        update: {},
        create: { documentId, tag },
      });
    }

    // Step 6: Update document status
    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        processingStatus: 'COMPLETED',
        categoryId,
        processingError: null,
      },
    });

    console.log(`[Complete] Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`[Error] Processing document ${documentId}:`, error);
    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        processingStatus: 'FAILED',
        processingError: (error as Error).message,
      },
    });
  }
}

export async function getDocumentText(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const document = await prisma.medicalDocument.findUnique({
      where: { id: req.params.id },
      include: { extractedText: true },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    res.json({
      documentId: document.id,
      processingStatus: document.processingStatus,
      extractedText: document.extractedText,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { categoryId } = req.body;

    const document = await prisma.medicalDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify category exists
    if (categoryId) {
      const category = await prisma.medicalCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new ValidationError('Invalid category');
      }
    }

    const updated = await prisma.medicalDocument.update({
      where: { id: document.id },
      data: { categoryId: categoryId || null },
      include: { category: true },
    });

    res.json({ message: 'Category updated', document: updated });
  } catch (error) {
    next(error);
  }
}
