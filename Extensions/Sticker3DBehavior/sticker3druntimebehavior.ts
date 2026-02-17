/*
GDevelop - Sticker3D Behavior Extension
Copyright (c) 2024 GDevelop Team
This project is released under the MIT License.
*/

namespace gdjs {
  /**
   * Sticks a 3D object to another 3D object, making it follow the stuck-to 3D object's
   * position and optionally rotation.
   * @category Behaviors > 3D Sticker
   */
  export class Sticker3DRuntimeBehavior extends gdjs.RuntimeBehavior {
    // Configuration
    private _offsetX: float = 0;
    private _offsetY: float = 0;
    private _offsetZ: float = 0;
    private _followRotation: boolean = true;
    private _destroyWithStuckToObject: boolean = false;

    // State
    private _stuckToObject: gdjs.RuntimeObject | null = null;
    private _isStuck: boolean = false;
    
    // Store previous stuck-to 3D object rotation to detect changes
    private _lastStuckToRotationX: float = 0;
    private _lastStuckToRotationY: float = 0;
    private _lastStuckToRotationZ: float = 0;

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      behaviorData: any,
      owner: gdjs.RuntimeObject
    ) {
      super(instanceContainer, behaviorData, owner);
      
      this._followRotation = behaviorData.followRotation !== undefined 
        ? behaviorData.followRotation 
        : true;
      this._destroyWithStuckToObject = behaviorData.destroyWithStuckToObject !== undefined
        ? behaviorData.destroyWithStuckToObject
        : false;
    }

    override applyBehaviorOverriding(behaviorData: any): boolean {
      if (behaviorData.followRotation !== undefined) {
        this._followRotation = behaviorData.followRotation;
      }
      if (behaviorData.destroyWithStuckToObject !== undefined) {
        this._destroyWithStuckToObject = behaviorData.destroyWithStuckToObject;
      }
      return true;
    }

    override onActivate(): void {
      // Behavior activated - stick will be set via action
    }

    override onDeActivate(): void {
      // Keep the stick information but stop updating
    }

    override doStepPreEvents(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      if (!this._isStuck || !this._stuckToObject || !this._stuckToObject.isIncludedInParentCollisionMask()) {
        // Stuck-to 3D object doesn't exist or was deleted
        if (this._isStuck) {
          if (this._destroyWithStuckToObject) {
            // Destroy this 3D object when the stuck-to 3D object is destroyed
            this.owner.deleteFromScene(instanceContainer);
            return;
          }
          this.unstick();
        }
        return;
      }

      const owner = this.owner;
      const stuckToObject = this._stuckToObject;

      // Get stuck-to 3D object's current position
      const stuckToX = stuckToObject.getX();
      const stuckToY = stuckToObject.getY();
      
      // Check if stuck-to 3D object has 3D capabilities
      let stuckToZ = 0;
      let stuckToRotationX = 0;
      let stuckToRotationY = 0;
      let stuckToRotationZ = stuckToObject.getAngle();

      if (gdjs.Base3DHandler && gdjs.Base3DHandler.is3D(stuckToObject)) {
        stuckToZ = stuckToObject.getZ();
        stuckToRotationX = stuckToObject.getRotationX();
        stuckToRotationY = stuckToObject.getRotationY();
      }

      // Calculate absolute target position based on stuck-to 3D object position + offset
      // This approach eliminates floating-point drift and ensures offsets are always applied
      const targetX = stuckToX + this._offsetX;
      const targetY = stuckToY + this._offsetY;
      const targetZ = stuckToZ + this._offsetZ;

      // Update this object's position to the target position
      owner.setX(targetX);
      owner.setY(targetY);
      
      if (gdjs.Base3DHandler && gdjs.Base3DHandler.is3D(owner)) {
        owner.setZ(targetZ);
      }

      // Update rotation if following rotation
      if (this._followRotation) {
        // Calculate rotation deltas to apply incremental changes
        // This preserves any manual rotation adjustments made between frames
        let deltaRotationZ = stuckToRotationZ - this._lastStuckToRotationZ;
        
        // Normalize angle delta to [-180, 180] to handle wrapping correctly
        // Example: 350° → 10° should be +20°, not -340°
        while (deltaRotationZ > 180) deltaRotationZ -= 360;
        while (deltaRotationZ < -180) deltaRotationZ += 360;
        
        if (deltaRotationZ !== 0) {
          owner.setAngle(owner.getAngle() + deltaRotationZ);
        }

        if (gdjs.Base3DHandler && gdjs.Base3DHandler.is3D(stuckToObject) && gdjs.Base3DHandler.is3D(owner)) {
          let deltaRotationX = stuckToRotationX - this._lastStuckToRotationX;
          let deltaRotationY = stuckToRotationY - this._lastStuckToRotationY;
          
          // Normalize X and Y rotation deltas as well
          while (deltaRotationX > 180) deltaRotationX -= 360;
          while (deltaRotationX < -180) deltaRotationX += 360;
          while (deltaRotationY > 180) deltaRotationY -= 360;
          while (deltaRotationY < -180) deltaRotationY += 360;
          
          if (deltaRotationX !== 0) {
            owner.setRotationX(owner.getRotationX() + deltaRotationX);
          }
          if (deltaRotationY !== 0) {
            owner.setRotationY(owner.getRotationY() + deltaRotationY);
          }
        }
      }

      // Store current rotation for next frame delta calculation
      this._lastStuckToRotationX = stuckToRotationX;
      this._lastStuckToRotationY = stuckToRotationY;
      this._lastStuckToRotationZ = stuckToRotationZ;
    }

