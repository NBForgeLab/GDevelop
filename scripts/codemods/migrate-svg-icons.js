const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../../newIDE/app/src/UI/CustomSvgIcons');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f === 'Bluesky.tsx');
console.log('Converting', files.length, 'icons in', dir);

const flowStub = `// @flow
// @flow-transitional-stub [Phase 1]
import * as React from 'react';

declare export default React.ComponentType<any>;
`;

for (const file of files) {
  const baseName = file.replace(/\.(js|tsx)$/, '');
  const filePath = path.join(dir, file);
  const tsxPath = path.join(dir, baseName + '.tsx');
  const flowPath = path.join(dir, baseName + '.js.flow');

  let content = fs.readFileSync(filePath, 'utf8');

  // Update import
  if (!content.includes('SvgIconProps')) {
    content = content.replace(
      /import SvgIcon from '@material-ui\/core\/SvgIcon';/,
      "import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';"
    );
  }

  // Update export
  if (content.includes('React.forwardRef')) {
    content = content.replace(
      /export default React\.memo\(\s*React\.forwardRef\(\(props, ref\) =>/,
      'export default React.memo(\n  React.forwardRef<SVGSVGElement, SvgIconProps>((props, ref) =>'
    );
  } else {
    content = content.replace(
      /export default React\.memo\(props =>/,
      'export default React.memo((props: SvgIconProps) =>'
    );
  }

  fs.writeFileSync(tsxPath, content, 'utf8');
  fs.writeFileSync(flowPath, flowStub, 'utf8');
  if (file.endsWith('.js')) {
    fs.unlinkSync(filePath);
  }
}

console.log('Successfully converted all SVG icons!');
