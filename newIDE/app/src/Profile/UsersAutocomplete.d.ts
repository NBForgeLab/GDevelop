import * as React from 'react';

type Props = {
  userIds: Array<string>;
  onChange: (value: Array<{ userId: string; username: string }>) => void;
  floatingLabelText?: React.ReactNode;
  helperText: React.ReactNode;
  disabled?: boolean;
};

export declare const UsersAutocomplete: React.ComponentType<Props>;
