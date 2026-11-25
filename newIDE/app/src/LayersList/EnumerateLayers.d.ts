declare const enumerateLayers: (layersContainer: gdLayersContainer) => Array<{
  value: string;
  label: string;
  labelIsUserDefined: boolean;
}>;

export default enumerateLayers;
