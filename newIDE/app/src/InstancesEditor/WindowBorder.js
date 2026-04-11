// @flow
import * as THREE from 'three';
import Rectangle from '../Utils/Rectangle';

type Props = {|
  project: gdProject,
  layout: gdLayout | null,
  eventsBasedObjectVariant: gdEventsBasedObjectVariant | null,
  toCanvasCoordinates: (x: number, y: number) => [number, number],
|};

export default class WindowBorder {
  project: gdProject;
  layout: gdLayout | null;
  eventsBasedObjectVariant: gdEventsBasedObjectVariant | null;
  toCanvasCoordinates: (x: number, y: number) => [number, number];

  threeGroup: THREE.Group = new THREE.Group();
  _line: THREE.LineSegments | null = null;

  constructor({
    project,
    layout,
    eventsBasedObjectVariant,
    toCanvasCoordinates,
  }: Props) {
    this.project = project;
    this.layout = layout;
    this.eventsBasedObjectVariant = eventsBasedObjectVariant;
    this.toCanvasCoordinates = toCanvasCoordinates;

    // Create shared geometry for the border
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    });
    this._line = new THREE.LineSegments(geometry, material);
    this.threeGroup.add(this._line);
  }

  getThreeObject(): THREE.Group {
    return this.threeGroup;
  }

  render() {
    if (!this._line) return;

    let width = 800;
    let height = 600;

    if (this.layout) {
      width = this.project.getGameResolutionWidth();
      height = this.project.getGameResolutionHeight();
    } else if (this.eventsBasedObjectVariant) {
      // Fallback for objects
    }

    const pos1 = this.toCanvasCoordinates(0, 0);
    const pos2 = this.toCanvasCoordinates(width, height);

    const x = pos1[0];
    const y = pos1[1];
    const w = pos2[0] - x;
    const h = pos2[1] - y;

    this._line.position.set(x, y, 0);
    this._line.scale.set(w, h, 1);
  }
}
