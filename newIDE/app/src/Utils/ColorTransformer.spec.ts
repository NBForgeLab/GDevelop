import {
  rgbColorToRGBString,
  hexNumberToRGBArray,
  rgbToHex,
  rgbToHexNumber,
  rgbStringToHexNumber,
  rgbStringToHexString,
  rgbOrHexToHexNumber,
  hexNumberToRGBColor,
  hexToRGBColor,
  rgbColorToHex,
  hexNumberToRGBString,
  rgbOrHexToRGBString,
  rgbStringAndAlphaToRGBColor,
  hslToRgb,
  rgbToHsl,
  isLightRgbColor,
  clampRgbComponent,
} from './ColorTransformer';

describe('ColorTransformer', () => {
  describe('rgbColorToRGBString', () => {
    test('converts RGBColor to semicolon-separated string', () => {
      expect(rgbColorToRGBString({ r: 255, g: 128, b: 0 })).toBe('255;128;0');
    });

    test('returns empty string for null or undefined', () => {
      expect(rgbColorToRGBString(null)).toBe('');
      expect(rgbColorToRGBString(undefined)).toBe('');
    });
  });

  describe('hexNumberToRGBArray', () => {
    test('extracts r, g, b from hex number', () => {
      expect(hexNumberToRGBArray(0xff8000)).toEqual([255, 128, 0]);
      expect(hexNumberToRGBArray(0x000000)).toEqual([0, 0, 0]);
      expect(hexNumberToRGBArray(0xffffff)).toEqual([255, 255, 255]);
    });
  });

  describe('rgbToHex and rgbToHexNumber', () => {
    test('converts rgb components to hex string and number', () => {
      expect(rgbToHex(255, 128, 0)).toBe('ff8000');
      expect(rgbToHexNumber(255, 128, 0)).toBe(0xff8000);
      expect(rgbToHex(0, 0, 0)).toBe('000000');
      expect(rgbToHexNumber(0, 0, 0)).toBe(0);
    });
  });

  describe('rgbStringToHexNumber and rgbStringToHexString', () => {
    test('converts rgb strings', () => {
      expect(rgbStringToHexNumber('255;128;0')).toBe(0xff8000);
      expect(rgbStringToHexString('255;128;0')).toBe('#ff8000');
      expect(rgbStringToHexNumber('invalid')).toBe(0);
      expect(rgbStringToHexString('invalid')).toBe('#000000');
    });
  });

  describe('rgbOrHexToHexNumber and rgbOrHexToRGBString', () => {
    test('handles both hex format and rgb format', () => {
      expect(rgbOrHexToHexNumber('255;128;0')).toBe(0xff8000);
      expect(rgbOrHexToHexNumber('#ff8000')).toBe(0xff8000);
      expect(rgbOrHexToHexNumber('ff8000')).toBe(0xff8000);

      expect(rgbOrHexToRGBString('255;128;0')).toBe('255;128;0');
      expect(rgbOrHexToRGBString('#ff8000')).toBe('255;128;0');
    });
  });

  describe('hexNumberToRGBColor and hexToRGBColor', () => {
    test('converts hex to RGBColor object', () => {
      expect(hexNumberToRGBColor(0xff8000)).toEqual({
        r: 255,
        g: 128,
        b: 0,
        a: 255,
      });
      expect(hexToRGBColor('#ff8000')).toEqual({
        r: 255,
        g: 128,
        b: 0,
        a: 255,
      });
    });
  });

  describe('rgbColorToHex and hexNumberToRGBString', () => {
    test('formats correctly with leading zeros', () => {
      expect(rgbColorToHex(0, 5, 10)).toBe('#00050a');
      expect(hexNumberToRGBString(0x00050a)).toBe('0;5;10');
    });
  });

  describe('rgbStringAndAlphaToRGBColor', () => {
    test('parses valid rgb strings with optional alpha', () => {
      expect(rgbStringAndAlphaToRGBColor('255;128;0')).toEqual({
        r: 255,
        g: 128,
        b: 0,
        a: 1,
      });
      expect(rgbStringAndAlphaToRGBColor('255;128;0', 0.5)).toEqual({
        r: 255,
        g: 128,
        b: 0,
        a: 0.5,
      });
      expect(rgbStringAndAlphaToRGBColor('255;128;0', 0)).toEqual({
        r: 255,
        g: 128,
        b: 0,
        a: 0,
      });
      expect(rgbStringAndAlphaToRGBColor('"255;128;0"')).toEqual({
        r: 255,
        g: 128,
        b: 0,
        a: 1,
      });
    });

    test('returns null for invalid inputs', () => {
      expect(rgbStringAndAlphaToRGBColor('1;2')).toBeNull();
      expect(rgbStringAndAlphaToRGBColor('a;b;c')).toBeNull();
      expect(rgbStringAndAlphaToRGBColor('')).toBeNull();
    });
  });

  describe('hslToRgb and rgbToHsl', () => {
    test('converts achromatic colors', () => {
      expect(hslToRgb(0, 0, 0.5)).toEqual([128, 128, 128]);
      expect(rgbToHsl(128, 128, 128)[1]).toBe(0);
    });

    test('converts chromatic colors', () => {
      const [r, g, b] = hslToRgb(0, 1, 0.5); // Pure red
      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);

      const [h, s, l] = rgbToHsl(255, 0, 0);
      expect(h).toBe(0);
      expect(s).toBe(1);
      expect(l).toBe(0.5);
    });
  });

  describe('isLightRgbColor', () => {
    test('detects light and dark colors', () => {
      expect(isLightRgbColor({ r: 255, g: 255, b: 255 })).toBe(true);
      expect(isLightRgbColor({ r: 0, g: 0, b: 0 })).toBe(false);
      expect(isLightRgbColor({ r: 200, g: 200, b: 200 })).toBe(true);
      expect(isLightRgbColor({ r: 50, g: 50, b: 50 })).toBe(false);
    });
  });

  describe('clampRgbComponent', () => {
    test('clamps between 0 and 255', () => {
      expect(clampRgbComponent(-10)).toBe(0);
      expect(clampRgbComponent(128)).toBe(128);
      expect(clampRgbComponent(300)).toBe(255);
    });
  });
});
