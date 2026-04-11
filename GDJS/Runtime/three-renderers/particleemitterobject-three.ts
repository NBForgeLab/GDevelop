/*
 * GDevelop - Particle System Extension
 * Copyright (c) 2010-2016 Florian Rival (Florian.Rival@gmail.com)
 * This project is released under the MIT License.
 */

/**
 * Particle emitter renderer using Three.js.
 *
 * @category Renderers > Particle Emitter
 */
namespace gdjs {
  /**
   * Individual particle data structure.
   */
  type ParticleData = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    life: number;
    maxLife: number;
    startSize: number;
    endSize: number;
    startAlpha: number;
    endAlpha: number;
    startColor: THREE.Color;
    endColor: THREE.Color;
    rotation: number;
    rotationSpeed: number;
    active: boolean;
  };

  /**
   * The renderer for a gdjs.ParticleEmitterObject using Three.js.
   * @category Renderers > Particle Emitter
   */
  export class ParticleEmitterObjectThreeRenderer {
    private _runtimeObject: gdjs.ParticleEmitterObject;
    private _container: THREE.Group;
    private _particles: ParticleData[] = [];
    private _points: THREE.Points | null = null;
    private _geometry: THREE.BufferGeometry | null = null;
    private _material: THREE.PointsMaterial | null = null;
    private _started: boolean = false;
    private _emissionTimer: number = 0;
    private _emitterLife: number = 0;
    private _emit: boolean = false;
    private _helperGroup: THREE.Group | null = null;

    // Emitter configuration
    private _spawnPos: THREE.Vector3 = new THREE.Vector3();
    private _minAngle: number = 0;
    private _maxAngle: number = 0;
    private _minForce: number = 0;
    private _maxForce: number = 0;
    private _zoneRadius: number = 0;
    private _minLifeTime: number = 1;
    private _maxLifeTime: number = 1;
    private _gravity: THREE.Vector3 = new THREE.Vector3();
    private _startColor: THREE.Color = new THREE.Color(0xffffff);
    private _endColor: THREE.Color = new THREE.Color(0xffffff);
    private _startSize: number = 1;
    private _endSize: number = 1;
    private _startAlpha: number = 1;
    private _endAlpha: number = 1;
    private _minRotationSpeed: number = 0;
    private _maxRotationSpeed: number = 0;
    private _maxParticles: number = 100;
    private _frequency: number = 0.1;
    private _emitterLifetime: number = -1;
    private _additiveBlending: boolean = false;
    private _texture: THREE.Texture | null = null;

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      runtimeObject: gdjs.ParticleEmitterObject,
      objectData: gdjs.ParticleEmitterObjectData
    ) {
      this._runtimeObject = runtimeObject;
      this._container = new THREE.Group();

      // Initialize emitter configuration from object data
      this._initializeFromData(objectData, instanceContainer);

      // Create the particle system
      this._createParticleSystem();

      // Add to layer
      const layer = instanceContainer.getLayer(runtimeObject.getLayer());
      if (layer) {
        layer
          .getRenderer()
          .addRendererObject(this._container, runtimeObject.getZOrder());
      }

      // Start emission
      this.start();
    }

    private _initializeFromData(
      objectData: gdjs.ParticleEmitterObjectData,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      // Lifetime
      this._minLifeTime = objectData.particleLifeTimeMin;
      this._maxLifeTime = objectData.particleLifeTimeMax;

      // Flow and tank
      this._frequency = objectData.flow < 0 ? 0.0001 : 1.0 / objectData.flow;
      this._emitterLifetime = this._computeLifetime(
        objectData.flow,
        objectData.tank
      );

      // Force
      this._minForce = objectData.emitterForceMin;
      this._maxForce = objectData.emitterForceMax;

      // Zone radius
      this._zoneRadius = objectData.zoneRadius;

      // Gravity
      this._gravity.set(
        objectData.particleGravityX,
        objectData.particleGravityY,
        0
      );

      // Colors
      const color1 = gdjs.hexNumberToRGBArray(
        gdjs.rgbOrHexStringToNumber(objectData.particleColor1)
      );
      const color2 = gdjs.hexNumberToRGBArray(
        gdjs.rgbOrHexStringToNumber(objectData.particleColor2)
      );
      this._startColor.setRGB(
        color1[0] / 255,
        color1[1] / 255,
        color1[2] / 255
      );
      this._endColor.setRGB(color2[0] / 255, color2[1] / 255, color2[2] / 255);

      // Size
      this._startSize =
        (objectData.particleSize1 / 100) *
        (1 + objectData.particleSizeRandomness1 / 100);
      this._endSize =
        (objectData.particleSize2 / 100) *
        (1 + objectData.particleSizeRandomness2 / 100);

      // Alpha
      this._startAlpha = objectData.particleAlpha1 / 255.0;
      this._endAlpha = objectData.particleAlpha2 / 255.0;

      // Rotation
      this._minRotationSpeed = gdjs.toRad(objectData.particleAngle1);
      this._maxRotationSpeed = gdjs.toRad(objectData.particleAngle2);

      // Angle (spray cone)
      const emitterAngle = this._runtimeObject.getAngle();
      this._minAngle = gdjs.toRad(
        emitterAngle - objectData.emitterAngleB / 2.0
      );
      this._maxAngle = gdjs.toRad(
        emitterAngle + objectData.emitterAngleB / 2.0
      );

      // Max particles
      this._maxParticles = objectData.maxParticleNb;

      // Additive blending
      this._additiveBlending = objectData.additive;

      // Texture
      this._loadTexture(objectData, instanceContainer);
    }

    private _loadTexture(
      objectData: gdjs.ParticleEmitterObjectData,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      const imageManager = instanceContainer
        .getGame()
        .getImageManager() as gdjs.ThreeTextureImageManager;

      if (objectData.textureParticleName) {
        this._texture = imageManager.getThreeTexture(
          objectData.textureParticleName
        );
      }

      // Create default textures for Point and Line renderers
      if (!this._texture) {
        if (objectData.rendererType === 'Point') {
          this._texture = this._createDiskTexture(objectData.rendererParam1);
        } else if (objectData.rendererType === 'Line') {
          this._texture = this._createRectangleTexture(
            objectData.rendererParam1,
            objectData.rendererParam2
          );
        } else {
          this._texture = this._createRectangleTexture(
            objectData.rendererParam1,
            objectData.rendererParam2
          );
        }
      }
    }

    private _createDiskTexture(radius: number): THREE.Texture {
      const canvas = document.createElement('canvas');
      const size = Math.max(radius * 2, 2);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    }

    private _createRectangleTexture(
      width: number,
      height: number
    ): THREE.Texture {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    }

    private _createParticleSystem(): void {
      // Initialize particle data array
      this._particles = new Array(this._maxParticles);
      for (let i = 0; i < this._maxParticles; i++) {
        this._particles[i] = {
          position: new THREE.Vector3(),
          velocity: new THREE.Vector3(),
          acceleration: new THREE.Vector3(),
          life: 0,
          maxLife: 0,
          startSize: 0,
          endSize: 0,
          startAlpha: 0,
          endAlpha: 0,
          startColor: new THREE.Color(),
          endColor: new THREE.Color(),
          rotation: 0,
          rotationSpeed: 0,
          active: false,
        };
      }

      // Create geometry with buffer attributes
      this._geometry = new THREE.BufferGeometry();

      const positions = new Float32Array(this._maxParticles * 3);
      const colors = new Float32Array(this._maxParticles * 3);
      const sizes = new Float32Array(this._maxParticles);
      const alphas = new Float32Array(this._maxParticles);

      this._geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      this._geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );
      this._geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      this._geometry.setAttribute(
        'alpha',
        new THREE.BufferAttribute(alphas, 1)
      );

      // Create material
      this._material = new THREE.PointsMaterial({
        size: 10,
        map: this._texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        vertexColors: true,
        blending: this._additiveBlending
          ? THREE.AdditiveBlending
          : THREE.NormalBlending,
      });

      // Create points mesh
      this._points = new THREE.Points(this._geometry, this._material);
      this._container.add(this._points);
    }

    private _computeLifetime(flow: number, tank: number): number {
      if (tank < 0) return -1;
      else if (flow < 0) return 0.001;
      else return (tank + 0.1) / flow;
    }

    getRendererObject(): THREE.Group {
      return this._container;
    }

    update(delta: number): void {
      if (
        !this._runtimeObject.getInstanceContainer().getGame().isInGameEdition()
      ) {
        // Update emitter life
        if (this._emitterLifetime > 0) {
          this._emitterLife += delta;
          if (this._emitterLife >= this._emitterLifetime) {
            this._emit = false;
          }
        }

        // Emit new particles
        if (this._emit) {
          this._emissionTimer += delta;
          while (this._emissionTimer >= this._frequency) {
            this._emitParticle();
            this._emissionTimer -= this._frequency;
          }
        }

        // Update existing particles
        this._updateParticles(delta);
      }

      // Update helper graphics
      this._updateHelper();
    }

    private _emitParticle(): void {
      // Find an inactive particle
      let particle: ParticleData | null = null;
      for (let i = 0; i < this._particles.length; i++) {
        if (!this._particles[i].active) {
          particle = this._particles[i];
          break;
        }
      }

      if (!particle) return;

      // Initialize particle
      particle.active = true;
      particle.life = 0;
      particle.maxLife =
        this._minLifeTime +
        Math.random() * (this._maxLifeTime - this._minLifeTime);

      // Position (with zone radius)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this._zoneRadius;
      particle.position.set(
        this._spawnPos.x + Math.cos(angle) * radius,
        this._spawnPos.y + Math.sin(angle) * radius,
        0
      );

      // Velocity
      const emitAngle =
        this._minAngle + Math.random() * (this._maxAngle - this._minAngle);
      const force =
        this._minForce + Math.random() * (this._maxForce - this._minForce);
      particle.velocity.set(
        Math.cos(emitAngle) * force,
        Math.sin(emitAngle) * force,
        0
      );

      // Acceleration (gravity)
      particle.acceleration.copy(this._gravity);

      // Size
      particle.startSize = this._startSize;
      particle.endSize = this._endSize;

      // Alpha
      particle.startAlpha = this._startAlpha;
      particle.endAlpha = this._endAlpha;

      // Color
      particle.startColor.copy(this._startColor);
      particle.endColor.copy(this._endColor);

      // Rotation
      particle.rotation = 0;
      particle.rotationSpeed =
        this._minRotationSpeed +
        Math.random() * (this._maxRotationSpeed - this._minRotationSpeed);

      if (!this._started) {
        this._started = true;
      }
    }

    private _updateParticles(delta: number): void {
      const positions = this._geometry!.attributes.position
        .array as Float32Array;
      const colors = this._geometry!.attributes.color.array as Float32Array;
      const sizes = this._geometry!.attributes.size.array as Float32Array;
      const alphas = this._geometry!.attributes.alpha.array as Float32Array;

      for (let i = 0; i < this._particles.length; i++) {
        const particle = this._particles[i];

        if (!particle.active) {
          // Hide inactive particles
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
          sizes[i] = 0;
          alphas[i] = 0;
          continue;
        }

        // Update life
        particle.life += delta;
        if (particle.life >= particle.maxLife) {
          particle.active = false;
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
          sizes[i] = 0;
          alphas[i] = 0;
          continue;
        }

        // Update velocity
        particle.velocity.x += particle.acceleration.x * delta;
        particle.velocity.y += particle.acceleration.y * delta;

        // Update position
        particle.position.x += particle.velocity.x * delta;
        particle.position.y += particle.velocity.y * delta;

        // Update rotation
        particle.rotation += particle.rotationSpeed * delta;

        // Calculate life progress (0 to 1)
        const t = particle.life / particle.maxLife;

        // Interpolate size
        const size =
          particle.startSize + (particle.endSize - particle.startSize) * t;
        sizes[i] = size * 100; // Scale for visibility

        // Interpolate alpha
        const alpha =
          particle.startAlpha + (particle.endAlpha - particle.startAlpha) * t;
        alphas[i] = alpha;

        // Interpolate color
        const color = new THREE.Color().lerpColors(
          particle.startColor,
          particle.endColor,
          t
        );
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Update position in buffer
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;
      }

      // Mark attributes for update
      this._geometry!.attributes.position.needsUpdate = true;
      this._geometry!.attributes.color.needsUpdate = true;
      this._geometry!.attributes.size.needsUpdate = true;
      this._geometry!.attributes.alpha.needsUpdate = true;
    }

    private _updateHelper(): void {
      if (!this._helperGroup) return;

      // Clear previous helper graphics
      while (this._helperGroup.children.length > 0) {
        this._helperGroup.remove(this._helperGroup.children[0]);
      }

      // Draw emitter direction indicator
      const emitterAngle = gdjs.toRad(this._runtimeObject.getAngle());
      const sprayConeAngle = gdjs.toRad(
        this._runtimeObject.getConeSprayAngle()
      );
      const line1Angle = emitterAngle - sprayConeAngle / 2;
      const line2Angle = emitterAngle + sprayConeAngle / 2;
      const length = 64;

      // Create line geometry
      const material = new THREE.LineBasicMaterial({
        color: this._runtimeObject.getParticleColorEnd(),
        linewidth: 2,
      });

      // Line 1
      const geometry1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(line1Angle) * length,
          Math.sin(line1Angle) * length,
          0
        ),
      ]);
      const line1 = new THREE.Line(geometry1, material);
      this._helperGroup.add(line1);

      // Line 2
      const geometry2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(line2Angle) * length,
          Math.sin(line2Angle) * length,
          0
        ),
      ]);
      const line2 = new THREE.Line(geometry2, material);
      this._helperGroup.add(line2);

      // Draw emitter center circle
      const circleGeometry = new THREE.CircleGeometry(8, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: this._runtimeObject.getParticleColorStart(),
      });
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      this._helperGroup.add(circle);

      // Update position
      this._helperGroup.position.set(
        this._runtimeObject.getX(),
        this._runtimeObject.getY(),
        0
      );
    }

    setPosition(x: number, y: number): void {
      this._spawnPos.set(x, y, 0);
    }

    setAngle(angle1: number, angle2: number): void {
      this._minAngle = gdjs.toRad(angle1);
      this._maxAngle = gdjs.toRad(angle2);
    }

    setForce(min: number, max: number): void {
      this._minForce = min;
      this._maxForce = max || 0.000001; // Prevent zero force issues
    }

    setZoneRadius(radius: number): void {
      this._zoneRadius = radius;
    }

    setLifeTime(min: number, max: number): void {
      this._minLifeTime = min;
      this._maxLifeTime = max;
    }

    setGravity(x: number, y: number): void {
      this._gravity.set(x, y, 0);
    }

    setColor(color1: number, color2: number): void {
      const rgb1 = gdjs.hexNumberToRGBArray(color1);
      const rgb2 = gdjs.hexNumberToRGBArray(color2);
      this._startColor.setRGB(rgb1[0] / 255, rgb1[1] / 255, rgb1[2] / 255);
      this._endColor.setRGB(rgb2[0] / 255, rgb2[1] / 255, rgb2[2] / 255);
    }

    setSize(size1: number, size2: number): void {
      this._startSize = size1 / 100.0;
      this._endSize = size2 / 100.0;
    }

    setAlpha(alpha1: number, alpha2: number): void {
      this._startAlpha = alpha1 / 255.0;
      this._endAlpha = alpha2 / 255.0;
    }

    setParticleRotationSpeed(min: number, max: number): void {
      this._minRotationSpeed = gdjs.toRad(min);
      this._maxRotationSpeed = gdjs.toRad(max);
    }

    setMaxParticlesCount(count: number): void {
      // Note: Changing max particles at runtime requires recreating the system
      // For now, we just update the value
      this._maxParticles = count;
    }

    setAdditiveRendering(enabled: boolean): void {
      this._additiveBlending = enabled;
      if (this._material) {
        this._material.blending = enabled
          ? THREE.AdditiveBlending
          : THREE.NormalBlending;
        this._material.needsUpdate = true;
      }
    }

    setFlow(flow: number, tank: number): void {
      this._frequency = flow < 0 ? 0.0001 : 1.0 / flow;
      this._emitterLifetime = this._computeLifetime(flow, tank);
    }

    resetEmission(flow: number, tank: number): void {
      this.setFlow(flow, tank);
      const wasEmitting = this._emit;
      this.start();
      if (!wasEmitting) this.stop();
    }

    setTextureName(
      texture: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      const imageManager = instanceContainer
        .getGame()
        .getImageManager() as gdjs.ThreeTextureImageManager;
      const threeTexture = imageManager.getThreeTexture(texture);
      if (threeTexture && this._material) {
        this._texture = threeTexture;
        this._material.map = threeTexture;
        this._material.needsUpdate = true;
      }
    }

    isTextureNameValid(
      texture: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): boolean {
      if (!texture) return true;

      try {
        const imageManager = instanceContainer
          .getGame()
          .getImageManager() as gdjs.ThreeTextureImageManager;
        return !!imageManager.getThreeTexture(texture);
      } catch {
        return false;
      }
    }

    getParticleCount(): number {
      let count = 0;
      for (const particle of this._particles) {
        if (particle.active) count++;
      }
      return count;
    }

    stop(): void {
      this._emit = false;
    }

    start(): void {
      this._emit = true;
      this._emitterLife = 0;
    }

    isEmitting(): boolean {
      return this._emit;
    }

    recreate(): void {
      // Reset all particles
      for (const particle of this._particles) {
        particle.active = false;
      }
      this._emissionTimer = 0;
      this._emitterLife = 0;
    }

    destroy(): void {
      if (this._geometry) {
        this._geometry.dispose();
      }
      if (this._material) {
        this._material.dispose();
      }
      if (this._texture) {
        this._texture.dispose();
      }
    }

    hasStarted(): boolean {
      return this._started;
    }

    /**
     * @returns `true` at the end of emission or at the start if it's paused.
     * Returns false if there is no limit.
     */
    _mayHaveEndedEmission(): boolean {
      return (
        this._frequency > 0.0001 &&
        this._emitterLifetime >= 0 &&
        !this._emit &&
        this._emitterLife >= this._emitterLifetime
      );
    }

    setHelperVisible(visible: boolean): void {
      if (visible && !this._helperGroup) {
        this._helperGroup = new THREE.Group();
        this._container.add(this._helperGroup);
      } else if (!visible && this._helperGroup) {
        this._container.remove(this._helperGroup);
        this._helperGroup = null;
      }
    }
  }
}
