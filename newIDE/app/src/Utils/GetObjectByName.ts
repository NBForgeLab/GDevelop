export default function getObjectByName(
  globalObjectsContainer: gdObjectsContainer | null,
  objectsContainer: gdObjectsContainer | null | undefined,
  objectName: string
): gdObject | null {
  if (objectsContainer && objectsContainer.hasObjectNamed(objectName))
    return objectsContainer.getObject(objectName);
  else if (
    globalObjectsContainer &&
    globalObjectsContainer.hasObjectNamed(objectName)
  )
    return globalObjectsContainer.getObject(objectName);

  return null;
}
