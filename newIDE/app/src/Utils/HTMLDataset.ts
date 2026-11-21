import { toKebabCase } from './StringHelpers';

export interface HTMLDataset {
  [key: string]: string | null | undefined;
}

export const dataObjectToProps = (
  object: HTMLDataset | null | undefined
): Record<string, string> | undefined =>
  object
    ? Object.entries(object).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          if (value) {
            acc[`data-${toKebabCase(key)}`] = value;
          }
          return acc;
        },
        {}
      )
    : undefined;
