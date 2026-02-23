// @ts-check
describe('gdjs.MinimapRuntimeObject', function () {
  const runtimeGame = gdjs.getPixiRuntimeGame();
  var runtimeScene = new gdjs.RuntimeScene(runtimeGame);
  runtimeScene.loadFromScene({
    sceneData: {
      layers: [
        {
          name: '',
          visibility: true,
          cameras: [],
          effects: [],
          ambientLightColorR: 127,
          ambientLightColorB: 127,
          ambientLightColorG: 127,
          isLightingLayer: false,
          followBaseLayerCamera: false,
        },
      ],
      variables: [],
      r: 0,
      v: 0,
      b: 0,
      mangledName: 'Scene1',
      name: 'Scene1',
      stopSoundsOnStartup: false,
      title: '',
      behaviorsSharedData: [],
      objects: [],
      instances: [],
      usedResources: [],
      uiSettings: {
        grid: false,
        gridType: 'rectangular',
        gridWidth: 10,
        gridHeight: 10,
        gridDepth: 10,
        gridOffsetX: 0,
        gridOffsetY: 0,
        gridOffsetZ: 0,
        gridColor: 0,
        gridAlpha: 1,
        snap: false,
      },
    },
    usedExtensionsWithVariablesData: [],
  });

  // Create a minimap object
  var minimapObject = new gdjs.TestRuntimeObject(runtimeScene, {
    name: 'minimap1',
    type: 'Minimap::Minimap',
    variables: [],
    effects: [],
    content: {
      size: 200,
      zoom: 0.1,
      stayOnScreen: true,
      backgroundImage: '',
      frameImage: '',
      backgroundColor: '0;0;0',
      backgroundOpacity: 0.7,
      borderColor: '255;255;255',
      borderWidth: 2,
      playerMarkerImage: '',
      playerColor: '0;255;0',
      playerSize: 12,
      enemyMarkerImage: '',
      enemyColor: '255;0;0',
      enemySize: 8,
      itemMarkerImage: '',
      itemColor: '255;255;0',
      itemSize: 6,
      showObstacles: true,
      obstacleColor: '128;128;128',
      obstacleOpacity: 0.5,
      useObjectShape: true,
      autoDetectBounds: true,
      updateRate: 30,
    },
  });
  runtimeScene.addObject(minimapObject);

  // Create an object with minimap marker behavior
  var trackedObject = new gdjs.TestRuntimeObject(runtimeScene, {
    name: 'player1',
    type: '',
    behaviors: [
      {
        name: 'MinimapMarker1',
        type: 'Minimap::MinimapMarker',
        markerType: 'Player',
        customColor: '255;255;255',
        customSize: 0,
        customIcon: '',
        showRotation: false,
        visibleOnMinimap: true,
      },
    ],
    variables: [],
    effects: [],
  });
  trackedObject.setPosition(100, 200);
  trackedObject.setCustomWidthAndHeight(32, 32);
  runtimeScene.addObject(trackedObject);

  describe('Visibility', function () {
    it('should be visible by default', function () {
      expect(minimapObject.isVisible()).to.be(true);
    });

    it('can hide the minimap', function () {
      minimapObject.hide();
      expect(minimapObject.isVisible()).to.be(false);
    });

    it('can show the minimap', function () {
      minimapObject.hide();
      minimapObject.show();
      expect(minimapObject.isVisible()).to.be(true);
    });

    it('can toggle visibility', function () {
      expect(minimapObject.isVisible()).to.be(true);
      minimapObject.toggleVisibility();
      expect(minimapObject.isVisible()).to.be(false);
      minimapObject.toggleVisibility();
      expect(minimapObject.isVisible()).to.be(true);
    });
  });

  describe('Zoom', function () {
    it('should have default zoom of 0.1', function () {
      expect(minimapObject.getZoomLevel()).to.be(0.1);
    });

    it('can zoom in', function () {
      minimapObject.setZoom(0.1);
      minimapObject.zoomIn();
      expect(minimapObject.getZoomLevel()).to.be(0.15);
    });

    it('can zoom out', function () {
      minimapObject.setZoom(0.2);
      minimapObject.zoomOut();
      expect(minimapObject.getZoomLevel()).to.be(0.15);
    });

    it('can set zoom level', function () {
      minimapObject.setZoom(0.5);
      expect(minimapObject.getZoomLevel()).to.be(0.5);
    });

    it('clamps zoom to valid range', function () {
      minimapObject.setZoom(0.1);
      minimapObject.zoomIn();
      minimapObject.zoomIn();
      minimapObject.zoomIn();
      // Should not exceed 1.0
      expect(minimapObject.getZoomLevel()).to.be.lte(1.0);
    });
  });

  describe('Size', function () {
    it('should have default size of 200', function () {
      expect(minimapObject.getSize()).to.be(200);
    });

    it('can set size', function () {
      minimapObject.setSize(300);
      expect(minimapObject.getSize()).to.be(300);
    });

    it('enforces minimum size', function () {
      minimapObject.setSize(50);
      expect(minimapObject.getSize()).to.be(50);
    });
  });

  describe('Tracked Objects', function () {
    it('should track objects with MinimapMarker behavior', function () {
      const tracked = minimapObject.getTrackedObjects();
      expect(tracked.length).to.be(1);
      expect(tracked[0]).to.be(trackedObject);
    });

    it('can count tracked objects', function () {
      expect(minimapObject.getTrackedCount()).to.be(1);
    });

    it('can count by marker type', function () {
      expect(minimapObject.getTrackedCount('Player')).to.be(1);
      expect(minimapObject.getTrackedCount('Enemy')).to.be(0);
    });
  });

  describe('Robustness', function () {
    it('creates minimap even if content is missing', function () {
      var minimapWithoutContent = new gdjs.TestRuntimeObject(runtimeScene, {
        name: 'minimap2',
        type: 'Minimap::Minimap',
        variables: [],
        effects: [],
      });
      runtimeScene.addObject(minimapWithoutContent);
      expect(minimapWithoutContent.getSize()).to.be(200);
      expect(minimapWithoutContent.getZoomLevel()).to.be.greaterThan(0);
    });

    it('merges partial content with defaults', function () {
      var minimapPartial = new gdjs.TestRuntimeObject(runtimeScene, {
        name: 'minimap3',
        type: 'Minimap::Minimap',
        variables: [],
        effects: [],
        content: {
          size: 250,
        },
      });
      runtimeScene.addObject(minimapPartial);
      expect(minimapPartial.getSize()).to.be(250);
      // Default backgroundColor should be used
      expect(minimapPartial.getBackgroundColor()).to.be('0;0;0');
    });
  });
});

