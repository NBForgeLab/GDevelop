/**
 * Camera system for managing 2D and 3D cameras.
 * 
 * @category Renderers > Camera
 */
namespace gdjs {
  /**
   * Camera system for managing 2D and 3D cameras.
   * @category Renderers > Camera
   */
  export class CameraSystem {
    private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    private _cameraType: gdjs.RuntimeLayerCameraType;
    private _zoom: number = 1;
    private _viewportWidth: number;
    private _viewportHeight: number;
    private _baseFov: number = 45;

    /**
     * @param type The camera type (orthographic or perspective)
     * @param width The viewport width
     * @param height The viewport height
     */
    constructor(
      type: gdjs.RuntimeLayerCameraType,
      width: number = 800,
      height: number = 600
    ) {
      this._cameraType = type;
      this._viewportWidth = width;
      this._viewportHeight = height;

      if (type === gdjs.RuntimeLayerCameraType.ORTHOGRAPHIC) {
        this._camera = new THREE.OrthographicCamera(
          -width / 2,
          width / 2,
          height / 2,
          -height / 2,
          0.1,
          1000
        );
        this._camera.position.z = 500;
      } else {
        this._camera = new THREE.PerspectiveCamera(
          this._baseFov, // FOV
          width / height, // Aspect ratio
          0.1, // Near
          2000 // Far
        );
      }

      this._camera.rotation.order = 'ZYX';
    }

    /**
     * Update the camera position.
     */
    updatePosition(x: number, y: number, z: number): void {
      this._camera.position.set(x, -y, z); // Y is negated for GDevelop coordinate system
    }

    /**
     * Update the camera rotation.
     */
    updateRotation(x: number, y: number, z: number): void {
      this._camera.rotation.set(x, y, z);
    }

    /**
     * Set the camera zoom.
     */
    setZoom(zoom: number): void {
      this._zoom = Math.max(zoom, 0.01);

      if (this._camera instanceof THREE.OrthographicCamera) {
        this._camera.left = -this._viewportWidth / 2;
        this._camera.right = this._viewportWidth / 2;
        this._camera.top = this._viewportHeight / 2;
        this._camera.bottom = -this._viewportHeight / 2;
        this._camera.zoom = this._zoom;

        this._camera.updateProjectionMatrix();
      } else if (this._camera instanceof THREE.PerspectiveCamera) {
        this._camera.fov = this._baseFov / this._zoom;
        this._camera.updateProjectionMatrix();
      }
    }

    /**
     * Get the camera zoom.
     */
    getZoom(): number {
      return this._zoom;
    }

    /**
     * Set the camera field of view (perspective only).
     */
    setFOV(fov: number): void {
      if (this._camera instanceof THREE.PerspectiveCamera) {
        this._baseFov = Math.min(Math.max(fov, 1), 180);
        this._camera.fov = this._baseFov / this._zoom;
        this._camera.updateProjectionMatrix();
      }
    }

    /**
     * Get the camera field of view.
     */
    getFOV(): number {
      if (this._camera instanceof THREE.PerspectiveCamera) {
        return this._camera.fov;
      }
      return 0;
    }

    /**
     * Set the near plane distance.
     */
    setNearPlane(near: number): void {
      this._camera.near = Math.max(0.0001, near);
      this._camera.updateProjectionMatrix();
    }

    /**
     * Set the far plane distance.
     */
    setFarPlane(far: number): void {
      this._camera.far = Math.max(this._camera.near, far);
      this._camera.updateProjectionMatrix();
    }

    /**
     * Convert screen coordinates to world coordinates.
     */
    convertScreenToWorld(screenX: number, screenY: number): THREE.Vector3 {
      const normalizedX = (screenX / this._viewportWidth) * 2 - 1;
      const normalizedY = -(screenY / this._viewportHeight) * 2 + 1;

      if (this._camera instanceof THREE.OrthographicCamera) {
        return new THREE.Vector3(
          this._camera.position.x +
            normalizedX * (this._viewportWidth / (2 * this._zoom)),
          this._camera.position.y +
            normalizedY * (this._viewportHeight / (2 * this._zoom)),
          0
        );
      }

      const vector = new THREE.Vector3(normalizedX, normalizedY, 0.5);
      vector.unproject(this._camera);

      const dir = vector.sub(this._camera.position).normalize();
      const distance = -this._camera.position.z / dir.z;

      return this._camera.position.clone().add(dir.multiplyScalar(distance));
    }

    /**
     * Convert world coordinates to screen coordinates.
     */
    convertWorldToScreen(
      worldX: number,
      worldY: number,
      worldZ: number
    ): { x: number; y: number } {
      const vector = new THREE.Vector3(worldX, -worldY, worldZ);
      vector.project(this._camera);

      return {
        x: (vector.x * 0.5 + 0.5) * this._viewportWidth,
        y: (-vector.y * 0.5 + 0.5) * this._viewportHeight,
      };
    }

    /**
     * Get the Three.js camera.
     */
    getCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
      return this._camera;
    }

    /**
     * Get the camera type.
     */
    getCameraType(): gdjs.RuntimeLayerCameraType {
      return this._cameraType;
    }

    /**
     * Update the aspect ratio (perspective only).
     */
    setAspect(aspect: number): void {
      if (this._camera instanceof THREE.PerspectiveCamera) {
        this._camera.aspect = aspect;
        this._camera.updateProjectionMatrix();
      }
    }

    /**
     * Update the orthographic bounds (orthographic only).
     */
    setOrthographicBounds(
      left: number,
      right: number,
      top: number,
      bottom: number
    ): void {
      if (this._camera instanceof THREE.OrthographicCamera) {
        this._camera.left = left;
        this._camera.right = right;
        this._camera.top = top;
        this._camera.bottom = bottom;
        this._camera.updateProjectionMatrix();
      }
    }

    setViewportSize(width: number, height: number): void {
      this._viewportWidth = Math.max(width, 1);
      this._viewportHeight = Math.max(height, 1);

      if (this._camera instanceof THREE.OrthographicCamera) {
        this._camera.left = -this._viewportWidth / 2;
        this._camera.right = this._viewportWidth / 2;
        this._camera.top = this._viewportHeight / 2;
        this._camera.bottom = -this._viewportHeight / 2;
        this._camera.zoom = this._zoom;
      } else if (this._camera instanceof THREE.PerspectiveCamera) {
        this._camera.aspect = this._viewportWidth / this._viewportHeight;
      }

      this._camera.updateProjectionMatrix();
    }
  }
}
