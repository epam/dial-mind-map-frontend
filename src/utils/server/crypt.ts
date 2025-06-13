import crypto from 'crypto';

import { logger } from './logger';

const algorithm = 'aes-256-gcm';
const ivLength = 12; // 96-bit for AES-GCM

export function encryptNode(obj: any, secret: string): string {
  const text = typeof obj === 'string' ? obj : JSON.stringify(obj);
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), encrypted.toString('hex'), authTag.toString('hex')].join(':');
}

export function decryptNode(encrypted: string, secret: string): string | null {
  try {
    const [ivHex, dataHex, tagHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const key = crypto.createHash('sha256').update(secret).digest();
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    logger.warn('Node decryption failed:', err);
    return null;
  }
}
