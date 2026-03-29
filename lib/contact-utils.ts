/**
 * Utility functions for contact normalization and E.164 conversion.
 */

/**
 * Normalizes a phone number to E.164 format.
 * Examples: 
 * (123) 456-7890 -> +11234567890 (if US)
 * 0912345678 -> +91912345678 (if India)
 * 
 * For simplicity in this demo, we assume a default country code if missing
 * or just strip non-numeric characters and ensure a + prefix.
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  if (!cleaned) return '';

  // If the original started with +, keep the + but mainly we care about the digits
  if (phone.startsWith('+')) {
    return `+${cleaned}`;
  }

  // Handle leading zero for domestic numbers
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Chunks an array into smaller arrays of a specified size.
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
