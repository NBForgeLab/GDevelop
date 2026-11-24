import VersionMetadata from './VersionMetadata';
import semverGreaterThan from 'semver/functions/gt';

export const getIDEVersion = (): string => VersionMetadata.version;
export const getIDEVersionWithHash = (): string =>
  VersionMetadata.versionWithHash;

let gdCoreVersionString = '';
export const getGDCoreVersion = (): string => {
  if (gdCoreVersionString) return gdCoreVersionString;

  const gd = (global as typeof globalThis & { gd?: libGDevelop }).gd;
  gdCoreVersionString = gd ? gd.VersionWrapper.fullString() : 'Unknown';
  return gdCoreVersionString;
};

export const shouldHideExtension = (
  project: gdProject,
  extension: gdPlatformExtension
): boolean => {
  const initialGDVersion = project.getInitialGDVersion();
  return (
    !!initialGDVersion &&
    extension.isDeprecated() &&
    !semverGreaterThan(extension.getDeprecationGDVersion(), initialGDVersion)
  );
};
