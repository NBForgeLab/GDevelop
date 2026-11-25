import { mapVector } from '../Utils/MapFor';
import { type ObjectFolderOrObjectWithContext } from '../ObjectsList/EnumerateObjectFolderOrObject';
import { exceptionallyGuardAgainstDeadObject } from '../Utils/IsNullPtr';
const gd: libGDevelop = (global as any).gd;

export const cleanNonExistingObjectFolderOrObjectWithContexts = (
  globalObjectsContainer: gdObjectsContainer | null | undefined,
  objectsContainer: gdObjectsContainer | null | undefined,
  objectFolderOrObjectWithContexts: Array<ObjectFolderOrObjectWithContext>
): Array<ObjectFolderOrObjectWithContext> => {
  const allObjectFolderOrObjectPtrs = new Set<number>();
  if (objectsContainer)
    mapVector(
      objectsContainer.getAllObjectFolderOrObjects(),
      (objectFolderOrObject) => {
        allObjectFolderOrObjectPtrs.add(gd.getPointer(objectFolderOrObject));
      }
    );
  if (globalObjectsContainer)
    mapVector(
      globalObjectsContainer.getAllObjectFolderOrObjects(),
      (objectFolderOrObject) => {
        allObjectFolderOrObjectPtrs.add(gd.getPointer(objectFolderOrObject));
      }
    );

  return objectFolderOrObjectWithContexts
    .filter((objectFolderOrObjectWithContext) =>
      allObjectFolderOrObjectPtrs.has(
        gd.getPointer(objectFolderOrObjectWithContext.objectFolderOrObject)
      )
    )
    .filter((objectFolderOrObjectWithContext) => {
      // In theory at this point all the objectFolderOrObject should be valid,
      // but to be safe we explicitly check if they are dead.
      return !!exceptionallyGuardAgainstDeadObject(
        objectFolderOrObjectWithContext.objectFolderOrObject
      );
    });
};

export const getObjectFolderOrObjectWithContextFromObjectName = (
  globalObjectsContainer: gdObjectsContainer | null | undefined,
  objectsContainer: gdObjectsContainer,
  objectName: string
): ObjectFolderOrObjectWithContext | null => {
  let foundObjectFolderObjectWithContext: ObjectFolderOrObjectWithContext | null =
    null;
  if (globalObjectsContainer)
    mapVector(
      globalObjectsContainer.getAllObjectFolderOrObjects(),
      (objectFolderOrObject) => {
        if (
          !objectFolderOrObject.isFolder() &&
          objectFolderOrObject.getObject().getName() === objectName
        ) {
          foundObjectFolderObjectWithContext = {
            objectFolderOrObject,
            global: true,
          };
        }
      }
    );
  if (objectsContainer)
    mapVector(
      objectsContainer.getAllObjectFolderOrObjects(),
      (objectFolderOrObject) => {
        if (
          !objectFolderOrObject.isFolder() &&
          objectFolderOrObject.getObject().getName() === objectName
        ) {
          foundObjectFolderObjectWithContext = {
            objectFolderOrObject,
            global: false,
          };
        }
      }
    );

  return foundObjectFolderObjectWithContext;
};
