import * as React from 'react';
import { type EffectTarget } from '../Utils/GDevelopServices/Asset';
import { type PrivateGameTemplateListingData } from '../Utils/GDevelopServices/Shop';

type Props = {
  onlyShowAssets?: boolean;
  displayPromotions?: boolean;
  onOpenPrivateGameTemplateListingData?: (
    privateGameTemplateListingData: PrivateGameTemplateListingData
  ) => void;
  onOpenProfile?: () => void;
  courses?: Array<Record<string, any>> | null;
  onCourseOpen?: (courseId: string) => void;
  getCourseCompletion?: (courseId: string) => Record<string, any> | null;
  assetSwappedObject?: gdObject | null;
  fixedObjectTypes?: Array<string> | null;
  fixedEffectTarget?: EffectTarget;
  noResultsPlaceholder?: React.ReactNode;
};

export type AssetStoreInterface = {
  onClose: () => void;
};

export declare const AssetStore: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<AssetStoreInterface>
>;
