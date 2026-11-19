import type { SerializerElement } from '../../../../GDevelop.js/types';

export function copyBinarySnapshot(element: SerializerElement): Uint8Array {
  using snapshot = gd.createOwnedBinarySnapshot(element);
  return snapshot.copyBytes();
}
