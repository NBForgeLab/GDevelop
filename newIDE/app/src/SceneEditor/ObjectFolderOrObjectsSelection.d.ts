type ObjectFolderOrObjectWithContext = {
  objectFolderOrObject: gdObjectFolderOrObject;
  global: boolean;
};

export declare const cleanNonExistingObjectFolderOrObjectWithContexts: (
  globalObjectsContainer: gdObjectsContainer | null | undefined,
  objectsContainer: gdObjectsContainer | null | undefined,
  objectFolderOrObjectWithContexts: Array<ObjectFolderOrObjectWithContext>
) => Array<ObjectFolderOrObjectWithContext>;

export declare const getObjectFolderOrObjectWithContextFromObjectName: (
  globalObjectsContainer: gdObjectsContainer | null | undefined,
  objectsContainer: gdObjectsContainer,
  objectName: string
) => ObjectFolderOrObjectWithContext | null;
