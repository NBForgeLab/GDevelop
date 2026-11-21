import * as React from 'react';
import renderer from 'react-test-renderer';
import LinearProgress from './LinearProgress';
import MuiLinearProgress from '@material-ui/core/LinearProgress';

describe('LinearProgress', () => {
  it('renders default indeterminate progress', () => {
    const component = renderer.create(<LinearProgress />);
    const muiProgress = component.root.findByType(MuiLinearProgress);
    expect(muiProgress.props.color).toBe('secondary');
    expect(muiProgress.props.variant).toBeUndefined();
  });

  it('renders determinate progress with value', () => {
    const component = renderer.create(
      <LinearProgress variant="determinate" value={60} />
    );
    const muiProgress = component.root.findByType(MuiLinearProgress);
    expect(muiProgress.props.variant).toBe('determinate');
    expect(muiProgress.props.value).toBe(60);
  });

  it('supports custom color, barColor, trackColor, and style', () => {
    const style = { height: 4, borderRadius: 2 };
    const component = renderer.create(
      <LinearProgress
        color="success"
        barColor="#ff0000"
        trackColor="#00ff00"
        style={style}
      />
    );
    const muiProgress = component.root.findByType(MuiLinearProgress);
    expect(muiProgress.props.style).toEqual(expect.objectContaining(style));
    expect(muiProgress.props.classes).toBeDefined();
  });

  it('forwards ref without error', () => {
    const ref = React.createRef<HTMLDivElement>();
    expect(() => {
      renderer.create(<LinearProgress ref={ref} />);
    }).not.toThrow();
  });
});
