import * as React from 'react';
import { act } from 'react-dom/test-utils';
import renderer from 'react-test-renderer';
import Resource3DPreviewContext, {
  Resource3DPreviewProvider,
  type Resource3DPreviewState,
} from './Resource3DPreviewContext';
import {
  burstResource3DPreviewCache,
  getResource3DPreviewOrRequest,
  setCachedResource3DPreview,
  setResource3DPreviewRequester,
} from './Resource3DPreviewCache';
import { createResource3DPreviewWorker } from './Resource3DPreviewWorkerFactory';

const waitForMicrotasks = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

describe('Resource3DPreviewProvider', () => {
  beforeEach(() => {
    // The worker can't render: every preview is the fallback image.
    (createResource3DPreviewWorker as jest.Mock).mockImplementation(() => {
      // Mock worker for tests
      const worker: {
        onmessage: ((event: { data: unknown }) => void) | null;
        onerror: ((error: unknown) => void) | null;
        terminate: () => void;
        postMessage: (message: { type: string }) => void;
      } = {
        onmessage: null,
        onerror: null,
        terminate: () => {},
        postMessage: (message: { type: string }) => {
          if (message.type !== 'INIT') return;
          setTimeout(() => {
            if (worker.onmessage) {
              worker.onmessage({ data: { type: 'INIT', success: false } });
            }
          });
        },
      };
      return worker;
    });
    // The models can't be fetched either.
    global.fetch = jest.fn(() => Promise.reject(new Error('No network')));
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as { fetch?: typeof global.fetch }).fetch;
  });

  it('renders again the last rendered model after the cache is burst', async () => {
    const contextState: {
      getResourcePreview: Resource3DPreviewState['getResourcePreview'] | null;
    } = { getResourcePreview: null };
    const Consumer = () => {
      contextState.getResourcePreview = React.useContext(
        Resource3DPreviewContext
      ).getResourcePreview;
      return null;
    };
    let testRenderer: ReturnType<typeof renderer.create>;
    await act(async () => {
      testRenderer = renderer.create(
        <Resource3DPreviewProvider>
          <Consumer />
        </Resource3DPreviewProvider>
      );
    });
    if (!contextState.getResourcePreview) throw new Error('No context value.');
    const requestPreview = contextState.getResourcePreview;

    let preview: string | null | undefined;
    await act(async () => {
      preview = await requestPreview('https://example.com/model.glb');
    });
    expect(preview).toBe('JsPlatform/Extensions/3d_model.svg');

    burstResource3DPreviewCache();
    let previewAfterBurst: string | null | undefined = null;
    await act(async () => {
      requestPreview('https://example.com/model.glb').then(
        (dataUrl) => (previewAfterBurst = dataUrl)
      );
      for (let i = 0; i < 10; i++) await waitForMicrotasks();
    });
    expect(previewAfterBurst).toBe('JsPlatform/Extensions/3d_model.svg');
    expect(
      (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) => url === 'https://example.com/model.glb'
      )
    ).toHaveLength(2);

    act(() => testRenderer.unmount());
  });
});

describe('Resource3DPreviewCache', () => {
  let revokedUrls: Array<string> = [];
  beforeEach(() => {
    revokedUrls = [];
    URL.revokeObjectURL = (url: string) => revokedUrls.push(url);
  });
  afterEach(() => {
    setResource3DPreviewRequester(null);
  });

  it('keeps the preview of a local file while it is rendered again after a URL cache burst', async () => {
    let renderCount = 0;
    const requester = jest.fn(async (url: string) => {
      renderCount++;
      const preview = `blob:preview-${renderCount}`;
      setCachedResource3DPreview(url, preview);
      return preview;
    });
    setResource3DPreviewRequester(requester);

    expect(getResource3DPreviewOrRequest('file:///a.glb?cache=1')).toBe(null);
    await waitForMicrotasks();
    expect(getResource3DPreviewOrRequest('file:///a.glb?cache=1')).toBe(
      'blob:preview-1'
    );

    // The URL changed (the URL cache was burst): the previous preview is
    // still shown while the model is rendered again.
    expect(getResource3DPreviewOrRequest('file:///a.glb?cache=2')).toBe(
      'blob:preview-1'
    );
    await waitForMicrotasks();
    expect(requester).toHaveBeenCalledTimes(2);
    expect(getResource3DPreviewOrRequest('file:///a.glb?cache=2')).toBe(
      'blob:preview-2'
    );
    expect(revokedUrls).toEqual(['blob:preview-1']);
  });
});
