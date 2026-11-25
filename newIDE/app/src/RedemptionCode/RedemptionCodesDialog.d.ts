import * as React from 'react';

export type Props = {
  onClose: () => void;
  onSelectCode?: (code: string) => void;
};

declare const RedemptionCodesDialog: React.ComponentType<Props>;
export default RedemptionCodesDialog;
