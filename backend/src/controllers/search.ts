import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export async function search(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q as string || '').trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    if (!query) {
      return res.json({ results: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const searchTerm = `%${query}%`;

    // Search across documents, extracted text, tags, and categories
    // SQLite uses LIKE for text search
    const documents = await prisma.medicalDocument.findMany({
      where: {
        userId: req.userId,
        OR: [
          { originalName: { contains: query } },
          { extractedText: { text: { contains: query } } },
          { tags: { some: { tag: { contains: query } } } },
          { category: { name: { contains: query } } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        tags: { select: { id: true, tag: true } },
        extractedText: { select: { id: true, confidence: true, text: true } },
        _count: { select: { healthMeasurements: true } },
      },
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.medicalDocument.count({
      where: {
        userId: req.userId,
        OR: [
          { originalName: { contains: query } },
          { extractedText: { text: { contains: query } } },
          { tags: { some: { tag: { contains: query } } } },
          { category: { name: { contains: query } } },
        ],
      },
    });

    // Highlight matching text snippets
    const results = documents.map(doc => {
      let textSnippet: string | null = null;
      if (doc.extractedText?.text) {
        const idx = doc.extractedText.text.toLowerCase().indexOf(query.toLowerCase());
        if (idx >= 0) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(doc.extractedText.text.length, idx + query.length + 50);
          textSnippet = (start > 0 ? '...' : '') + 
            doc.extractedText.text.slice(start, end) + 
            (end < doc.extractedText.text.length ? '...' : '');
        }
      }

      return {
        ...doc,
        extractedText: doc.extractedText ? {
          id: doc.extractedText.id,
          confidence: doc.extractedText.confidence,
          snippet: textSnippet,
        } : null,
      };
    });

    res.json({
      results,
      query,
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
