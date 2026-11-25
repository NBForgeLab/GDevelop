import * as React from 'react';
import { instructionDeprecatedParameter } from './ClassNames';

type Props = {
  children: React.ReactNode;
};

/**
 * Displayed when a parameter uses a deprecated expression
 */
const DeprecatedParameterValue = ({
  children,
}: Props): React.ReactElement<any> => (
  <span className={instructionDeprecatedParameter}>{children}</span>
);

export default DeprecatedParameterValue;
