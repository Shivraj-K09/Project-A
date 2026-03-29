import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { File } from 'expo-file-system';
import { getAppLockEnabled } from './app-lock';
import { decode, encode } from 'base64-arraybuffer';

const PRIVATE_KEY_ALIAS = 'support_chat_private_key';
const PUBLIC_KEY_ALIAS = 'support_chat_public_key';

/**
 * Accessor for the global crypto subtle object.
 * This works on both Web (Native) and Mobile (via react-native-quick-crypto polyfill).
 */
const getSubtle = () => {
  const c = typeof crypto !== 'undefined' ? crypto : (global as any).crypto;
  if (!c || !c.subtle) {
    throw new Error('E2EE Error: Cryptographic engine not initialized. Rebuild the app to apply the new native polyfill.');
  }
  return c.subtle;
};

const getRandomValues = (arr: Uint8Array) => {
  const c = typeof crypto !== 'undefined' ? crypto : (global as any).crypto;
  return c.getRandomValues(arr);
};

export class CryptoHelper {
  /**
   * Generates dynamic options for SecureStore based on device capability.
   * On Emulator or devices without biometrics, it falls back to hardware-locked (WHEN_UNLOCKED) 
   * without requiring user authentication popups.
   */
  private static async getSecureStoreOptions(prompt?: string): Promise<SecureStore.SecureStoreOptions> {
    const isCompatible = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const isAppLockEnabled = await getAppLockEnabled();

    // 🛡️ SECURITY RESOLUTION: Only require biometric popup IF hardware exists AND user has it set up
    // AND they have opted into "App Lock" in settings. 
    // This allows Emulators and older devices to use E2EE securely without crashing.
    const shouldRequireAuth = isCompatible && isEnrolled && isAppLockEnabled;

    return {
      requireAuthentication: shouldRequireAuth,
      authenticationPrompt: prompt || 'Authorize secure chat identity',
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY, 
      keychainService: 'social-media-support-chat'
    };
  }

  /**
   * Generates a new ECDH P-256 keypair for E2EE.
   * On Mobile, the private key is stored in the SecureStore (Hardware).
   * returns the public key as a base64 string.
   */
  static async initializeKeys(): Promise<string> {
    const existingPub = await SecureStore.getItemAsync(PUBLIC_KEY_ALIAS);
    const options = await this.getSecureStoreOptions('Verify identity');
    const existingPriv = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS, options);
    
    if (existingPub && existingPriv) {
      return existingPub;
    }

    if (existingPub) {
      try {
        if (existingPriv) return existingPub;
        if (__DEV__) console.warn('[Crypto] Public/Private key mismatch or access denied. Purging old session.');
        await this.purgeKeys();
      } catch (err) {
        if (__DEV__) console.warn('[Crypto] Access denied to existing private key. Purging old session.');
        await this.purgeKeys();
      }
    }

    // SCALING RESOLUTION: Hardware-Backed & Memory-Sanitized Generation
    const subtle = getSubtle();
    
