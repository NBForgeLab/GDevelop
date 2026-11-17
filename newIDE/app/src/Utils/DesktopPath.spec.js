// @flow
// $FlowFixMe[cannot-resolve-module]
import nodePath from 'path';
import { createDesktopPath } from './DesktopPath';

describe('DesktopPath', () => {
  describe('POSIX mode (linux / darwin)', () => {
    const posixPath = createDesktopPath({
      platform: 'linux',
      getCwd: () => '/home/user/workspace',
    });

    it('exposes posix metadata and self/win32 references', () => {
      expect(posixPath.sep).toBe('/');
      expect(posixPath.delimiter).toBe(':');
      expect(posixPath.posix).toBe(posixPath);
      expect(posixPath.win32.sep).toBe('\\');
    });

    it('normalizes paths and handles empty/dot/dotdot segments', () => {
      expect(posixPath.normalize('')).toBe('.');
      expect(posixPath.normalize('/')).toBe('/');
      expect(posixPath.normalize('/a//b/./c/../d/')).toBe('/a/b/d/');
      expect(posixPath.normalize('a/b/../c')).toBe('a/c');
      expect(posixPath.normalize('../../a')).toBe('../../a');
      expect(posixPath.normalize('/../../a')).toBe('/a');
    });

    it('joins path segments safely', () => {
      expect(posixPath.join()).toBe('.');
      expect(posixPath.join('/home/user', 'projects', 'game.json')).toBe(
        '/home/user/projects/game.json'
      );
      expect(posixPath.join('assets/', '../images/hero.png')).toBe(
        'images/hero.png'
      );
      expect(posixPath.join('', 'sub', '')).toBe('sub');
    });

    it('resolves relative and absolute segments using getCwd', () => {
      expect(posixPath.resolve('project.json')).toBe(
        '/home/user/workspace/project.json'
      );
      expect(posixPath.resolve('/opt/gdevelop', '../assets', 'icon.png')).toBe(
        '/opt/assets/icon.png'
      );
      expect(posixPath.resolve()).toBe('/home/user/workspace');
    });

    it('computes relative paths accurately', () => {
      expect(posixPath.relative('/a/b/c', '/a/b/c')).toBe('');
      expect(posixPath.relative('/a/b/c', '/a/d/e')).toBe('../../d/e');
      expect(posixPath.relative('/a/b', '/a/b/assets/img.png')).toBe(
        'assets/img.png'
      );
    });

    it('checks isAbsolute and extracts dirname/basename/extname', () => {
      expect(posixPath.isAbsolute('/foo/bar')).toBe(true);
      expect(posixPath.isAbsolute('foo/bar')).toBe(false);
      expect(posixPath.isAbsolute('')).toBe(false);

      expect(posixPath.dirname('/a/b/c.txt')).toBe('/a/b');
      expect(posixPath.dirname('/a')).toBe('/');
      expect(posixPath.dirname('file.txt')).toBe('.');
      expect(posixPath.dirname('')).toBe('.');

      expect(posixPath.basename('/a/b/c.txt')).toBe('c.txt');
      expect(posixPath.basename('/a/b/c.txt', '.txt')).toBe('c');
      expect(posixPath.basename('/a/b/.txt', '.txt')).toBe('');
      expect(posixPath.basename('/a/b/')).toBe('b');
      expect(posixPath.basename('/')).toBe('');

      expect(posixPath.extname('sprite.png')).toBe('.png');
      expect(posixPath.extname('.gitignore')).toBe('');
      expect(posixPath.extname('archive.tar.gz')).toBe('.gz');
    });

    it('parses and formats paths symmetrically', () => {
      const parsed = posixPath.parse('/home/user/game.json');
      expect(parsed).toEqual({
        root: '/',
        dir: '/home/user',
        base: 'game.json',
        ext: '.json',
        name: 'game',
      });
      expect(posixPath.format(parsed)).toBe('/home/user/game.json');
      expect(posixPath.format({ dir: '/', base: 'file.txt' })).toBe(
        '/file.txt'
      );
    });

    it('matches Node path edge cases for dotdot and trailing slashes', () => {
      expect(posixPath.extname('..')).toBe('');
      expect(posixPath.extname('../..')).toBe('');
      expect(posixPath.extname('/..')).toBe('');
      expect(posixPath.parse('..')).toEqual({
        root: '',
        dir: '',
        base: '..',
        ext: '',
        name: '..',
      });
      expect(posixPath.parse('a/')).toEqual({
        root: '',
        dir: '',
        base: 'a',
        ext: '',
        name: 'a',
      });
      expect(posixPath.format(posixPath.parse('a/'))).toBe('a');
      expect(posixPath.parse('./a/')).toEqual({
        root: '',
        dir: '.',
        base: 'a',
        ext: '',
        name: 'a',
      });
    });
  });

  describe('Win32 edge-case parity', () => {
    const winPath = createDesktopPath({
      platform: 'win32',
      getCwd: () => 'C:\\Users\\Dev\\Projects',
    });

    it('handles dotdot, trailing slash, drive-relative normalize, and UNC share roots', () => {
      expect(winPath.extname('..')).toBe('');
      expect(winPath.extname('/..')).toBe('');
      expect(winPath.normalize('C:')).toBe('C:.');
      expect(winPath.normalize('C:a\\..')).toBe('C:.');
      expect(winPath.parse('a\\')).toEqual({
        root: '',
        dir: '',
        base: 'a',
        ext: '',
        name: 'a',
      });
      expect(winPath.basename('\\\\server\\share')).toBe('share');
      expect(winPath.dirname('\\\\server\\share')).toBe('\\\\server\\share');
      expect(winPath.parse('\\\\server\\share')).toEqual({
        root: '\\\\server\\share',
        dir: '\\\\server\\share',
        base: '',
        ext: '',
        name: '',
      });
      expect(winPath.parse('\\\\server\\share\\dir\\file.txt')).toEqual({
        root: '\\\\server\\share\\',
        dir: '\\\\server\\share\\dir',
        base: 'file.txt',
        ext: '.txt',
        name: 'file',
      });
    });
  });

  describe('Win32 mode', () => {
    const winPath = createDesktopPath({
      platform: 'win32',
      getCwd: () => 'C:\\Users\\Dev\\Projects',
    });

    it('exposes win32 metadata and posix sub-namespace', () => {
      expect(winPath.sep).toBe('\\');
      expect(winPath.delimiter).toBe(';');
      expect(winPath.win32).toBe(winPath);
      expect(winPath.posix.sep).toBe('/');
      expect(winPath.posix.normalize('assets/../hero.png')).toBe('hero.png');
    });

    it('handles drive letters, UNC paths, and mixed separators', () => {
      expect(winPath.isAbsolute('C:\\Windows')).toBe(true);
      expect(winPath.isAbsolute('C:/Windows')).toBe(true);
      expect(winPath.isAbsolute('C:relative\\path')).toBe(false);
      expect(winPath.isAbsolute('\\\\server\\share\\file.png')).toBe(true);
      expect(winPath.isAbsolute('assets\\player.png')).toBe(false);

      expect(winPath.normalize('C:\\games/demo\\..\\final\\game.json')).toBe(
        'C:\\games\\final\\game.json'
      );
      expect(winPath.normalize('')).toBe('.');

      expect(winPath.join('C:\\games', 'demo/', 'assets\\hero.png')).toBe(
        'C:\\games\\demo\\assets\\hero.png'
      );
      expect(winPath.resolve('game.json')).toBe(
        'C:\\Users\\Dev\\Projects\\game.json'
      );
      expect(winPath.resolve('D:\\Builds', '..\\Assets', 'icon.png')).toBe(
        'D:\\Assets\\icon.png'
      );
    });

    it('computes case-insensitive drive relative paths', () => {
      expect(
        winPath.relative(
          'C:\\Games\\Project',
          'c:\\games\\project\\assets\\a.png'
        )
      ).toBe('assets\\a.png');
      expect(winPath.relative('C:\\Games\\A', 'D:\\Other\\B')).toBe(
        'D:\\Other\\B'
      );
    });

    it('handles dirname/basename/extname/parse/format on Win32 paths', () => {
      expect(winPath.dirname('C:\\a\\b\\c.png')).toBe('C:\\a\\b');
      expect(winPath.dirname('C:\\a')).toBe('C:\\');
      expect(winPath.dirname('file.txt')).toBe('.');
      expect(winPath.basename('C:\\a\\b\\hero.png', '.png')).toBe('hero');
      expect(winPath.extname('C:\\a\\.hidden')).toBe('');

      const parsed = winPath.parse('C:\\Games\\game.json');
      expect(parsed).toEqual({
        root: 'C:\\',
        dir: 'C:\\Games',
        base: 'game.json',
        ext: '.json',
        name: 'game',
      });
      expect(winPath.format(parsed)).toBe('C:\\Games\\game.json');
    });

    it('matches Node path.posix and path.win32 edge cases', () => {
      const posix = createDesktopPath({
        platform: 'linux',
        getCwd: () => '/home/user/workspace',
      });
      const win = createDesktopPath({
        platform: 'win32',
        getCwd: () => 'C:\\Users\\Dev\\Projects',
      });

      [
        'a//b/',
        'a///b/',
        '/a//b',
        '///a',
        '///',
        '//a/b/',
        'a/b//',
        '/',
        '',
      ].forEach(sample => {
        expect(posix.dirname(sample)).toBe(nodePath.posix.dirname(sample));
      });

      [
        'C:\\a//b//',
        'C:\\a\\\\b\\\\',
        '\\\\srv\\sh\\a\\\\b\\\\',
        '\\\\srv\\sh\\',
        '\\\\srv\\sh',
        'C:\\\\',
        'C:\\\\a',
        '\\\\a',
        'a//b//',
        'D:',
      ].forEach(sample => {
        expect(win.dirname(sample)).toBe(nodePath.win32.dirname(sample));
      });

      expect(win.resolve('\\\\srv\\sh', 'foo', '..\\bar')).toBe(
        nodePath.win32.resolve('\\\\srv\\sh', 'foo', '..\\bar')
      );
      expect(win.resolve('\\\\srv\\sh', 'foo', '..\\..\\bar')).toBe(
        nodePath.win32.resolve('\\\\srv\\sh', 'foo', '..\\..\\bar')
      );
      expect(win.resolve('\\\\srv\\sh', '\\bar')).toBe(
        nodePath.win32.resolve('\\\\srv\\sh', '\\bar')
      );
      expect(win.resolve('C:\\dir\\sub', '\\rootfile')).toBe(
        nodePath.win32.resolve('C:\\dir\\sub', '\\rootfile')
      );
    });
  });
});
