export interface ExtensionLocaleMetadata {
  languageCode: string;
  languageName: string;
  languageNativeName: string;
  translationRatio: number;
}

declare const extensionLocalesMetadata: ExtensionLocaleMetadata[];
export default extensionLocalesMetadata;