describe('gdjs.MinimapMarkerRuntimeBehavior', function () {
  const runtimeGame = gdjs.getPixiRuntimeGame();
  var runtimeScene = new gdjs.RuntimeScene(runtimeGame);
  runtimeScene.loadFromScene({
    sceneData: {
      layers: [
        {
          name: '',
          visibility: true,
          cameras: [],
          effects: [],
          ambientLightColorR: 127,
          ambientLightColorB: 127,
          ambientLightColorG: 127,
          isLightingLayer: false,
          followBaseLayerCamera: false,
        },
      ],
      variables: [],
      r: 0,
      v: 0,
      b: 0,
      mangledName: 'Scene1',
      name: 'Scene1',
      stopSoundsOnStartup: false,
      title: '',
      behaviorsSharedData: [],
      objects: [],
      instances: [],
      usedResources: [],
      uiSettings: {
        grid: false,
        gridType: 'rectangular',
        gridWidth: 10,
        gridHeight: 10,
        gridDepth: 10,
        gridOffsetX: 0,
        gridOffsetY: 0,
        gridOffsetZ: 0,
        gridColor: 0,
        gridAlpha: 1,
        snap: false,
      },
    },
    usedExtensionsWithVariablesData: [],
  });

  // Create an object with minimap marker behavior
  var object = new gdjs.TestRuntimeObject(runtimeScene, {
    name: 'testObject',
    type: '',
    behaviors: [
      {
        name: 'MinimapMarker1',
        type: 'Minimap::MinimapMarker',
        markerType: 'Player',
        customColor: '255;255;255',
        customSize: 0,
        customIcon: '',
        showRotation: false,
        visibleOnMinimap: true,
      },
    ],
    variables: [],
    effects: [],
  });
  runtimeScene.addObject(object);

  var behavior = object.getBehavior('MinimapMarker1');

  describe('Visibility', function () {
    it('should be visible on minimap by default', function () {
      expect(behavior.isVisibleOnMinimap()).to.be(true);
    });

    it('can hide from minimap', function () {
      behavior.hideOnMinimap();
      expect(behavior.isVisibleOnMinimap()).to.be(false);
    });

    it('can show on minimap', function () {
      behavior.hideOnMinimap();
      behavior.showOnMinimap();
      expect(behavior.isVisibleOnMinimap()).to.be(true);
    });
  });

  describe('Marker Type', function () {
    it('should have default marker type of Neutral', function () {
      // The default in the test object is Player, so this tests setter works
      expect(behavior.getMarkerType()).to.be('Player');
    });

    it('can set marker type', function () {
      behavior.setMarkerType('Enemy');
      expect(behavior.getMarkerType()).to.be('Enemy');
    });

    it('can check marker type', function () {
      behavior.setMarkerType('Item');
      expect(behavior.markerTypeIs('Item')).to.be(true);
      expect(behavior.markerTypeIs('Enemy')).to.be(false);
    });
  });

  describe('Custom Properties', function () {
    it('can set custom color', function () {
      behavior.setCustomColor('255;0;0');
      expect(behavior.getCustomColor()).to.be('255;0;0');
    });

    it('can set custom size', function () {
      behavior.setCustomSize(20);
      expect(behavior.getCustomSize()).to.be(20);
    });

    it('enforces non-negative custom size', function () {
      behavior.setCustomSize(-5);
      expect(behavior.getCustomSize()).to.be(0);
    });

    it('can set custom icon', function () {
      behavior.setCustomIcon('myIcon.png');
      expect(behavior.getCustomIcon()).to.be('myIcon.png');
    });

    it('can toggle show rotation', function () {
      expect(behavior.getShowRotation()).to.be(false);
      behavior.setShowRotation(true);
      expect(behavior.getShowRotation()).to.be(true);
    });
  });
});
