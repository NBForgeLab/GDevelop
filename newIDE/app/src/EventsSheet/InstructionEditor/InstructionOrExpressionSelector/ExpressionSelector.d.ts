import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type ExpressionTreeNode } from '../../../InstructionOrExpression/CreateTree';
import { type EnumeratedExpressionMetadata } from '../../../InstructionOrExpression/EnumeratedInstructionOrExpressionMetadata';
import { type EventsScope } from '../../../InstructionOrExpression/EventsScope';

export type Props = {
  expressionType: string;
  focusOnMount?: boolean;
  selectedType: string;
  onChoose: (type: string, metadata: EnumeratedExpressionMetadata) => void;
  scope: EventsScope;
  i18n: I18nType;
};

export default class ExpressionSelector extends React.Component<Props> {
  instructionsInfo: Array<EnumeratedExpressionMetadata>;
  instructionsInfoTree: ExpressionTreeNode;
}
