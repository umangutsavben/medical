import { getStorageBucket } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * File storage service - Cloud storage using Firebase Storage.
 */
export class StorageService {
  
  // No longer using local uploadDir in production cloud mode.

  getFilePath(fileName: string): string {
    // In Firebase Storage, this is just the path in the bucket.
    return `uploads/${fileName}`;
  }

  async fileExists(fileName: string): Promise<boolean> {
    const bucket = getStorageBucket();
    const file = bucket.file(this.getFilePath(fileName));
    const [exists] = await file.exists();
    return exists;
  }

  async deleteFile(fileName: string): Promise<void> {
    const bucket = getStorageBucket();
    const file = bucket.file(this.getFilePath(fileName));
    
    try {
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      }
    } catch (error) {
      console.error(`Error deleting file ${fileName} from Firebase Storage:`, error);
    }
  }

  async getFileBuffer(fileName: string): Promise<Buffer> {
    const bucket = getStorageBucket();
    const file = bucket.file(this.getFilePath(fileName));
    
    const [buffer] = await file.download();
    return buffer;
  }

  getFileUrl(fileName: string): string {
    const bucketName = getStorageBucket().name;
    const filePath = encodeURIComponent(this.getFilePath(fileName));
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${filePath}?alt=media`;
  }

  /**
   * Upload a buffer to Firebase Storage and return the unique filename.
   */
  async uploadBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = this.getFilePath(uniqueName);
    
    const bucket = getStorageBucket();
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
      public: true, // Making public for easy access, adjust if you need signed URLs for security
    });

    // Make the file publicly accessible
    await file.makePublic();

    return uniqueName;
  }
}

export const storageService = new StorageService();
