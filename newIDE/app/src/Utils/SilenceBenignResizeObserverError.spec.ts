import { silenceBenignResizeObserverError } from './SilenceBenignResizeObserverError';

describe('SilenceBenignResizeObserverError', () => {
  it('suppresses the benign resize observer error event', () => {
    const listeners: Record<string, (event: any) => void> = {};
    const mockWindow = {
      addEventListener: jest.fn((type: string, handler: any) => {
        listeners[type] = handler;
      }),
    } as any;

    silenceBenignResizeObserverError(mockWindow);
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );

    const stopImmediatePropagation = jest.fn();
    const event = {
      message: 'ResizeObserver loop completed with undelivered notifications.',
      stopImmediatePropagation,
    };

    listeners['error'](event);
    expect(stopImmediatePropagation).toHaveBeenCalled();
  });

  it('ignores other unrelated error events', () => {
    const listeners: Record<string, (event: any) => void> = {};
    const mockWindow = {
      addEventListener: jest.fn((type: string, handler: any) => {
        listeners[type] = handler;
      }),
    } as any;

    silenceBenignResizeObserverError(mockWindow);

    const stopImmediatePropagation = jest.fn();
    const event = {
      message: 'Uncaught TypeError: something failed',
      stopImmediatePropagation,
    };

    listeners['error'](event);
    expect(stopImmediatePropagation).not.toHaveBeenCalled();
  });
});
