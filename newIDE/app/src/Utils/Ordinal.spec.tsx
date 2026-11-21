import { rankLabel } from './Ordinal';

describe('Ordinal', () => {
  it('provides rank labels from 1 to 10', () => {
    for (let i = 1; i <= 10; i++) {
      expect(rankLabel[i]).toBeDefined();
      expect(rankLabel[String(i)]).toBeDefined();
    }
  });
});
