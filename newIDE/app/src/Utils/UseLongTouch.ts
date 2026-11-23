import * as React from 'react';
import { hapticFeedback, hapticPatterns } from './Haptic';

type TouchEventLike = React.TouchEvent<any> | TouchEvent;

export type ClientCoordinates = {
  /* The X position, relative to the viewport, not including scroll offset, of the long touch */
  readonly clientX: number;
  /* The Y position, relative to the viewport, not including scroll offset, of the long touch */
  readonly clientY: number;
  readonly currentTarget: EventTarget | null;
};

// Find the position of an event on the screen
const getClientXY = (event: TouchEventLike): ClientCoordinates => {
  if (event.touches && event.touches.length > 0) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
      currentTarget: event.currentTarget,
    };
  }

  return {
    clientX: 0,
    clientY: 0,
    currentTarget: event.currentTarget,
  };
};

// Long press opening a context menu. Items that must be held before being
// dragged use a longer delay (see LONG_PRESS_DELAY_ON_HELD_ITEM), as the
// hold has an intermediate state (the item lifts) to notice first.
const defaultDelay = 600; // ms
const moveTolerance = 10; // px

const contextLocks: {
  [key: string]: true;
} = {};

/**
 * A hook to listen to a long touch ("long press") on an element, to workaround the
 * non working onContextMenu on some platforms (Safari on iOS).
 *
 * A long press is characterized by starting a touch and staying pressed, without
 * moving too far from the initial position (to avoid being confused with a drag/scroll).
 */
export const useLongTouch = (
  callback: (e: ClientCoordinates) => void,
  options?: {
    /**
     * To be set when nested elements with watched touches events are in conflict to run a callback.
     * Priority will be given to the nested element.
     */
    context?: string;
    delay?: number;
    doNotCancelOnScroll?: boolean;
  }
): {
  contextMenuProps: {
    onTouchCancel: (event: TouchEventLike) => void;
    onTouchEnd: (event: TouchEventLike) => void;
    onTouchMove: (event: TouchEventLike) => void;
    onTouchStart: (event: TouchEventLike) => void;
  };
} => {
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const context = options && options.context ? options.context : null;
  const delay = options && options.delay ? options.delay : defaultDelay;
  const currentClientCoordinates = React.useRef<ClientCoordinates | null>(null);
  const longTouchFired = React.useRef<boolean>(false);
  const clear = React.useCallback(() => {
    if (context) delete contextLocks[context];
    timeout.current && clearTimeout(timeout.current);
  }, [context]);

  const cancelOnScroll = !options || !options.doNotCancelOnScroll;

  React.useEffect(() => {
    if (!cancelOnScroll) return;
    // Cancel the long touch if scrolling (otherwise we can get a long touch
    // being activated while scroll and maintaining the touch on an element,
    // which is weird for the user that just want to scroll).
    document.addEventListener('scroll', clear, {
      // Get notified as soon as the scroll happens.
      capture: true,

      // No need for passive: true
      // According to MDN: "You don't need to worry about the value of passive for the basic scroll event.
      // Since it can't be canceled, event listeners can't block page rendering anyway".
    });

    return () => {
      // Ensure we remove the timeout waiting for the long press
      // if the component is destroyed.
      clear();

      // Remove the listener for the scroll
      document.removeEventListener('scroll', clear, { capture: true });
    };
  }, [clear, cancelOnScroll]);

  const start = React.useCallback(
    (event: TouchEventLike) => {
      // Ensure we remove the timeout waiting for the long press
      // if there is one already. This can happen if start is called
      // multiple times.
      timeout.current && clearTimeout(timeout.current);
      // Reset before the context-lock early return below: an element that
      // won't fire must not cancel this gesture's touchend.
      longTouchFired.current = false;
      if (context) {
        if (contextLocks[context]) return;
        contextLocks[context] = true;
      }

      const clientCoordinates = getClientXY(event);
      currentClientCoordinates.current = clientCoordinates;
      timeout.current = setTimeout(() => {
        // Release the lock now: if the callback opens a context menu, the
        // menu swallows the touchend and `clear` would never run.
        if (context) delete contextLocks[context];
        longTouchFired.current = true;
        if (hapticFeedback) {
          hapticFeedback({ pattern: hapticPatterns.longPress });
        }
        callback(clientCoordinates);
      }, delay);
    },
    [callback, context, delay]
  );

  const onMove = React.useCallback(
    (event: TouchEventLike) => {
      // If more than one touch,
      // it's not a long press anymore.
      if (event.touches.length !== 1) {
        clear();
        return;
      }

      // If touch moved too far from the initial touch position,
      // it's not a long press anymore.
      const touch = event.touches[0];
      if (!currentClientCoordinates.current) return;
      const { clientX, clientY } = currentClientCoordinates.current;
      if (
        Math.abs(touch.clientX - clientX) > moveTolerance ||
        Math.abs(touch.clientY - clientY) > moveTolerance
      ) {
        clear();
        return;
      }
    },
    [currentClientCoordinates, clear]
  );

  const end = React.useCallback(
    (event: TouchEventLike) => {
      if (longTouchFired.current) {
        // Prevent the synthesized mouse events/click, which would land on
        // whatever is now under the finger (context menu, backdrop, item).
        if (event.cancelable !== false) event.preventDefault();
        longTouchFired.current = false;
      }
      clear();
    },
    [clear]
  );

  return {
    contextMenuProps: {
      onTouchStart: start,
      onTouchMove: onMove,
      onTouchEnd: end,
      onTouchCancel: end,
    },
  };
};
