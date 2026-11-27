import '@lingui/core/i18n';

// Module augmentation for GDevelop's @lingui/core & @lingui/react runtime extensions.
declare module '@lingui/core/i18n' {
  interface I18n {
    // Allow passing a MessageDescriptor | string union directly (instead of separate overloads)
    // and expose Lingui v2 date/number formatters used by GDevelop's fork.
    _(
      id: string | MessageDescriptor,
      values?: object,
      messageOptions?: MessageOptions
    ): string;
    date(
      value: string | Date | number,
      format?: Intl.DateTimeFormatOptions
    ): string;
    number(value: number, format?: Intl.NumberFormatOptions | string): string;
  }
}

export {};
