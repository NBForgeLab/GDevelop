import path from 'path';

const mockElectron = {
  ipcRenderer: {
    invoke: vi.fn(),
  },
};
const mockFsExtra = {
  ensureDir: vi.fn(),
  existsSync: vi.fn(),
};
const mockFs = {
  ensureDir: vi.fn(),
  existsSync: vi.fn(),
  promises: {
    readFile: vi.fn(filePath =>
      Promise.resolve('Fake content for file with path:' + filePath)
    ),
  },
};
const mockProcess = {};
const mockOs = {
  tmpdir: () => '/some/fake-tmp-dir',
};

const mockOptionalRequire = vi.fn(
  (
    moduleName,
    config = {
      rethrowException: false,
    }
  ) => {
    if (moduleName === 'electron') {
      return mockElectron;
    }
    if (moduleName === 'fs-extra') {
      return mockFsExtra;
    }
    if (moduleName === 'fs') {
      return mockFs;
    }
    if (moduleName === 'process') {
      return mockProcess;
    }
    if (moduleName === 'path') {
      return path;
    }
    if (moduleName === 'os') {
      return mockOs;
    }
    if (moduleName === '@electron/remote') {
      return null;
    }

    throw new Error(
      `The mock of optionalRequire does not support module with name: ${moduleName}. Please edit the mock to add it.`
    );
  }
);

mockOptionalRequire.mockElectron = mockElectron;
mockOptionalRequire.mockFsExtra = mockFsExtra;
mockOptionalRequire.mockFs = mockFs;

module.exports = mockOptionalRequire;
