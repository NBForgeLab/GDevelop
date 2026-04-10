/*
 * GDevelop JS Platform
 * Copyright 2021-present Aurélien Vivet (bouh.vivez@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */
namespace gdjs {
  const logger = new gdjs.Logger('Bitmap text');

  const defaultBitmapFontKey = 'GDJS-DEFAULT-BITMAP-FONT';
  const resourceKinds: Array<ResourceKind> = ['bitmapFont'];

  type BitmapFontGlyphData = {
    xAdvance: number;
    xOffset: number;
    yOffset: number;
    frame: { x: number; y: number; width: number; height: number };
    kerning: Record<number, number>;
  };

  export type RuntimeBitmapFontData = {
    font: string;
    size: number;
    lineHeight: number;
    chars: Record<string, BitmapFontGlyphData>;
  };

  const createDefaultBitmapFont = (): RuntimeBitmapFontData => ({
    font: defaultBitmapFontKey,
    size: 20,
    lineHeight: 20,
    chars: {},
  });

  const getAttributeValue = (
    attributeBlock: string,
    attributeName: string
  ): string | null => {
    const quotedMatch = attributeBlock.match(
      new RegExp(attributeName + '="([^"]*)"', 'i')
    );
    if (quotedMatch) return quotedMatch[1];

    const unquotedMatch = attributeBlock.match(
      new RegExp(attributeName + '=([^\\s]+)', 'i')
    );
    return unquotedMatch ? unquotedMatch[1] : null;
  };

