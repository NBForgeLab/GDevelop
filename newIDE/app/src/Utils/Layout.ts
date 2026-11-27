const gd: libGDevelop = global.gd;

export const getInstanceInLayoutWithPersistentUuid = (
  initialInstancesContainer: gdInitialInstancesContainer,
  persistentUuid: string
): gdInitialInstance | null => {
  if (initialInstancesContainer.getInstancesCount() === 0) return null;
  let matchingInstance: gdInitialInstance | null = null;
  const instanceGetter = new gd.InitialInstanceJSFunctor();
  instanceGetter.invoke = (instancePtr) => {
    const instance: gdInitialInstance = gd.wrapPointer(
      instancePtr,
      gd.InitialInstance
    );
    if (instance.getPersistentUuid() === persistentUuid) {
      matchingInstance = instance;
    }
  };
  initialInstancesContainer.iterateOverInstances(instanceGetter);
  instanceGetter.delete();
  return matchingInstance;
};

export const getInstancesInLayoutForObject = (
  initialInstancesContainer: gdInitialInstancesContainer,
  objectName: string
): Array<gdInitialInstance> => {
  if (initialInstancesContainer.getInstancesCount() === 0) return [];
  const objectInstances: Array<gdInitialInstance> = [];
  const instanceGetter = new gd.InitialInstanceJSFunctor();
  instanceGetter.invoke = (instancePtr) => {
    const instance: gdInitialInstance = gd.wrapPointer(
      instancePtr,
      gd.InitialInstance
    );
    if (instance.getObjectName() === objectName) {
      objectInstances.push(instance);
    }
  };
  initialInstancesContainer.iterateOverInstances(instanceGetter);
  instanceGetter.delete();
  return objectInstances;
};

export const getInstancesInLayoutForLayer = (
  initialInstancesContainer: gdInitialInstancesContainer,
  layerName: string
): Array<gdInitialInstance> => {
  if (initialInstancesContainer.getInstancesCount() === 0) return [];
  const objectInstances: Array<gdInitialInstance> = [];
  const instanceGetter = new gd.InitialInstanceJSFunctor();
  instanceGetter.invoke = (instancePtr) => {
    const instance: gdInitialInstance = gd.wrapPointer(
      instancePtr,
      gd.InitialInstance
    );
    if (instance.getLayer() === layerName) {
      objectInstances.push(instance);
    }
  };
  initialInstancesContainer.iterateOverInstances(instanceGetter);
  instanceGetter.delete();
  return objectInstances;
};

export const getInstanceCountInLayoutForObject = (
  initialInstancesContainer: gdInitialInstancesContainer,
  objectName: string
): number => {
  return getInstancesInLayoutForObject(initialInstancesContainer, objectName)
    .length;
};

// `newName` is used as-is: ensure it is unique (e.g. via `newNameGenerator`).
export const renameLayoutInProject = (
  project: gdProject,
  oldName: string,
  newName: string
): void => {
  const wasFirstScene = project.getFirstLayout() === oldName;
  project.getLayout(oldName).setName(newName);
  gd.WholeProjectRefactorer.renameLayout(project, oldName, newName);
  if (wasFirstScene) {
    project.setFirstLayout(newName);
  }
};
