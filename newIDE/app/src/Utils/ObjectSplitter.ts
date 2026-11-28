// TODO: This module could be published on npm if useful.
import newNameGenerator from './NewNameGenerator';
import slugs from 'slugs';

export interface PartialObjectDescription {
  reference: string;
  object: Record<string, unknown>;
}

export interface Reference {
  referenceTo: string;
  [key: string]: unknown;
}

export interface SplitConfiguration {
  pathSeparator: string;
  getArrayItemReferenceName: (
    object: Record<string, unknown>,
    currentReference: string
  ) => string;
  shouldSplit: (path: string) => boolean;
  isReferenceMagicPropertyName: string;
}

export interface UnsplitConfiguration {
  isReferenceMagicPropertyName: string;
  getReferencePartialObject: (
    referencePath: string
  ) => Promise<Record<string, unknown> | null | undefined>;
  maxUnsplitDepth?: number;
}

/**
 * Mutate the given object to split it into multiple partial objects.
 * Partial objects will be replaced by references.
 *
 * @param object The object to be split.
 * @param configuration Configuration to be used to split the object.
 */
export const split = (
  object: Record<string, unknown>,
  {
    pathSeparator,
    getArrayItemReferenceName,
    shouldSplit,
    isReferenceMagicPropertyName,
  }: SplitConfiguration
): Array<PartialObjectDescription> => {
  const partialObjects: Array<PartialObjectDescription> = [];
  const createReference = (
    reference: string,
    object: Record<string, unknown>
  ): Reference => {
    partialObjects.push({
      reference,
      object,
    });

    return {
      [isReferenceMagicPropertyName]: true,
      referenceTo: reference,
    };
  };

  const splitObject = (
    currentObject: any,
    currentPath: string,
    currentReference: string
  ) => {
    if (currentObject !== null && typeof currentObject === 'object') {
      if (Array.isArray(currentObject)) {
        for (const index in currentObject) {
          const itemPath = currentPath + pathSeparator + '*';
          if (shouldSplit(itemPath)) {
            const partialObject = currentObject[index];
            const name = getArrayItemReferenceName(
              partialObject,
              currentReference
            );
            const itemReference = currentReference + pathSeparator + name;

            currentObject[index] = createReference(
              itemReference,
              partialObject
            );

            splitObject(partialObject, itemPath, itemReference);
          } else {
            const itemReference = currentReference + pathSeparator + index;

            splitObject(currentObject[index], itemPath, itemReference);
          }
        }
      } else {
        for (const propertyName in currentObject) {
          const propertyPath = currentPath + pathSeparator + propertyName;
          const propertyReference =
            currentReference + pathSeparator + propertyName;
          if (shouldSplit(propertyPath)) {
            const partialObject = currentObject[propertyName];

            currentObject[propertyName] = createReference(
              propertyReference,
              partialObject
            );

            splitObject(partialObject, propertyPath, propertyReference);
          } else {
            splitObject(
              currentObject[propertyName],
              propertyPath,
              propertyReference
            );
          }
        }
      }
    }
  };

  splitObject(object, '', '');
  return partialObjects;
};

/**
 * Mutate the given object to recompose it from partial objects.
 * References to partial objects will be fetched as needed.
 *
 * @param object The object to be unsplit.
 * @param configuration Configuration to be used to unsplit the object.
 */
export const unsplit = (
  object: Record<string, unknown>,
  {
    isReferenceMagicPropertyName,
    getReferencePartialObject,
    maxUnsplitDepth,
  }: UnsplitConfiguration
): Promise<void> => {
  const isReference = (obj: any): Reference | null => {
    if (obj && obj[isReferenceMagicPropertyName] === true) {
      return obj;
    }

    return null;
  };

  const unsplitObject = (currentObject: any, depth: number): Promise<void> => {
    if (maxUnsplitDepth !== undefined && depth >= maxUnsplitDepth) {
      return Promise.resolve();
    }

    if (currentObject !== null && typeof currentObject === 'object') {
      const keys = Object.keys(currentObject);
      if (keys) {
        return Promise.all(
          keys.map((indexOrPropertyName) => {
            const reference = isReference(currentObject[indexOrPropertyName]);
            if (reference) {
              return getReferencePartialObject(reference.referenceTo).then(
                (partialObject) => {
                  currentObject[indexOrPropertyName] = partialObject;

                  return unsplitObject(
                    currentObject[indexOrPropertyName],
                    depth + 1
                  );
                }
              );
            }

            return unsplitObject(currentObject[indexOrPropertyName], depth + 1);
          })
        ).then(() => {});
      }
    }

    return Promise.resolve();
  };

  return unsplitObject(object, 0);
};

/**
 * A helper that can be used to split according to a list of hardcoded paths
 */
export const splitPaths = (paths: Set<string>): ((path: string) => boolean) => {
  return (path: string) => paths.has(path);
};

/**
 * A helper that can be used to get the name of items in array using an hardcoded property name.
 */
export const getNameFromProperty = (
  propertyName: string
): ((object: Record<string, unknown>) => string) => {
  return (object: Record<string, unknown>): string => {
    const property = object[propertyName];
    if (typeof property !== 'string') {
      throw new Error(`Property ${propertyName} is not a string`);
    }

    return property;
  };
};

/**
 * A helper that can be used to get the name of items in array using an hardcoded property name.
 */
export const getSlugifiedUniqueNameFromProperty = (
  propertyName: string
): ((object: Record<string, unknown>, currentReference: string) => string) => {
  const existingNamesForReference: Record<string, Record<string, boolean>> = {};

  return (
    object: Record<string, unknown>,
    currentReference: string
  ): string => {
    const property = object[propertyName];
    if (typeof property !== 'string') {
      throw new Error(`Property ${propertyName} is not a string`);
    }

    existingNamesForReference[currentReference] =
      existingNamesForReference[currentReference] || {};
    const newName = newNameGenerator(
      slugs(property),
      (name) => !!existingNamesForReference[currentReference][name]
    );
    existingNamesForReference[currentReference][newName] = true;
    return newName;
  };
};