  const toNumber = (value: string | null, fallback: number = 0): number => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const parsedValue = parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  };

  const parseTextBitmapFont = (
    rawFontData: string,
    fontResourceName: string
  ): RuntimeBitmapFontData => {
    const lines = rawFontData
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => !!line);

    const font = createDefaultBitmapFont();
    font.font = fontResourceName;

    for (const line of lines) {
      if (line.startsWith('info ')) {
        font.font = getAttributeValue(line, 'face') || font.font;
        font.size = toNumber(getAttributeValue(line, 'size'), font.size);
      } else if (line.startsWith('common ')) {
        font.lineHeight = toNumber(
          getAttributeValue(line, 'lineHeight'),
          font.lineHeight
        );
      } else if (line.startsWith('char ')) {
        const id = toNumber(getAttributeValue(line, 'id'));
        if (!id) continue;

        font.chars[String(id)] = {
          xAdvance: toNumber(getAttributeValue(line, 'xadvance')),
          xOffset: toNumber(getAttributeValue(line, 'xoffset')),
          yOffset: toNumber(getAttributeValue(line, 'yoffset')),
          frame: {
            x: toNumber(getAttributeValue(line, 'x')),
            y: toNumber(getAttributeValue(line, 'y')),
            width: toNumber(getAttributeValue(line, 'width')),
            height: toNumber(getAttributeValue(line, 'height')),
          },
          kerning: {},
        };
      } else if (line.startsWith('kerning ')) {
        const first = toNumber(getAttributeValue(line, 'first'));
        const second = toNumber(getAttributeValue(line, 'second'));
        const amount = toNumber(getAttributeValue(line, 'amount'));
        const glyph = font.chars[String(second)];
        if (glyph && first) {
          glyph.kerning[first] = amount;
        }
      }
    }

    return font;
  };

  const parseXmlBitmapFont = (
    rawFontData: string,
    fontResourceName: string
  ): RuntimeBitmapFontData => {
    const xml = new DOMParser().parseFromString(rawFontData, 'text/xml');
    const font = createDefaultBitmapFont();
    font.font = fontResourceName;

    const infoNode = xml.querySelector('font > info');
    if (infoNode) {
      font.font = infoNode.getAttribute('face') || font.font;
      font.size = toNumber(infoNode.getAttribute('size'), font.size);
    }

    const commonNode = xml.querySelector('font > common');
    if (commonNode) {
      font.lineHeight = toNumber(
        commonNode.getAttribute('lineHeight'),
        font.lineHeight
      );
    }

    const charNodes = xml.querySelectorAll('font > chars > char');
    charNodes.forEach((charNode) => {
      const id = toNumber(charNode.getAttribute('id'));
      if (!id) return;

      font.chars[String(id)] = {
        xAdvance: toNumber(charNode.getAttribute('xadvance')),
        xOffset: toNumber(charNode.getAttribute('xoffset')),
        yOffset: toNumber(charNode.getAttribute('yoffset')),
        frame: {
          x: toNumber(charNode.getAttribute('x')),
          y: toNumber(charNode.getAttribute('y')),
          width: toNumber(charNode.getAttribute('width')),
          height: toNumber(charNode.getAttribute('height')),
        },
        kerning: {},
      };
    });

    const kerningNodes = xml.querySelectorAll('font > kernings > kerning');
    kerningNodes.forEach((kerningNode) => {
      const first = toNumber(kerningNode.getAttribute('first'));
      const second = toNumber(kerningNode.getAttribute('second'));
      const amount = toNumber(kerningNode.getAttribute('amount'));
      const glyph = font.chars[String(second)];
      if (glyph && first) {
        glyph.kerning[first] = amount;
      }
    });

    return font;
  };

  const parseBitmapFont = (
    rawFontData: string,
    fontResourceName: string
  ): RuntimeBitmapFontData => {
    const trimmedFontData = rawFontData.trimStart();
    if (trimmedFontData.startsWith('<')) {
      return parseXmlBitmapFont(trimmedFontData, fontResourceName);
    }

    return parseTextBitmapFont(trimmedFontData, fontResourceName);
  };

  export class BitmapFontManagerImpl implements gdjs.ResourceManager {
    private _bitmapFontsInUse: Record<string, { objectsUsingTheFont: number }> =
      {};
    private _loadedFontsData =
      new gdjs.ResourceCache<RuntimeBitmapFontData>();
    private _defaultBitmapFont = createDefaultBitmapFont();

    _resourceLoader: gdjs.ResourceLoader;

    constructor(
      resourceLoader: gdjs.ResourceLoader,
      _imageManager: gdjs.ImageManager
    ) {
      this._resourceLoader = resourceLoader;
    }

    getResourceKinds(): ResourceKind[] {
      return resourceKinds;
    }

    getDefaultBitmapFont(): RuntimeBitmapFontData {
      return this._defaultBitmapFont;
    }

    private _markBitmapFontAsUsed(bitmapFontInstallKey: string): void {
      this._bitmapFontsInUse[bitmapFontInstallKey] =
        this._bitmapFontsInUse[bitmapFontInstallKey] || {
          objectsUsingTheFont: 0,
        };
      this._bitmapFontsInUse[bitmapFontInstallKey].objectsUsingTheFont++;
    }

    releaseBitmapFont(bitmapFontInstallKey: string): void {
      if (bitmapFontInstallKey === defaultBitmapFontKey) {
        return;
      }

      const bitmapFontInUse = this._bitmapFontsInUse[bitmapFontInstallKey];
      if (!bitmapFontInUse) {
        return;
      }

      bitmapFontInUse.objectsUsingTheFont--;
      if (bitmapFontInUse.objectsUsingTheFont <= 0) {
        delete this._bitmapFontsInUse[bitmapFontInstallKey];
      }
    }

    obtainBitmapFont(
      bitmapFontResourceName: string,
      textureAtlasResourceName: string
    ): RuntimeBitmapFontData {
      const bitmapFontInstallKey =
        bitmapFontResourceName + '@' + textureAtlasResourceName;
      const bitmapFont = this._loadedFontsData.getFromName(bitmapFontResourceName);
      if (!bitmapFont) {
        logger.warn(
          'Could not find Bitmap Font for resource named "' +
            bitmapFontResourceName +
            '". The default font will be used.'
        );
        return this.getDefaultBitmapFont();
      }

      this._markBitmapFontAsUsed(bitmapFontInstallKey);
      return {
        ...bitmapFont,
        chars: { ...bitmapFont.chars },
        font: bitmapFontInstallKey,
      };
    }

    async processResource(resourceName: string): Promise<void> {}

    async loadResource(resourceName: string): Promise<void> {
      const resource = this._resourceLoader.getResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find bitmap font for resource "' + resourceName + '".'
        );
        return;
      }
      if (this._loadedFontsData.get(resource)) {
        return;
      }

      try {
        const response = await fetch(this._resourceLoader.getFullUrl(resource.file), {
          credentials: this._resourceLoader.checkIfCredentialsRequired(
            resource.file
          )
            ? 'include'
            : 'same-origin',
        });
        if (!response.ok) {
          throw new Error(
            `HTTP error while loading bitmap font. Status is ${response.status}.`
          );
        }

        const fontDataRaw = await response.text();
        const sanitizedFontData = fontDataRaw
          .split('\n')
          .filter((line) => !line.trim().startsWith('#'))
          .join('\n');

        this._loadedFontsData.set(
          resource,
          parseBitmapFont(sanitizedFontData, resourceName)
        );
      } catch (error) {
        logger.error(
          "Can't fetch the bitmap font file " +
            resource.file +
            ', error: ' +
            error
        );
        this._loadedFontsData.delete(resource);
        throw error;
      }
    }

    dispose(): void {
      this._bitmapFontsInUse = {};
      this._loadedFontsData.clear();
    }

    unloadResource(resourceData: ResourceData): void {
      this._loadedFontsData.delete(resourceData);

      for (const bitmapFontInstallKey of Object.keys(this._bitmapFontsInUse)) {
        if (bitmapFontInstallKey.startsWith(resourceData.name + '@')) {
          delete this._bitmapFontsInUse[bitmapFontInstallKey];
        }
      }
    }
  }

  export const BitmapFontManager = gdjs.BitmapFontManagerImpl;
  export type BitmapFontManager = gdjs.BitmapFontManagerImpl;
}
