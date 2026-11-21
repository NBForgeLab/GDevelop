import { emailRegex } from './EmailUtils';

describe('EmailUtils', () => {
  it('correctly matches valid basic email structures', () => {
    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('hello.world@sub.domain.org')).toBe(true);
  });

  it('rejects strings missing username or domain', () => {
    expect(emailRegex.test('@example.com')).toBe(false);
    expect(emailRegex.test('user@')).toBe(false);
    expect(emailRegex.test('plainaddress')).toBe(false);
  });
});
