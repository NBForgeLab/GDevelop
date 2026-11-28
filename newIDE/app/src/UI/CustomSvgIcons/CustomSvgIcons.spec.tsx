import React from 'react';
import renderer from 'react-test-renderer';
import fs from 'fs';

describe('CustomSvgIcons', () => {
  const iconsDir = __dirname;
  const iconFiles = fs
    .readdirSync(iconsDir)
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx'));

  test('found expected number of migrated SVG icon files', () => {
    expect(iconFiles.length).toBe(278);
  });

  const forwardRefIcons = [
    'Async.tsx',
    'CircledInfo.tsx',
    'Folder.tsx',
    'NetworkNotSynchronized.tsx',
    'NetworkSynchronized.tsx',
    'Object.tsx',
    'Sun.tsx',
    'Visibility.tsx',
    'VisibilityOff.tsx',
    'Warning.tsx',
    'WarningRound.tsx',
  ];

  test('all 278 SVG icons can be rendered without throwing errors', () => {
    for (const iconFile of iconFiles) {
      const modulePath = './' + iconFile.replace(/\.tsx$/, '');
      const IconComponent = require(modulePath).default;
      expect(IconComponent).toBeDefined();

      let tree: any = null;
      expect(() => {
        const component = renderer.create(
          <IconComponent className="test-icon-class" fontSize="small" />
        );
        tree = component.toJSON();
      }).not.toThrow();

      expect(tree).not.toBeNull();
      if (tree) {
        expect(tree.type).toBe('svg');
        expect(tree.props.className).toContain('test-icon-class');
      }
    }
  });

  test('all forwardRef icons accept refs without runtime error', () => {
    for (const iconFile of forwardRefIcons) {
      const modulePath = './' + iconFile.replace(/\.tsx$/, '');
      const IconComponent = require(modulePath).default;
      const ref = React.createRef<SVGSVGElement>();

      expect(() => {
        renderer.create(<IconComponent ref={ref} />);
      }).not.toThrow();
    }
  });
});
