import { getPixelatedImageRendering } from './CssHelpers';

describe('CssHelpers', () => {
  it('returns a valid image rendering CSS value', () => {
    const value = getPixelatedImageRendering();
    expect(['crisp-edges', 'pixelated']).toContain(value);
  });
});
