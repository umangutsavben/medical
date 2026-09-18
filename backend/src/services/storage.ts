import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

/**
 * File storage service - abstraction layer over local/cloud storage.
 * Currently implements local file storage.
 * Can be swapped to Supabase/S3 by changing the implementation.
 */
export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(config.uploadDir);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }

  async fileExists(fileName: string): Promise<boolean> {
    const filePath = this.getFilePath(fileName);
    return fs.existsSync(filePath);
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getFileBuffer(fileName: string): Promise<Buffer> {
    const filePath = this.getFilePath(fileName);
    return fs.readFileSync(filePath);
  }

  getFileUrl(fileName: string): string {
    // In production, this would return a cloud storage URL
    return `/uploads/${fileName}`;
  }
}

export const storageService = new StorageService();
