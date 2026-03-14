import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phoneNumber: string | null | undefined, countryCode?: string | null) {
  if (!phoneNumber) return '';
  
  let phone = phoneNumber.trim();
  
  // If it already has a space, assume it's formatted
  if (phone.includes(' ')) return phone;

  // 1. If country code is provided explicitly, use it to split the number correctly
  if (countryCode) {
    const cleanCode = countryCode.replace('+', '').trim();
    const prefix = `+${cleanCode}`;
    
    if (phone.startsWith(prefix)) {
      const rest = phone.slice(prefix.length).trim();
      return `${prefix} ${rest}`;
    }
    
    // Otherwise just prepend it
    return `${prefix} ${phone.startsWith('+') ? phone.slice(1) : phone}`;
  }

  // 2. Fallback for E.164 numbers starting with + (Dynamic splitting)
  if (phone.startsWith('+')) {
    // This regex matches '+' followed by 1-3 digits (common CC length) 
    // and then splits the rest. It's much smarter than hardcoding.
    return phone.replace(/^(\+\d{1,3})(\d+)$/, '$1 $2');
  }

  return phone;
}
