import * as React from 'react';

import MeasuresTable from '../../../Debugger/Profiler/MeasuresTable';
import profilerOutputsTestData from '../../../fixtures/ProfilerOutputsTestData.json';
import paperDecorator from '../../PaperDecorator';

export default {
  title: 'Debugger/MeasuresTable',
  component: MeasuresTable,
  decorators: [paperDecorator],
};

export const Default = (): React.ReactNode => (
  <MeasuresTable
    profilerMeasures={profilerOutputsTestData.framesAverageMeasures}
  />
);

export const WithoutMeasures = (): React.ReactNode => (
  <MeasuresTable profilerMeasures={null} />
);
