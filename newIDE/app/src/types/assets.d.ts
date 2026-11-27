// Ambient declarations for media, stylesheets, and raw text/type asset imports.

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.d.ts?raw' {
  const content: string;
  export default content;
}
