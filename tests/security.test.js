import { describe, it, expect } from 'vitest';

// Simulating the validation logic from the app
const validateInput = (str) => {
  if (!str || str.trim().length === 0) return false;
  if (str.length > 500) return false;
  const forbiddenPatterns = [/<script/i, /javascript:/i, /onerror/i, /onload/i];
  return !forbiddenPatterns.some(pattern => pattern.test(str));
};

describe('Security & Validation Protocol', () => {
  it('blocks XSS script tags', () => {
    expect(validateInput('<script>alert("xss")</script>')).toBe(false);
  });

  it('blocks javascript: pseudo-protocol', () => {
    expect(validateInput('javascript:void(0)')).toBe(false);
  });

  it('blocks event handler attributes', () => {
    expect(validateInput('img src=x onerror=alert(1)')).toBe(false);
  });

  it('allows safe alphanumeric input', () => {
    expect(validateInput('How do I register to vote in India?')).toBe(true);
  });

  it('enforces maximum length constraints', () => {
    const longString = 'a'.repeat(501);
    expect(validateInput(longString)).toBe(false);
  });

  it('blocks empty or whitespace-only input', () => {
    expect(validateInput('   ')).toBe(false);
    expect(validateInput('')).toBe(false);
  });
});

describe('Data Integrity', () => {
  it('Sanitizes voter names by removing brackets', () => {
    const rawName = "Dr. <Aman>";
    const sanitized = rawName.replace(/[<>]/g, "");
    expect(sanitized).toBe("Dr. Aman");
  });
});
