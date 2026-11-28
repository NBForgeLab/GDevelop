let pixelatedImageRenderingValue: string | null = null;
export const getPixelatedImageRendering = (): string => {
  if (pixelatedImageRenderingValue) return pixelatedImageRenderingValue;

  const css = typeof CSS !== 'undefined' ? CSS : globalThis.CSS;
  return (pixelatedImageRenderingValue =
    css && typeof css.supports === 'function'
      ? css.supports('image-rendering: crisp-edges')
        ? 'crisp-edges'
        : 'pixelated'
      : 'pixelated');
};