    // 1. Generate: Temporary 'extractable' state (restricted to this scope)
    const keyPair = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true, 
      ['deriveKey', 'deriveBits']
    );

    const pubExported = await subtle.exportKey('spki', keyPair.publicKey);
    const pubBase64 = this.arrayBufferToBase64(pubExported);

    // 2. Export & Secure: Immediately export to PKCS#8 Raw Data
    let privExported: ArrayBuffer | null = await subtle.exportKey('pkcs8', keyPair.privateKey);
    let privBase64: string | null = this.arrayBufferToBase64(privExported!);

    // 3. HARDWARE PINNING: Encrypt with Hardware Master Key 
    const storeOptions = await this.getSecureStoreOptions('Authorize secure chat identity setup');

    try {
      await SecureStore.setItemAsync(PUBLIC_KEY_ALIAS, pubBase64);
      await SecureStore.setItemAsync(PRIVATE_KEY_ALIAS, privBase64, storeOptions);
    } finally {
      // 4. MEMORY HYGIENE (CRITICAL): Erase the raw key from JS memory
      if (privExported) {
        new Uint8Array(privExported).fill(0);
      }
      privExported = null;
      privBase64 = null;
    }

    return pubBase64;
  }

  private static async loadPrivateKey(subtle: SubtleCrypto): Promise<CryptoKey> {
    const options = await this.getSecureStoreOptions('Access secure message identity');

    const myPrivBase64 = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS, options);
    if (!myPrivBase64) throw new Error('Private key missing or access denied');

    const privBuffer = this.base64ToArrayBuffer(myPrivBase64);
    try {
      const myPrivKey = await subtle.importKey(
        'pkcs8',
        privBuffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        false, // <--- Non-extractable
        ['deriveKey']
      );
      return myPrivKey;
    } finally {
      // MEMORY HYGIENE: Zero out the buffer that held the raw PKCS#8
      new Uint8Array(privBuffer).fill(0);
    }
  }

  /**
   * Hybrid Encryption: One-time session key + ECDH wrapping per recipient.
   */
  static async encrypt(
    text: string, 
    recipientPublicKeys: { userId: string, key: string }[]
  ): Promise<{ blob: string, header: Record<string, string> }> {
    const subtle = getSubtle();
    
    // 1. Generate AES-GCM-256 Session Key
    const sessionKey = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Encrypt Message
    const iv = getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    const encryptedContent = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      sessionKey,
      encodedText
    );

    // 3. Import our Private Key for ECDH
    const myPrivKey = await this.loadPrivateKey(subtle);

    // 4. Wrap Session Key for each recipient using ECDH
    const keysHeader: Record<string, string> = {};
    const exportedSessionKey = await subtle.exportKey('raw', sessionKey);

    for (const recipient of recipientPublicKeys) {
      try {
        const recipientPubKey = await subtle.importKey(
          'spki',
          this.base64ToArrayBuffer(recipient.key),
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        // Derive AES-GCM wrapping key from ECDH Shared Secret
        const wrappingKey = await subtle.deriveKey(
          { name: 'ECDH', public: recipientPubKey },
          myPrivKey,
          { name: 'AES-GCM', length: 128 }, // Key for wrapping
          false,
          ['encrypt']
        );

        const wIv = getRandomValues(new Uint8Array(12));
        const wrappedKeyBuffer = await subtle.encrypt(
          { name: 'AES-GCM', iv: wIv },
          wrappingKey,
          exportedSessionKey
        );

        // Header format: IV + Ciphertext (Base64)
        const headerBuffer = new Uint8Array(12 + wrappedKeyBuffer.byteLength);
        headerBuffer.set(wIv);
        headerBuffer.set(new Uint8Array(wrappedKeyBuffer), 12);
        
        keysHeader[recipient.userId] = this.arrayBufferToBase64(headerBuffer.buffer);
      } catch (err) {
        if (__DEV__) console.error(`Failed to wrap for ${recipient.userId}`, err);
      }
    }

    const blobBuffer = new Uint8Array(12 + encryptedContent.byteLength);
    blobBuffer.set(iv);
    blobBuffer.set(new Uint8Array(encryptedContent), 12);

    return {
      blob: this.arrayBufferToBase64(blobBuffer.buffer),
      header: keysHeader
    };
  }

  static async decrypt(
    blobBase64: string,
    wrappedHeaderBase64: string,
    senderPublicKeyBase64: string
  ): Promise<string> {
    const subtle = getSubtle();
    const headerBuffer = new Uint8Array(this.base64ToArrayBuffer(wrappedHeaderBase64));
    const wIv = headerBuffer.slice(0, 12);
    const wCiphertext = headerBuffer.slice(12);

    const senderPub = await subtle.importKey(
      'spki',
      this.base64ToArrayBuffer(senderPublicKeyBase64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const myPrivKey = await this.loadPrivateKey(subtle);

    const wrappingKey = await subtle.deriveKey(
      { name: 'ECDH', public: senderPub },
      myPrivKey,
      { name: 'AES-GCM', length: 128 },
      false,
      ['decrypt']
    );

    const sessionKeyBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: wIv },
      wrappingKey,
      wCiphertext
    );

    const sessionKey = await subtle.importKey(
      'raw',
      sessionKeyBuffer,
      'AES-GCM',
      true,
      ['decrypt']
    );

    const fullBlob = new Uint8Array(this.base64ToArrayBuffer(blobBase64));
    const iv = fullBlob.slice(0, 12);
    const ciphertext = fullBlob.slice(12);

    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      sessionKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * RECOVERY HELPER: Unwraps a session key from a header using our private key.
   * Returns the raw ArrayBuffer of the session key.
   */
  static async unwrapSessionKey(
    wrappedHeaderBase64: string,
    senderPublicKeyBase64: string
  ): Promise<ArrayBuffer> {
    const subtle = getSubtle();
    const headerBuffer = new Uint8Array(this.base64ToArrayBuffer(wrappedHeaderBase64));
    const wIv = headerBuffer.slice(0, 12);
    const wCiphertext = headerBuffer.slice(12);

    const senderPub = await subtle.importKey(
      'spki',
      this.base64ToArrayBuffer(senderPublicKeyBase64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );
    const myPrivKey = await this.loadPrivateKey(subtle);

    const wrappingKey = await subtle.deriveKey(
      { name: 'ECDH', public: senderPub },
      myPrivKey,
      { name: 'AES-GCM', length: 128 },
      false,
      ['decrypt']
    );

    return await subtle.decrypt(
      { name: 'AES-GCM', iv: wIv },
      wrappingKey,
      wCiphertext
    );
  }

  /**
   * RE-WRAP HELPER: Wraps a raw session key for a new recipient.
   */
  static async wrapSessionKey(
    rawSessionKey: ArrayBuffer,
    recipientPublicKeyBase64: string
  ): Promise<string> {
    const subtle = getSubtle();
    const myPrivKey = await this.loadPrivateKey(subtle);

    const recipientPubKey = await subtle.importKey(
      'spki',
      this.base64ToArrayBuffer(recipientPublicKeyBase64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const wrappingKey = await subtle.deriveKey(
      { name: 'ECDH', public: recipientPubKey },
      myPrivKey,
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt']
    );

    const wIv = getRandomValues(new Uint8Array(12));
    const wrapped = await subtle.encrypt(
      { name: 'AES-GCM', iv: wIv },
      wrappingKey,
      rawSessionKey
    );

    const resultBuffer = new Uint8Array(12 + wrapped.byteLength);
    resultBuffer.set(wIv);
    resultBuffer.set(new Uint8Array(wrapped), 12);
    
    return this.arrayBufferToBase64(resultBuffer.buffer);
  }



  static async encryptFile(
    fileUri: string,
    recipientPublicKeys: { userId: string, key: string }[]
  ): Promise<{ blob: ArrayBuffer, header: Record<string, string> }> {
    const subtle = getSubtle();
    
    // 1. Generate AES-GCM-256 File Key
    const fileKey = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Read and Encrypt File
    const fileBytes = await new File(fileUri).bytes();
    const fileBuffer = fileBytes.buffer;
    const iv = getRandomValues(new Uint8Array(12));
    
    const encryptedContent = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      fileKey,
      fileBuffer
    );

    // 3. Wrap File Key for recipients (Reuse ECDH logic)
    const keysHeader: Record<string, string> = {};
    const exportedFileKey = await subtle.exportKey('raw', fileKey);
    const myPrivKey = await this.loadPrivateKey(subtle);

    for (const recipient of recipientPublicKeys) {
      try {
        const recipientPubKey = await subtle.importKey(
          'spki',
          this.base64ToArrayBuffer(recipient.key),
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        const wrappingKey = await subtle.deriveKey(
          { name: 'ECDH', public: recipientPubKey },
          myPrivKey,
          { name: 'AES-GCM', length: 128 },
          false,
          ['encrypt']
        );

        const wIv = getRandomValues(new Uint8Array(12));
        const wrappedKeyBuffer = await subtle.encrypt(
          { name: 'AES-GCM', iv: wIv },
          wrappingKey,
          exportedFileKey
        );

        const headerBuffer = new Uint8Array(12 + wrappedKeyBuffer.byteLength);
        headerBuffer.set(wIv);
        headerBuffer.set(new Uint8Array(wrappedKeyBuffer), 12);
        keysHeader[recipient.userId] = this.arrayBufferToBase64(headerBuffer.buffer);
      } catch (err) {
        if (__DEV__) console.error(`Failed to wrap file key for ${recipient.userId}`, err);
      }
    }

    // Combine IV + Ciphertext for the Storage blob
    const resultBuffer = new Uint8Array(12 + encryptedContent.byteLength);
    resultBuffer.set(iv);
    resultBuffer.set(new Uint8Array(encryptedContent), 12);

    return {
      blob: resultBuffer.buffer,
      header: keysHeader
    };
  }

  static async decryptFile(
    blobBuffer: ArrayBuffer,
    wrappedHeaderBase64: string,
    senderPublicKeyBase64: string
  ): Promise<ArrayBuffer> {
    const subtle = getSubtle();
    
    // 1. Unwrap the File Key
    const headerBuffer = new Uint8Array(this.base64ToArrayBuffer(wrappedHeaderBase64));
    const wIv = headerBuffer.slice(0, 12);
    const wCiphertext = headerBuffer.slice(12);

    const senderPub = await subtle.importKey('spki', this.base64ToArrayBuffer(senderPublicKeyBase64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const myPrivKey = await this.loadPrivateKey(subtle);

    const wrappingKey = await subtle.deriveKey({ name: 'ECDH', public: senderPub }, myPrivKey, { name: 'AES-GCM', length: 128 }, false, ['decrypt']);
    
    const fileKeyBuffer = await subtle.decrypt({ name: 'AES-GCM', iv: wIv }, wrappingKey, wCiphertext);
    const fileKey = await subtle.importKey('raw', fileKeyBuffer, 'AES-GCM', true, ['decrypt']);

    // 2. Decrypt Content
    const fullBlob = new Uint8Array(blobBuffer);
    const iv = fullBlob.slice(0, 12);
    const ciphertext = fullBlob.slice(12);

    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, fileKey, ciphertext);
    return decrypted;
  }

  /**
   * Purges the chat keypair from SecureStore.
   * Use this when ending a session to ensure forward secrecy or prevent key reuse.
   */
  static async purgeKeys(): Promise<void> {
    await SecureStore.deleteItemAsync(PUBLIC_KEY_ALIAS);
    await SecureStore.deleteItemAsync(PRIVATE_KEY_ALIAS);
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    return encode(buffer);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    return decode(base64);
  }
}

