import { type MessageDescriptor as LinguiMessageDescriptor } from '@lingui/core';

// MessageDescriptor is the result of calling "t" macro, or a plain string.
// It can be passed to i18n._
export type MessageDescriptor = LinguiMessageDescriptor | string;
