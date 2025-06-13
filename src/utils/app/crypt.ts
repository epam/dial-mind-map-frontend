export async function encryptWeb(obj: any, secret: string): Promise<string> {
  const text = typeof obj === 'string' ? obj : JSON.stringify(obj);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const keyData = new TextEncoder().encode(secret);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);

  const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['encrypt']);

  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const encryptedBytes = new Uint8Array(encryptedBuffer);

  const ciphertext = encryptedBytes.slice(0, -16);
  const authTag = encryptedBytes.slice(-16);

  const parts = [
    Buffer.from(iv).toString('hex'),
    Buffer.from(ciphertext).toString('hex'),
    Buffer.from(authTag).toString('hex'),
  ];

  return parts.join(':');
}

export async function decryptWeb(encrypted: string, secret: string): Promise<any | null> {
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      console.warn('Encrypted value must have exactly 3 parts');
      return null;
    }

    const [ivHex, ciphertextHex, authTagHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== 12) {
      console.warn('Invalid IV length:', iv.length);
      return null;
    }

    if (authTag.length !== 16) {
      console.warn('Invalid auth tag length:', authTag.length);
      return null;
    }

    const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
    encryptedData.set(ciphertext, 0);
    encryptedData.set(authTag, ciphertext.length);

    const keyData = new TextEncoder().encode(secret);
    const keyHash = await crypto.subtle.digest('SHA-256', keyData);
    const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['decrypt']);

    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
    const decoded = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decoded);
  } catch (e) {
    console.warn('Web decryption failed:', e);
    return null;
  }
}
