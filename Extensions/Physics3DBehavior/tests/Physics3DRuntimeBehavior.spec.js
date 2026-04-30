describe('Physics3DRuntimeBehavior', () => {
  const createBehaviorForDebugShape = () => {
    const rendererObject = new THREE.Group();
    rendererObject.scale.set(100, 50, 20);

    const behavior = Object.create(gdjs.Physics3DRuntimeBehavior.prototype);
    Object.assign(behavior, {
      owner3D: {
        get3DRendererObject: () => rendererObject,
        getWidth: () => 100,
        getHeight: () => 50,
        getDepth: () => 20,
        isFlippedX: () => false,
        isFlippedY: () => false,
        isFlippedZ: () => false,
      },
      _shape: 'Box',
      shapeOrientation: 'Z',
      shapeDimensionA: 30,
      shapeDimensionB: 20,
      shapeDimensionC: 10,
      shapeOffsetX: 10,
      shapeOffsetY: 5,
      shapeOffsetZ: -2,
      shapeScale: 1,
    });

    return { behavior, rendererObject };
  };

  it('can show and hide a collision shape debug object', () => {
    const { behavior, rendererObject } = createBehaviorForDebugShape();

    expect(behavior.isCollisionShapeVisible()).to.be(false);

    behavior.setCollisionShapeVisible(true);

    expect(behavior.isCollisionShapeVisible()).to.be(true);
    expect(rendererObject.children.length).to.be(1);
    expect(rendererObject.children[0].position.x).to.be(0.1);
    expect(rendererObject.children[0].position.y).to.be(0.1);
    expect(rendererObject.children[0].position.z).to.be(-0.1);
    expect(rendererObject.children[0].scale.x).to.be(0.01);
    expect(rendererObject.children[0].scale.y).to.be(0.02);
    expect(rendererObject.children[0].scale.z).to.be(0.05);

    behavior.setCollisionShapeVisible(false);

    expect(behavior.isCollisionShapeVisible()).to.be(false);
    expect(rendererObject.children.length).to.be(0);
  });

  it('shows the default sphere fallback for mesh shapes on non-model objects', () => {
    const { behavior, rendererObject } = createBehaviorForDebugShape();
    Object.assign(behavior, {
      _shape: 'Mesh',
      bodyType: 'Dynamic',
      shapeDimensionA: 0,
      shapeDimensionB: 0,
      shapeDimensionC: 0,
    });

    behavior.setCollisionShapeVisible(true);

    expect(rendererObject.children.length).to.be(1);
    expect(rendererObject.children[0].children[0].geometry.type).to.be(
      'SphereGeometry'
    );
  });

  it('shows a triangle collision shape debug object', () => {
    const { behavior, rendererObject } = createBehaviorForDebugShape();
    Object.assign(behavior, {
      _shape: 'Triangle',
      bodyType: 'Dynamic',
    });

    behavior.setCollisionShapeVisible(true);

    expect(rendererObject.children.length).to.be(1);
    expect(rendererObject.children[0].children[0].geometry.type).to.be(
      'BufferGeometry'
    );
  });

  it('keeps model normalization when showing a mesh collision shape for any body type', () => {
    const previousThreeAddons = globalThis.THREE_ADDONS;
    globalThis.THREE_ADDONS = {
      SkeletonUtils: {
        clone: object3D => object3D.clone(true),
      },
    };

    try {
      const modelScene = new THREE.Group();
      modelScene.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial()
        )
      );

      ['Static', 'Dynamic', 'Kinematic'].forEach(bodyType => {
        const { behavior, rendererObject } = createBehaviorForDebugShape();
        const owner3D = {
          _modelResourceName: 'Rabbit',
          _data: {
            content: {
              rotationX: 90,
              rotationY: 0,
              rotationZ: 90,
            },
          },
          _renderer: {
            stretchModelIntoUnitaryCube: model => {
              model.scale.set(0.5, 0.25, 0.125);
            },
          },
          getInstanceContainer: () => ({
            getGame: () => ({
              getModel3DManager: () => ({
                getModel: () => ({ scene: modelScene }),
              }),
            }),
          }),
          get3DRendererObject: () => rendererObject,
          getWidth: () => 100,
          getHeight: () => 50,
          getDepth: () => 20,
          isFlippedX: () => false,
          isFlippedY: () => false,
          isFlippedZ: () => false,
        };
        Object.assign(behavior, {
          owner: owner3D,
          owner3D,
          _shape: 'Mesh',
          bodyType,
          meshShapeResourceName: '',
        });

        behavior.setCollisionShapeVisible(true);

        const debugObject = rendererObject.children[0];
        const meshShapeObject = debugObject.children[0];
        const modelInCube = meshShapeObject.children[0];
        expect(meshShapeObject.scale.x).to.be(100);
        expect(meshShapeObject.scale.y).to.be(50);
        expect(meshShapeObject.scale.z).to.be(20);
        expect(modelInCube.scale.x).to.be(0.5);
        expect(modelInCube.scale.y).to.be(0.25);
        expect(modelInCube.scale.z).to.be(0.125);
      });
    } finally {
      globalThis.THREE_ADDONS = previousThreeAddons;
    }
  });
});
