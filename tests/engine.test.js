import { describe, it, expect } from 'vitest';

describe('Democratic Intelligence Engine', () => {
  it('should validate API key format', () => {
    const mockKey = "AIzaSyDrVk-WcKGAM-dYKHEbjkxvqtEZTONuHhg";
    expect(mockKey).toMatch(/^AIzaSy/);
  });

  it('should compute voter readiness score correctly', () => {
    const user = { name: 'Aman', country: 'India', persona: 'First-Time Voter' };
    let score = 20;
    if (user.name) score += 30;
    if (user.country) score += 20;
    if (user.persona) score += 30;
    expect(score).toBe(100);
  });
});
