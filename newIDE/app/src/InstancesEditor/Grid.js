// @flow
import * as THREE from 'three';
import ViewPosition from './ViewPosition';
import { type InstancesEditorSettings } from './InstancesEditorSettings';

type Props = {|
  viewPosition: ViewPosition,
  instancesEditorSettings: InstancesEditorSettings,
|};

export default class Grid {
  threeGroup = new THREE.Group();
  instancesEditorSettings: InstancesEditorSettings;
  viewPosition: ViewPosition;
  _lines: THREE.LineSegments | null = null;

  constructor({ viewPosition, instancesEditorSettings }: Props) {
    this.viewPosition = viewPosition;
    this.instancesEditorSettings = instancesEditorSettings;
  }

  setInstancesEditorSettings(instancesEditorSettings: InstancesEditorSettings) {
    this.instancesEditorSettings = instancesEditorSettings;
    this._updateGrid();
  }

  getThreeObject(): THREE.Group {
    return this.threeGroup;
  }

  _updateGrid() {
    // Remove old lines
    if (this._lines) {
      this.threeGroup.remove(this._lines);
      this._lines.geometry.dispose();
      if (Array.isArray(this._lines.material)) {
        this._lines.material.forEach(m => m.dispose());
      } else {
        this._lines.material.dispose();
      }
      this._lines = null;
    }

    if (!this.instancesEditorSettings.grid) return;

    const {
      gridWidth,
      gridHeight,
      gridColor,
      gridAlpha,
      gridOffsetX,
      gridOffsetY,
    } = this.instancesEditorSettings;

    if (gridWidth <= 0 || gridHeight <= 0) return;

    const vertices = [];
    const size = 10000; // Large enough area
    const halfSize = size / 2;

    // Vertical lines
    for (let x = -halfSize; x <= halfSize; x += gridWidth) {
      const drawX = x + (gridOffsetX % gridWidth);
      vertices.push(drawX, -halfSize, 0);
      vertices.push(drawX, halfSize, 0);
    }

    // Horizontal lines
    for (let y = -halfSize; y <= halfSize; y += gridHeight) {
      const drawY = y + (gridOffsetY % gridHeight);
      vertices.push(-halfSize, drawY, 0);
      vertices.push(halfSize, drawY, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.LineBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: gridAlpha,
      depthWrite: false,
    });

    this._lines = new THREE.LineSegments(geometry, material);
    this.threeGroup.add(this._lines);
  }

  render() {
    // In a real editor, we might want to shift the grid as the camera moves
    // to give an "infinite" feel, but for now fixed large area is okay.
    if (!this._lines && this.instancesEditorSettings.grid) {
      this._updateGrid();
    }
  }
}
