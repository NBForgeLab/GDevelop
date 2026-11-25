import React from 'react';
import {
  type AssetShortHeader,
  type Asset,
  type Environment,
} from '../../Utils/GDevelopServices/Asset';
import { type AddAssetOutput, type InstallAssetArgs } from '../InstallAsset';

export type PrivateAssetsState = {
  authorizationToken: string | null | undefined;
  updateAuthorizationToken: () => Promise<void>;
  fetchPrivateAsset: (
    assetShortHeader: AssetShortHeader,
    options: {
      environment: Environment;
    }
  ) => Promise<Asset | null | undefined>;
  installPrivateAsset: (
    options: InstallAssetArgs
  ) => Promise<AddAssetOutput | null | undefined>;
  getPrivateAssetPackAudioArchiveUrl: (
    privateAssetPackId: string
  ) => Promise<string | null>;
};

const initialPrivateAssetsState: PrivateAssetsState = {
  authorizationToken: null,
  updateAuthorizationToken: async () => {},
  fetchPrivateAsset: async (assetShortHeader, options) => null,
  installPrivateAsset: async (options) => null,
  getPrivateAssetPackAudioArchiveUrl: async (id) => null,
};

const PrivateAssetsAuthorizationContext: React.Context<PrivateAssetsState> =
  React.createContext<PrivateAssetsState>(initialPrivateAssetsState);

export default PrivateAssetsAuthorizationContext;
