namespace gdjs {
  /**
   * Behavior that allows controlling individual bones in a 3D model.
   * @category Behaviors > 3D Model
   */
  export class BoneControlRuntimeBehavior extends gdjs.RuntimeBehavior {
    private _model3DObject: gdjs.Model3DRuntimeObject | null = null;
    private _bonesMap: Map<string, THREE.Bone> = new Map();

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      behaviorData: any,
      owner: gdjs.RuntimeObject
    ) {
      super(instanceContainer, behaviorData, owner);
      
      // Check if the owner is a Model3D object
      if (owner instanceof gdjs.Model3DRuntimeObject) {
        this._model3DObject = owner;
      }
    }

    onActivate() {
      this._buildBonesMap();
    }

    onDeActivate() {
      this._bonesMap.clear();
    }

    /**
     * Build a map of all bones in the model for quick access.
     */
    private _buildBonesMap(): void {
      if (!this._model3DObject) return;

      this._bonesMap.clear();
      const renderer = this._model3DObject.getRenderer() as any;
      if (!renderer || !renderer.getThreeObject) return;

      const threeObject = renderer.getThreeObject();
      threeObject.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Bone) {
          this._bonesMap.set(child.name, child);
        }
      });
    }

    /**
     * Check if a bone exists in the model.
     * @param boneName The name of the bone
     * @returns True if the bone exists
     */
    hasBone(boneName: string): boolean {
      return this._bonesMap.has(boneName);
    }

    /**
     * Get the number of bones in the model.
     * @returns The number of bones
     */
    getBonesCount(): number {
      return this._bonesMap.size;
    }

    /**
     * Set bone position.
     * @param boneName The name of the bone
     * @param x X position
     * @param y Y position
     * @param z Z position
     */
    setBonePosition(boneName: string, x: number, y: number, z: number): void {
      const bone = this._bonesMap.get(boneName);
      if (bone) {
        bone.position.set(x, y, z);
      }
    }

    /**
     * Get bone X position.
     * @param boneName The name of the bone
     * @returns X position
     */
    getBonePositionX(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? bone.position.x : 0;
    }

    /**
     * Get bone Y position.
     * @param boneName The name of the bone
     * @returns Y position
     */
    getBonePositionY(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? bone.position.y : 0;
    }

    /**
     * Get bone Z position.
     * @param boneName The name of the bone
     * @returns Z position
     */
    getBonePositionZ(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? bone.position.z : 0;
    }

    /**
     * Set bone rotation in degrees.
     * @param boneName The name of the bone
     * @param rotationX Rotation around X axis in degrees
     * @param rotationY Rotation around Y axis in degrees
     * @param rotationZ Rotation around Z axis in degrees
     */
    setBoneRotation(
      boneName: string,
      rotationX: number,
      rotationY: number,
      rotationZ: number
    ): void {
      const bone = this._bonesMap.get(boneName);
      if (bone) {
        bone.rotation.set(
          gdjs.toRad(rotationX),
          gdjs.toRad(rotationY),
          gdjs.toRad(rotationZ)
        );
      }
    }

    /**
     * Get bone X rotation in degrees.
     * @param boneName The name of the bone
     * @returns X rotation in degrees
     */
    getBoneRotationX(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? gdjs.toDegrees(bone.rotation.x) : 0;
    }

    /**
     * Get bone Y rotation in degrees.
     * @param boneName The name of the bone
     * @returns Y rotation in degrees
     */
    getBoneRotationY(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? gdjs.toDegrees(bone.rotation.y) : 0;
    }

    /**
     * Get bone Z rotation in degrees.
     * @param boneName The name of the bone
     * @returns Z rotation in degrees
     */
    getBoneRotationZ(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? gdjs.toDegrees(bone.rotation.z) : 0;
    }

    /**
     * Set bone scale.
     * @param boneName The name of the bone
     * @param scaleX Scale on X axis
     * @param scaleY Scale on Y axis
     * @param scaleZ Scale on Z axis
     */
    setBoneScale(
      boneName: string,
      scaleX: number,
      scaleY: number,
      scaleZ: number
    ): void {
      const bone = this._bonesMap.get(boneName);
      if (bone) {
        bone.scale.set(scaleX, scaleY, scaleZ);
      }
    }

    /**
     * Get bone X scale.
     * @param boneName The name of the bone
     * @returns X scale
     */
    getBoneScaleX(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? bone.scale.x : 1;
    }

    /**
     * Get bone Y scale.
     * @param boneName The name of the bone
     * @returns Y scale
     */
    getBoneScaleY(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? bone.scale.y : 1;
    }

    /**
     * Get bone Z scale.
     * @param boneName The name of the bone
     * @returns Z scale
     */
    getBoneScaleZ(boneName: string): number {
      const bone = this._bonesMap.get(boneName);
      return bone ? bone.scale.z : 1;
    }

    /**
     * Reset bone to its original transformation.
     * @param boneName The name of the bone
     */
    resetBone(boneName: string): void {
      const bone = this._bonesMap.get(boneName);
      if (bone) {
        bone.position.set(0, 0, 0);
        bone.rotation.set(0, 0, 0);
        bone.scale.set(1, 1, 1);
      }
    }

    /**
     * Get bone world position.
     * @param boneName The name of the bone
     * @returns World position as [x, y, z]
     */
    getBoneWorldPosition(boneName: string): [number, number, number] {
      const bone = this._bonesMap.get(boneName);
      if (bone) {
        const worldPos = new THREE.Vector3();
        bone.getWorldPosition(worldPos);
        return [worldPos.x, worldPos.y, worldPos.z];
      }
      return [0, 0, 0];
    }

    /**
     * Get bone world rotation in degrees.
     * @param boneName The name of the bone
     * @returns World rotation as [x, y, z] in degrees
     */
    getBoneWorldRotation(boneName: string): [number, number, number] {
      const bone = this._bonesMap.get(boneName);
      if (bone) {
        const worldQuat = new THREE.Quaternion();
        bone.getWorldQuaternion(worldQuat);
        const euler = new THREE.Euler().setFromQuaternion(worldQuat);
        return [
          gdjs.toDegrees(euler.x),
          gdjs.toDegrees(euler.y),
          gdjs.toDegrees(euler.z)
        ];
      }
      return [0, 0, 0];
    }
  }

  gdjs.registerBehavior('BoneControl::BoneControlBehavior', gdjs.BoneControlRuntimeBehavior);
}
