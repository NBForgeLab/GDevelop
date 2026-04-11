// @flow
import * as THREE from 'three';
import ViewPosition from './ViewPosition';
import { type InstancesEditorSettings } from './InstancesEditorSettings';

type Props = {|
  project: gdProject,
  instancesEditorSettings: InstancesEditorSettings,
  viewPosition: ViewPosition,
|};

export default class WindowMask {
  project: gdProject;
  instancesEditorSettings: InstancesEditorSettings;
  viewPosition: ViewPosition;

  threeGroup: THREE.Group = new THREE.Group();
  _masks: THREE.Mesh[] = [];

  constructor({ project, viewPosition, instancesEditorSettings }: Props) {
    this.project = project;
    this.viewPosition = viewPosition;
    this.instancesEditorSettings = instancesEditorSettings;

    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.translate(0.5, 0.5, 0);

    for (let i = 0; i < 4; i++) {
      const mask = new THREE.Mesh(geometry, material);
      this._masks.push(mask);
      this.threeGroup.add(mask);
    }
  }

  setInstancesEditorSettings(instancesEditorSettings: InstancesEditorSettings) {
    this.instancesEditorSettings = instancesEditorSettings;
  }

  getThreeObject(): THREE.Group {
    return this.threeGroup;
  }

  render() {
    if (!this.instancesEditorSettings.windowMask) {
      this.threeGroup.visible = false;
      return;
    }
    this.threeGroup.visible = true;

    const width = this.project.getGameResolutionWidth();
    const height = this.project.getGameResolutionHeight();
    const canvasWidth = this.viewPosition.getWidth();
    const canvasHeight = this.viewPosition.getHeight();

    const topLeft = this.viewPosition.toCanvasCoordinates(0, 0);
    const bottomRight = this.viewPosition.toCanvasCoordinates(width, height);

    const x = topLeft[0];
    const y = topLeft[1];
    const w = bottomRight[0] - x;
    const h = bottomRight[1] - y;

    // Top mask
    this._masks[0].position.set(0, 0, 0);
    this._masks[0].scale.set(canvasWidth, y, 1);

    // Bottom mask
    this._masks[1].position.set(0, y + h, 0);
    this._masks[1].scale.set(canvasWidth, canvasHeight - (y + h), 1);

    // Left mask
    this._masks[2].position.set(0, y, 0);
    this._masks[2].scale.set(x, h, 1);

    // Right mask
    this._masks[3].position.set(x + w, y, 0);
    this._masks[3].scale.set(canvasWidth - (x + w), h, 1);
  }
}
