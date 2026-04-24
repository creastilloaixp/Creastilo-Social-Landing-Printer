import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWebsite, generateBrandCard } from '../nano-banana-projects/brand-analyzer.mjs';

describe('brand-analyzer', () => {
  describe('fetchWebsite', () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should successfully fetch and trim website content', async () => {
      const mockHtml = '<html><body>Test Content</body></html>';
      global.fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockHtml)
      });

      const result = await fetchWebsite('https://example.com');
      
      expect(global.fetch).toHaveBeenCalledWith('https://example.com', expect.any(Object));
      expect(result).toBe(mockHtml);
    });

    it('should throw an error if fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(fetchWebsite('https://example.com')).rejects.toThrow('Network error');
    });
  });

  describe('generateBrandCard', () => {
    it('should generate HTML containing the brand name', () => {
      const mockBrand = {
        companyName: 'TestBrand',
        industry: 'Tech',
        colors: {
            primary: '#000',
            secondary: '#111',
            accent: '#222',
            accentWarm: '#333',
            background: '#fff',
            text: '#000'
        },
        colorTheory: [],
        typography: { headingFont: 'Inter', bodyFont: 'Roboto' },
        services: [],
        pricing: [],
        suggestedHeroScenes: [],
        meta: { tone: 'Professional', dna: 'Innovation' }
      };

      const html = generateBrandCard(mockBrand);
      expect(html).toContain('TestBrand');
      expect(html).toContain('Tech');
    });
  });
});
