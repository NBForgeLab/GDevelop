// @flow
import * as THREE from 'three';
import Rectangle from '../Utils/Rectangle';
import { rgbToHexNumber } from '../Utils/ColorTransformer';
import { type InstancesEditorSettings } from './InstancesEditorSettings';

type Props = {|
  project: gdProject,
  layout: gdLayout | null,
  eventsBasedObjectVariant: gdEventsBasedObjectVariant | null,
  toCanvasCoordinates: (x: number, y: number) => [number, number],
  instancesEditorSettings: InstancesEditorSettings,
|};

/**
 * Renders the game window border and origin crosshair in the scene editor,
 * using Three.js LineSegments. Replaces the old PixiJS Graphics-based implementation.
 */
export default class WindowBorder {
  project: gdProject;
  layout: gdLayout | null;
  eventsBasedObjectVariant: gdEventsBasedObjectVariant | null;
  toCanvasCoordinates: (x: number, y: number) => [number, number];
  windowRectangle: Rectangle = new Rectangle();
  instancesEditorSettings: InstancesEditorSettings;

  threeGroup: THREE.Group = new THREE.Group();
  _borderLine: THREE.LineSegments | null = null;
  _borderMaterial: THREE.LineBasicMaterial;
  _crosshairLine: THREE.LineSegments | null = null;
  _crosshairMaterial: THREE.LineBasicMaterial;

