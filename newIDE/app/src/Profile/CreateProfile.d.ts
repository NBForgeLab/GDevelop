import * as React from 'react';

type Props = {
  message?: React.ReactNode;
  onOpenLoginDialog: () => void;
  onOpenCreateAccountDialog: () => void;
  justifyContent?: 'center';
};

declare const CreateProfile: React.ComponentType<Props>;

export default CreateProfile;
