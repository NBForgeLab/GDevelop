// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import * as THREE from 'three';
import { rgbOrHexToHexNumber } from '../../Utils/ColorTransformer';
const gd: libGDevelop = global.gd;

/**
 * Renderer for a ParticleEmitter object.
 * Displays a spray cone visualization based on the emitter settings
 * plus a center dot colored by particle color.
 */
export default class RenderedParticleEmitterInstance extends RenderedInstance {
  _material: any;
  _coneLine: THREE.LineSegments | null = null;
  _coneMaterial: THREE.LineBasicMaterial | null = null;
  _dotMesh: THREE.Mesh | null = null;
  _dotMaterial: THREE.MeshBasicMaterial | null = null;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    // $FlowFixMe[value-as-type]
    threeGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>
  ) {
    super(
      project,
      instance,
      associatedObjectConfiguration,
      threeGroup,
      resourcesLoader
    );

    // Create the cone line visualization for the spray angle
    this._coneMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
    });
    const coneGeometry = new THREE.BufferGeometry();
    // 2 lines = 4 vertices (line1 start, line1 end, line2 start, line2 end)
    const conePositions = new Float32Array(4 * 3);
    coneGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(conePositions, 3)
    );
    this._coneLine = new THREE.LineSegments(coneGeometry, this._coneMaterial);
    this._coneLine.userData.instance = instance;

    // Create the center dot (circle approximated by a small sphere/circle geometry)
    const dotGeometry = new THREE.CircleGeometry(8, 16);
    this._dotMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true,
    });
    this._dotMesh = new THREE.Mesh(dotGeometry, this._dotMaterial);
    this._dotMesh.userData.instance = instance;

    // Group them together as the main Three.js object
    this._threeObject = new THREE.Group();
    this._threeObject.userData.instance = instance;
    this._threeObject.add(this._coneLine);
    this._threeObject.add(this._dotMesh);

    this._layerGroup.add(this._threeObject);
    this.update();
  }

  onRemovedFromScene(): void {
    if (this._threeObject) {
      this._layerGroup.remove(this._threeObject);
    }
    if (this._coneLine) {
      if (this._coneLine.geometry) this._coneLine.geometry.dispose();
      this._coneLine = null;
    }
    if (this._coneMaterial) {
      this._coneMaterial.dispose();
      this._coneMaterial = null;
    }
    if (this._dotMesh) {
      if (this._dotMesh.geometry) this._dotMesh.geometry.dispose();
      this._dotMesh = null;
    }
    if (this._dotMaterial) {
      this._dotMaterial.dispose();
      this._dotMaterial = null;
    }
    if (this._threeObject) {
      this._threeObject.userData.instance = null;
      this._threeObject = null;
    }
    this._wasDestroyed = true;
  }

  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ThreeResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): any {
    return 'CppPlatform/Extensions/particleSystemicon.png';
  }

  update() {
    if (!this._threeObject) return;

    this._threeObject.position.x = this._instance.getX();
    this._threeObject.position.y = this._instance.getY();

    // Do not hide completely an object so it can still be manipulated
    const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);

    this._updateGraphics();

    if (this._coneMaterial) {
      this._coneMaterial.opacity = alphaForDisplay;
      this._coneMaterial.transparent = alphaForDisplay < 1;
    }
    if (this._dotMaterial) {
      this._dotMaterial.opacity = alphaForDisplay;
    }
  }

  /**
   * Render the preview of the particle emitter according to the setup of the object.
   * Draws two lines representing the spray cone and a center dot.
   */
  _updateGraphics() {
    const particleEmitterConfiguration = gd.asParticleEmitterConfiguration(
      this._associatedObjectConfiguration
    );

    const emitterAngle = (this._instance.getAngle() / 180) * Math.PI;
    const sprayConeAngle = particleEmitterConfiguration.getConeSprayAngle();
    const line1Angle = emitterAngle - (sprayConeAngle / 2.0 / 180.0) * Math.PI;
    const line2Angle = emitterAngle + (sprayConeAngle / 2.0 / 180.0) * Math.PI;
    const length = 64;

    // Update cone line color based on particle color 2
    if (this._coneMaterial) {
      this._coneMaterial.color.setHex(
        rgbOrHexToHexNumber(particleEmitterConfiguration.getParticleColor2())
      );
    }

    // Update cone line geometry
    if (this._coneLine) {
      const positions = this._coneLine.geometry.getAttribute('position');
      const p = positions.array;

      // Line 1: origin → direction based on line1Angle
      p[0] = 0;
      p[1] = 0;
      p[2] = 0;
      p[3] = Math.cos(line1Angle) * length;
      p[4] = Math.sin(line1Angle) * length;
      p[5] = 0;

      // Line 2: origin → direction based on line2Angle
      p[6] = 0;
      p[7] = 0;
      p[8] = 0;
      p[9] = Math.cos(line2Angle) * length;
      p[10] = Math.sin(line2Angle) * length;
      p[11] = 0;

      positions.needsUpdate = true;
    }

    // Update dot color based on particle color 1
    if (this._dotMaterial) {
      this._dotMaterial.color.setHex(
        rgbOrHexToHexNumber(particleEmitterConfiguration.getParticleColor1())
      );
    }
  }

  getDefaultWidth(): any {
    return 128;
  }

  getDefaultHeight(): any {
    return 128;
  }

  getOriginX(): any {
    return 64;
  }

  getOriginY(): any {
    return 64;
  }
}