  constructor({
    project,
    layout,
    eventsBasedObjectVariant,
    toCanvasCoordinates,
    instancesEditorSettings,
  }: Props) {
    this.project = project;
    this.layout = layout;
    this.eventsBasedObjectVariant = eventsBasedObjectVariant;
    this.toCanvasCoordinates = toCanvasCoordinates;
    this.instancesEditorSettings = instancesEditorSettings;

    // Border material - color will be updated dynamically in render()
    this._borderMaterial = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: false,
    });

    // Create the rectangle border geometry (4 edges = 8 vertices for LineSegments)
    const borderGeometry = new THREE.BufferGeometry();
    // Placeholder positions, will be updated each frame in render()
    const borderPositions = new Float32Array(8 * 3); // 8 vertices × 3 components
    borderGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(borderPositions, 3)
    );
    this._borderLine = new THREE.LineSegments(
      borderGeometry,
      this._borderMaterial
    );
    this.threeGroup.add(this._borderLine);

    // Crosshair material (for eventsBasedObjectVariant origin marker)
    this._crosshairMaterial = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: false,
    });

    // Create the crosshair geometry (2 lines = 4 vertices for LineSegments)
    const crosshairGeometry = new THREE.BufferGeometry();
    const crosshairPositions = new Float32Array(4 * 3); // 4 vertices × 3 components
    crosshairGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(crosshairPositions, 3)
    );
    this._crosshairLine = new THREE.LineSegments(
      crosshairGeometry,
      this._crosshairMaterial
    );
    this._crosshairLine.visible = false; // Hidden by default
    this.threeGroup.add(this._crosshairLine);
  }

  getThreeObject(): THREE.Group {
    return this.threeGroup;
  }

  setShowObjectInstancesIn3D(showObjectInstancesIn3D: boolean) {
    // This method is kept for compatibility but no longer needed
    // as we now use instancesEditorSettings.gameEditorMode
  }

  setInstancesEditorSettings(instancesEditorSettings: InstancesEditorSettings) {
    this.instancesEditorSettings = instancesEditorSettings;
  }

  render() {
    if (!this._borderLine) return;

    const { layout, eventsBasedObjectVariant } = this;

    // Compute the window rectangle in scene coordinates
    this.windowRectangle.set(
      eventsBasedObjectVariant
        ? {
            left: eventsBasedObjectVariant.getAreaMinX(),
            top: eventsBasedObjectVariant.getAreaMinY(),
            right: eventsBasedObjectVariant.getAreaMaxX(),
            bottom: eventsBasedObjectVariant.getAreaMaxY(),
          }
        : {
            left: 0,
            top: 0,
            right: this.project.getGameResolutionWidth(),
            bottom: this.project.getGameResolutionHeight(),
          }
    );

    // Transform to canvas coordinates
    const topLeft = this.toCanvasCoordinates(
      this.windowRectangle.left,
      this.windowRectangle.top
    );
    const topRight = this.toCanvasCoordinates(
      this.windowRectangle.right,
      this.windowRectangle.top
    );
    const bottomRight = this.toCanvasCoordinates(
      this.windowRectangle.right,
      this.windowRectangle.bottom
    );
    const bottomLeft = this.toCanvasCoordinates(
      this.windowRectangle.left,
      this.windowRectangle.bottom
    );

    // Update border color based on layout background
    if (layout) {
      const backgroundRed = layout.getBackgroundColorRed();
      const backgroundBlue = layout.getBackgroundColorBlue();
      const backgroundGreen = layout.getBackgroundColorGreen();
      const isDark =
        Math.max(backgroundRed, backgroundBlue, backgroundGreen) < 128;
      this._borderMaterial.color.setHex(
        rgbToHexNumber(
          ((isDark ? 255 : 0) + backgroundRed) / 2,
          ((isDark ? 255 : 0) + backgroundBlue) / 2,
          ((isDark ? 255 : 0) + backgroundGreen) / 2
        )
      );
    } else {
      this._borderMaterial.color.setHex(0x888888);
    }

    // Always show rectangle border in 2D mode (instances-editor)
    // The 3D mode (embedded-game) uses InGameEditor which has its own rendering
    this._borderLine.visible = true;

    // Update border geometry positions
    const borderPositions = this._borderLine.geometry.getAttribute('position');
    const bp = borderPositions.array;
    // Edge 0: top-left → top-right
    bp[0] = topLeft[0];
    bp[1] = topLeft[1];
    bp[2] = 0;
    bp[3] = topRight[0];
    bp[4] = topRight[1];
    bp[5] = 0;
    // Edge 1: top-right → bottom-right
    bp[6] = topRight[0];
    bp[7] = topRight[1];
    bp[8] = 0;
    bp[9] = bottomRight[0];
    bp[10] = bottomRight[1];
    bp[11] = 0;
    // Edge 2: bottom-right → bottom-left
    bp[12] = bottomRight[0];
    bp[13] = bottomRight[1];
    bp[14] = 0;
    bp[15] = bottomLeft[0];
    bp[16] = bottomLeft[1];
    bp[17] = 0;
    // Edge 3: bottom-left → top-left
    bp[18] = bottomLeft[0];
    bp[19] = bottomLeft[1];
    bp[20] = 0;
    bp[21] = topLeft[0];
    bp[22] = topLeft[1];
    bp[23] = 0;
    borderPositions.needsUpdate = true;

    // Handle the origin crosshair for eventsBasedObjectVariant
    if (eventsBasedObjectVariant && this._crosshairLine) {
      this._crosshairLine.visible = true;

      const origin = this.toCanvasCoordinates(0, 0);
      const crosshairPositions = this._crosshairLine.geometry.getAttribute(
        'position'
      );
      const cp = crosshairPositions.array;
      // Horizontal line
      cp[0] = origin[0] - 8;
      cp[1] = origin[1];
      cp[2] = 0;
      cp[3] = origin[0] + 8;
      cp[4] = origin[1];
      cp[5] = 0;
      // Vertical line
      cp[6] = origin[0];
      cp[7] = origin[1] - 8;
      cp[8] = 0;
      cp[9] = origin[0];
      cp[10] = origin[1] + 8;
      cp[11] = 0;
      crosshairPositions.needsUpdate = true;
    } else if (this._crosshairLine) {
      this._crosshairLine.visible = false;
    }
  }
}
