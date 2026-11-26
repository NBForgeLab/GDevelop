export interface LocaleMetadata {
  languageCode: string;
  languageName: string;
  languageNativeName: string;
  translationRatio: number;
}

declare const localesMetadata: LocaleMetadata[];
export default localesMetadata;
