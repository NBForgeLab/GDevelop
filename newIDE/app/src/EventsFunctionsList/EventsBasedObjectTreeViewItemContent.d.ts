export type EventsBasedObjectCreationParameters = {
  isRenderedIn3D: boolean;
};

export type EventsBasedObjectCallbacks = {
  onSelectEventsBasedObject: (
    eventsBasedObject: gdEventsBasedObject | null | undefined
  ) => void;
  onDeleteEventsBasedObject: (
    eventsBasedObject: gdEventsBasedObject,
    cb: (shouldDelete: boolean) => void
  ) => void;
  onRenameEventsBasedObject: (
    eventsBasedObject: gdEventsBasedObject,
    newName: string,
    cb: (shouldRename: boolean) => void
  ) => void;
  onAddEventsBasedObject: (
    cb: (
      parameters: EventsBasedObjectCreationParameters | null | undefined
    ) => void
  ) => void;
  onEventsBasedObjectRenamed: (eventsBasedObject: gdEventsBasedObject) => void;
  onEventsBasedObjectPasted: (
    eventsBasedObject: gdEventsBasedObject,
    sourceExtensionName: string,
    sourceEventsBasedObjectName: string
  ) => void;
  onOpenCustomObjectEditor: (eventsBasedObject: gdEventsBasedObject) => void;
  onEventBasedObjectTypeChanged: () => void;
  moveEventsBasedObjectTo: (
    eventsBasedObject: gdEventsBasedObject,
    cb: (destinationExtensionName: string) => void
  ) => void;
  onEventsBasedObjectMoved: (
    oldExtensionName: string,
    newExtensionName: string,
    oldObjectName: string,
    newObjectName: string
  ) => void;
};

export declare const getObjectTreeViewItemId: (
  eventsBasedObject: gdEventsBasedObject
) => string;
