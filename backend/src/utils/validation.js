const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s().-]{6,19}$/;

export function isValidEmail(value) {
  if (!value) return true;
  return EMAIL_RE.test(String(value).trim());
}

export function isValidPhone(value) {
  if (!value) return true;
  const normalized = String(value).trim();
  const digits = normalized.replace(/\D/g, '');
  return PHONE_RE.test(normalized) && digits.length >= 7 && digits.length <= 15;
}

export function requireValidContactFields(fields) {
  for (const [field, value] of Object.entries(fields)) {
    if (field.toLowerCase().includes('email') && !isValidEmail(value)) {
      return `${field} must be a valid email address`;
    }
    if ((field.toLowerCase().includes('phone') || field.toLowerCase().includes('contact')) && !isValidPhone(value)) {
      return `${field} must be a valid phone number`;
    }
  }
  return null;
}
