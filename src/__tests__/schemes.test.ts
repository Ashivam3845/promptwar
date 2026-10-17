import { describe, it, expect } from 'vitest';
import { searchSchemes, VERIFIED_SCHEMES } from '../lib/schemes';

describe('Welfare Schemes Knowledge Base', () => {
  it('contains verified official schemes with essential compliance fields', () => {
    expect(VERIFIED_SCHEMES.length).toBeGreaterThanOrEqual(5);

    for (const scheme of VERIFIED_SCHEMES) {
      expect(scheme.id).toBeDefined();
      expect(scheme.name).toBeDefined();
      expect(scheme.officialSourceUrl).toMatch(/^https?:\/\//);
      expect(scheme.jurisdiction).toBeDefined();
      expect(scheme.eligibilityCriteria.length).toBeGreaterThan(0);
      expect(scheme.verifiedBenefits.length).toBeGreaterThan(0);
      expect(scheme.lastVerifiedDate).toBeDefined();
      expect(scheme.isVerified).toBe(true);
      expect(scheme.summary.en).toBeDefined();
      expect(scheme.summary.hi).toBeDefined();
      expect(scheme.summary.pa).toBeDefined();
    }
  });

  it('filters schemes accurately by query and jurisdiction', () => {
    const eshramResults = searchSchemes('e-Shram');
    expect(eshramResults.some((s) => s.id === 'eshram-portal')).toBe(true);

    const rajasthanResults = searchSchemes(undefined, 'Rajasthan');
    expect(rajasthanResults.some((s) => s.id === 'rajasthan-gig-workers-act')).toBe(true);
  });
});
