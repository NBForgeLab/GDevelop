import * as React from 'react';
import { type Decorator } from '@storybook/react';
import WindowUtils from '../Utils/Window';

type GDevelopJsInitializerProps = {
  children: () => React.ReactNode;
};

const BrowserDropDownMenuDisabler = ({
  children,
}: GDevelopJsInitializerProps) => {
  React.useEffect(() => {
    WindowUtils.setUpContextMenu();
  }, []);

  return children();
};

const BrowserDropDownMenuDisablerDecorator: Decorator = (Story, context) => (
  <BrowserDropDownMenuDisabler>{() => <Story />}</BrowserDropDownMenuDisabler>
);

export default BrowserDropDownMenuDisablerDecorator;
