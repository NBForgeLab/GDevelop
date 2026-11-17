// @flow
const { findGDJS } = require('./LocalGDJSFinder');

describe('local game engine discovery', () => {
  it('preserves the share root when probing a Windows network installation', async () => {
    const appPath = '\\\\server\\share\\GDevelop\\resources\\app.asar';
    const expected = '\\\\server\\share\\GDevelop\\resources\\GDJS';
    const access = jest.fn((candidate: string) =>
      Promise.resolve({ ok: candidate === expected })
    );
    const originalWindow = global.window;
    if (!originalWindow) (global: any).window = {};
    const original = global.window.gdevelopDesktop;
    try {
      global.window.gdevelopDesktop = {
        getBootstrapData: () => ({ appPath, platform: 'win32' }),
        fs: { access },
      };
      await expect(findGDJS()).resolves.toEqual({ gdjsRoot: expected });
      expect(access.mock.calls.map(args => args[0])).toEqual([
        '\\\\server\\share\\JsPlatform',
        expected,
      ]);
    } finally {
      if (!originalWindow) delete (global: any).window;
      else if (original === undefined) delete originalWindow.gdevelopDesktop;
      else originalWindow.gdevelopDesktop = original;
    }
  });
});
