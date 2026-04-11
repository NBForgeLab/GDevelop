const addLightObject = (runtimeScene, radius, intensity = 1) => {
  const lightObj = new gdjs.LightRuntimeObject(runtimeScene, {
    name: 'lightObject',
    type: 'Lighting::LightObject',
    variables: [],
    behaviors: [],
    effects: [],
    content: {
      radius,
      color: '#b4b4b4',
      intensity,
      debugMode: false,
    },
  });
  runtimeScene.addObject(lightObj);
  return lightObj;
};

describe('gdjs.LightRuntimeObject', function () {
  const createScene = () => {
    const runtimeGame = gdjs.getRuntimeGame();
    const runtimeScene = new gdjs.RuntimeScene(runtimeGame);
    runtimeScene.loadFromScene({
      sceneData: {
        layers: [{ name: '', visibility: true, effects: [] }],
        variables: [],
        behaviorsSharedData: [],
        objects: [],
        instances: [],
      },
      usedExtensionsWithVariablesData: [],
    });
    return runtimeScene;
  };

  it('creates a 3D point light with synced properties', function () {
    const runtimeScene = createScene();
    const lightObj = addLightObject(runtimeScene, 100, 2.5);

    lightObj.setPosition(200, 150);
    lightObj.setZ(75);
    lightObj.updatePreRender();

    expect(lightObj.getRadius()).to.be(100);
    expect(lightObj.getColor()).to.eql('180;180;180');
    expect(lightObj.getIntensity()).to.be(2.5);
    expect(lightObj.getDrawableX()).to.be(100);
    expect(lightObj.getDrawableY()).to.be(50);
    expect(lightObj.getDrawableZ()).to.be(-25);

    const rendererObject = lightObj.get3DRendererObject();
    expect(rendererObject.position.x).to.be(200);
    expect(rendererObject.position.y).to.be(150);
    expect(rendererObject.position.z).to.be(75);
    expect(lightObj._renderer._pointLight.distance).to.be(100);
    expect(lightObj._renderer._pointLight.intensity).to.be(2.5);
    expect(lightObj._renderer._pointLight.color.getHex()).to.be(0xb4b4b4);
  });

  it('updates color, range and debug helper', function () {
    const runtimeScene = createScene();
    const lightObj = addLightObject(runtimeScene, 120, 1);

    lightObj.setColor('255;128;64');
    lightObj.setRadius(240);
    lightObj._debugMode = true;
    lightObj._renderer.updateDebugMode();
    lightObj.updatePreRender();

    expect(lightObj.getColor()).to.eql('255;128;64');
    expect(lightObj._renderer._pointLight.distance).to.be(240);
    expect(lightObj._renderer._debugHelper).not.to.be(null);
    expect(lightObj._renderer._pointLight.color.getHex()).to.be(0xff8040);
  });
});
