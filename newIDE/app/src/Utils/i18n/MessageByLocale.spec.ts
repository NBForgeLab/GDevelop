import { type I18n as I18nType } from '@lingui/core';
import { selectMessageByLocale } from './MessageByLocale';

const makeFakeI18n = (fakeI18n: any): I18nType => fakeI18n;

describe('MessageByLocale', () => {
  describe('selectMessageByLocale', () => {
    test('select the proper message according to the language', () => {
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'en' }), {
          en: 'Test',
        })
      ).toBe('Test');
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'en' }), {
          en: 'Test',
          fr: 'Test2',
        })
      ).toBe('Test');
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'fr' }), {
          en: 'Test',
          fr: 'Test2',
        })
      ).toBe('Test2');
    });
    test('fallback to the same language even if not fully qualifying for the region', () => {
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'pt-br' }), {
          'pt-pt': 'Message 1',
          'pt-br': 'Message 2',
        })
      ).toBe('Message 2');
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'pt-OTHER' }), {
          'pt-pt': 'Message 1',
          pt: 'Message 2',
        })
      ).toBe('Message 2');
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'pt-pt' }), {
          'pt-pt': 'Message 1',
          pt: 'Message 1',
        })
      ).toBe('Message 1');
    });
    test('fallback to english or the only language available', () => {
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'en' }), {
          fr: 'Only this is available.',
        })
      ).toBe('Only this is available.');
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'pt-BR' }), {
          en: 'Test',
          fr: 'Test2',
        })
      ).toBe('Test');
      expect(
        selectMessageByLocale(makeFakeI18n({ language: 'pt-OTHER' }), {
          'pt-pt': 'Message 1',
          'pt-br': 'Message 2',
          en: 'Message 3',
        })
      ).toBe('Message 3');
      expect(selectMessageByLocale(makeFakeI18n({ language: 'fr' }), {})).toBe(
        ''
      );
    });
    test('handles type errors gracefully', () => {
      expect(
        // @ts-expect-error Intentionally pass a non-object value to verify runtime fallback.
        selectMessageByLocale(makeFakeI18n({ language: 'fr' }), 'Test')
      ).toBe('Test');

      // @ts-expect-error Intentionally pass a non-object value to verify runtime fallback.
      expect(selectMessageByLocale(makeFakeI18n({ language: 'fr' }), 0)).toBe(
        ''
      );

      // @ts-expect-error Intentionally pass a non-object value to verify runtime fallback.
      expect(selectMessageByLocale(makeFakeI18n({ language: 'fr' }), 123)).toBe(
        ''
      );

      // @ts-expect-error Intentionally pass an array to verify runtime fallback.
      expect(selectMessageByLocale(makeFakeI18n({ language: 'fr' }), [])).toBe(
        ''
      );
      expect(
        // @ts-expect-error Intentionally pass null to verify runtime fallback.
        selectMessageByLocale(makeFakeI18n({ language: 'fr' }), null)
      ).toBe('');
      expect(
        // @ts-expect-error Intentionally pass undefined to verify runtime fallback.
        selectMessageByLocale(makeFakeI18n({ language: 'fr' }), undefined)
      ).toBe('');
      expect(
        // @ts-expect-error Intentionally pass a boolean to verify runtime fallback.
        selectMessageByLocale(makeFakeI18n({ language: 'fr' }), false)
      ).toBe('');
      expect(
        // @ts-expect-error Intentionally pass a boolean to verify runtime fallback.
        selectMessageByLocale(makeFakeI18n({ language: 'fr' }), true)
      ).toBe('');
    });
  });
});
