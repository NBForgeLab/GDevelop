import * as React from 'react';
import renderer from 'react-test-renderer';
import CircularProgress from './CircularProgress';
import MuiCircularProgress from '@material-ui/core/CircularProgress';

describe('CircularProgress', () => {
  it('renders default indeterminate progress', () => {
    const component = renderer.create(<CircularProgress />);
    const muiProgress = component.root.findByType(MuiCircularProgress);
    expect(muiProgress.props.color).toBe('secondary');
    expect(muiProgress.props.variant).toBeUndefined();
  });

  it('maps determinate variant to static for MUI', () => {
    const component = renderer.create(
      <CircularProgress variant="determinate" value={75} />
    );
    const muiProgress = component.root.findByType(MuiCircularProgress);
    expect(muiProgress.props.variant).toBe('static');
    expect(muiProgress.props.value).toBe(75);
  });

  it('supports size, disableShrink, and style', () => {
    const style = { height: 24, width: 24 };
    const component = renderer.create(
      <CircularProgress size={24} disableShrink style={style} />
    );
    const muiProgress = component.root.findByType(MuiCircularProgress);
    expect(muiProgress.props.size).toBe(24);
    expect(muiProgress.props.disableShrink).toBe(true);
    expect(muiProgress.props.style).toEqual(style);
  });

  it('forwards ref without error', () => {
    const ref = React.createRef<HTMLDivElement>();
    expect(() => {
      renderer.create(<CircularProgress ref={ref} />);
    }).not.toThrow();
  });
});
