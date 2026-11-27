import * as React from 'react';

// Keep first as it creates the `global.gd` object:
import { testProject } from '../../GDevelopJsInitializerDecorator';

import paperDecorator from '../../PaperDecorator';
import EventsBasedBehaviorEditor from '../../../EventsFunctionsExtensionEditor/EventsBasedBehaviorOrObjectEditor/EventsBasedBehaviorEditor';

export default {
  title: 'EventsBasedBehaviorEditor/index',
  component: EventsBasedBehaviorEditor,
  decorators: [paperDecorator],
};

export const Default = (): React.ReactNode => (
  <EventsBasedBehaviorEditor
    project={testProject.project}
    eventsFunctionsExtension={testProject.testEventsFunctionsExtension}
    eventsBasedBehavior={testProject.testEventsBasedBehavior}
  />
);

export const WithoutFunction = (): React.ReactNode => (
  <EventsBasedBehaviorEditor
    project={testProject.project}
    eventsFunctionsExtension={testProject.testEventsFunctionsExtension}
    eventsBasedBehavior={testProject.testEmptyEventsBasedBehavior}
  />
);
