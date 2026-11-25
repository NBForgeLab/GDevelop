export type FileSet =
  | 'preview'
  | 'cordova'
  | 'electron'
  | 'web'
  | 'cocos2d-js'
  | 'facebook-instant-games';

export type TextFileDescriptor = {
  text: string;
  filePath: string;
};

export declare const findGDJS: (fileSet: FileSet) => Promise<{
  gdjsRoot: string;
  filesContent: Array<TextFileDescriptor>;
}>;
