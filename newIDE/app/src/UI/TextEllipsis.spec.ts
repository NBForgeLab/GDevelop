import { textEllipsisStyle } from './TextEllipsis';

describe('TextEllipsis', () => {
  it('defines the standard text ellipsis styles', () => {
    expect(textEllipsisStyle).toEqual({
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    });
  });
});
