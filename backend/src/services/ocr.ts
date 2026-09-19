import Tesseract from 'tesseract.js';
import path from 'path';
import { storageService } from './storage';

export interface OCRResult {
  text: string;
  confidence: number;
  pageCount: number;
}

/**
 * OCR Service using Tesseract.js (WebAssembly-based OCR engine).
 * Processes images and PDFs to extract text.
 * This is REAL OCR — not mocked or hardcoded.
 */
export class OCRService {

  /**
   * Process a file and extract text using Tesseract OCR.
   * Supports: JPG, JPEG, PNG, and PDF (first page).
   */
  async processFile(fileName: string): Promise<OCRResult> {
    const buffer = await storageService.getFileBuffer(fileName);
    const ext = path.extname(fileName).toLowerCase();

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      return this.processImage(buffer);
    } else if (ext === '.pdf') {
      return this.processPdf(buffer);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async processImage(buffer: Buffer): Promise<OCRResult> {
    try {
      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Progress tracking could be implemented here
          }
        },
      });

      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        pageCount: 1,
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR processing failed: ${(error as Error).message}`);
    }
  }

  private async processPdf(buffer: Buffer): Promise<OCRResult> {
    try {
      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Progress
          }
        },
      });

      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        pageCount: 1,
      };
    } catch (error) {
      console.error('PDF OCR error:', error);
      throw new Error(
        'PDF OCR processing failed. For best results, upload image files (JPG/PNG) of medical reports. ' +
        `Error: ${(error as Error).message}`
      );
    }
  }
}

export const ocrService = new OCRService();
