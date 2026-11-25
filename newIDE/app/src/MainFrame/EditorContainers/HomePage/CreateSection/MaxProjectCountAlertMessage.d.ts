import * as React from 'react';
import { type AuthenticatedUser } from '../../../../Profile/AuthenticatedUserContext';

type Props = {
  margin?: 'dense';
};

export declare const checkIfHasTooManyCloudProjects: (
  authenticatedUser: AuthenticatedUser
) => boolean;

export declare const MaxProjectCountAlertMessage: React.ComponentType<Props>;
