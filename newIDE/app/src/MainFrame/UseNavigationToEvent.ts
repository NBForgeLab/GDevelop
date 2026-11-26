import * as React from 'react';
import { type EditorTabsState } from './EditorTabs/EditorTabsHandler';
import type { EventPath } from '../Utils/EventPath';
import type { LocationType } from '../Utils/Search';

export type EventNavigationTarget = {
  name: string;
  locationType: LocationType;
  eventPath: EventPath;
  functionName?: string;
  behaviorName?: string | null;
  objectName?: string | null;
};

type UseNavigationToEventProps = {
  editorTabs: EditorTabsState;
};

type UseNavigationToEventResult = {
  setPendingEventNavigation: (target: EventNavigationTarget | null) => void;
};

const EDITOR_MOUNT_DELAY_MS = 300;
const FUNCTION_SELECT_DELAY_MS = 150;

type NavigatableEventsEditorRef = {
  selectEventsFunctionByName?: (
    functionName: string,
    behaviorName?: string | null,
    objectName?: string | null
  ) => void;
  scrollToEventPath?: (eventPath: EventPath) => void;
};

/**
 * Hook to handle navigation to a specific event in an events editor.
 * Sets up a pending navigation that will scroll to the event once the editor is mounted.
 */
export const useNavigationToEvent = ({
  editorTabs,
}: UseNavigationToEventProps): UseNavigationToEventResult => {
  const [pendingEventNavigation, setPendingEventNavigation] = React.useState<
    EventNavigationTarget | null | undefined
  >(null);
  const scrollTimeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  React.useEffect(() => {
    if (!pendingEventNavigation) return;

    const timeoutId = setTimeout(() => {
      const {
        name,
        locationType,
        eventPath,
        functionName,
        behaviorName,
        objectName,
      } = pendingEventNavigation;
      const editorKind =
        locationType === 'layout'
          ? 'layout events'
          : locationType === 'external-events'
            ? 'external events'
            : 'events functions extension';

      for (const paneIdentifier in editorTabs.panes) {
        const pane = editorTabs.panes[paneIdentifier];
        for (const editor of pane.editors) {
          if (
            editor.kind === editorKind &&
            editor.projectItemName === name &&
            editor.editorRef
          ) {
            const ref = editor.editorRef as NavigatableEventsEditorRef;

            if (
              locationType === 'extension' &&
              functionName &&
              ref.selectEventsFunctionByName
            ) {
              ref.selectEventsFunctionByName(
                functionName,
                behaviorName,
                objectName
              );
              if (ref.scrollToEventPath) {
                scrollTimeoutIdRef.current = setTimeout(() => {
                  scrollTimeoutIdRef.current = null;
                  if (ref.scrollToEventPath) {
                    ref.scrollToEventPath(eventPath);
                  }
                  setPendingEventNavigation(null);
                }, FUNCTION_SELECT_DELAY_MS);
              } else {
                setPendingEventNavigation(null);
              }
            } else {
              if (ref.scrollToEventPath) {
                ref.scrollToEventPath(eventPath);
              }
              setPendingEventNavigation(null);
            }

            return;
          }
        }
      }

      setPendingEventNavigation(null);
    }, EDITOR_MOUNT_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      if (scrollTimeoutIdRef.current) {
        clearTimeout(scrollTimeoutIdRef.current);
        scrollTimeoutIdRef.current = null;
      }
    };
  }, [pendingEventNavigation, editorTabs]);

  return { setPendingEventNavigation };
};