    /**
     * Stick this 3D object to another 3D object.
     * @param targetObject The 3D object to stick to
     */
    stickToObject(targetObject: gdjs.RuntimeObject): void {
      if (!targetObject) {
        return;
      }

      this._stuckToObject = targetObject;
      this._isStuck = true;

      // Calculate and store initial offset based on current positions
      const owner = this.owner;
      this._offsetX = owner.getX() - targetObject.getX();
      this._offsetY = owner.getY() - targetObject.getY();

      if (gdjs.Base3DHandler && gdjs.Base3DHandler.is3D(owner) && gdjs.Base3DHandler.is3D(targetObject)) {
        this._offsetZ = owner.getZ() - targetObject.getZ();
      } else {
        this._offsetZ = 0;
      }

      // Store initial rotation for delta calculation
      this._lastStuckToRotationZ = targetObject.getAngle();

      if (gdjs.Base3DHandler && gdjs.Base3DHandler.is3D(targetObject)) {
        this._lastStuckToRotationX = targetObject.getRotationX();
        this._lastStuckToRotationY = targetObject.getRotationY();
      } else {
        this._lastStuckToRotationX = 0;
        this._lastStuckToRotationY = 0;
      }
    }

    /**
     * Unstick from the current stuck-to 3D object.
     */
    unstick(): void {
      this._stuckToObject = null;
      this._isStuck = false;
    }

    /**
     * Check if this 3D object is currently stuck to another 3D object.
     * @returns true if stuck, false otherwise
     */
    isStuck(): boolean {
      return this._isStuck && this._stuckToObject !== null;
    }

    /**
     * Set the X offset from the stuck-to 3D object.
     * @param offsetX The X offset
     */
    setOffsetX(offsetX: float): void {
      this._offsetX = offsetX;
    }

    /**
     * Set the Y offset from the stuck-to 3D object.
     * @param offsetY The Y offset
     */
    setOffsetY(offsetY: float): void {
      this._offsetY = offsetY;
    }

    /**
     * Set the Z offset from the stuck-to 3D object.
     * @param offsetZ The Z offset
     */
    setOffsetZ(offsetZ: float): void {
      this._offsetZ = offsetZ;
    }

    /**
     * Get the X offset from the stuck-to 3D object.
     * @returns The X offset
     */
    getOffsetX(): float {
      return this._offsetX;
    }

    /**
     * Get the Y offset from the stuck-to 3D object.
     * @returns The Y offset
     */
    getOffsetY(): float {
      return this._offsetY;
    }

    /**
     * Get the Z offset from the stuck-to 3D object.
     * @returns The Z offset
     */
    getOffsetZ(): float {
      return this._offsetZ;
    }

    /**
     * Set whether to follow the rotation of the stuck-to 3D object.
     * @param follow true to follow rotation, false otherwise
     */
    setFollowRotation(follow: boolean): void {
      this._followRotation = follow;
    }

    /**
     * Check if this 3D object follows the rotation of the stuck-to 3D object.
     * @returns true if following rotation, false otherwise
     */
    followsRotation(): boolean {
      return this._followRotation;
    }
  }

  gdjs.registerBehavior(
    'Sticker3DBehavior::Sticker3DBehavior',
    gdjs.Sticker3DRuntimeBehavior
  );
}

