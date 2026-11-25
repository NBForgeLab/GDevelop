export declare const enumerateLayouts: (project: gdProject) => Array<gdLayout>;
export declare const enumerateExternalEvents: (
  project: gdProject
) => Array<gdExternalEvents>;
export declare const enumerateExternalLayouts: (
  project: gdProject
) => Array<gdExternalLayout>;
export declare const enumerateEventsFunctionsExtensions: (
  project: gdProject
) => Array<gdEventsFunctionsExtension>;
export declare const enumerateGameplayTests: (
  project: gdProject
) => Array<gdTest>;
export declare const filterProjectItemsList: <T>(
  list: Array<T>,
  searchText: string
) => Array<T>;
