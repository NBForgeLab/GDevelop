//@ts-check
/// <reference path="../JsExtensionTypes.d.ts" />
/**
 * This is a declaration of an extension for GDevelop 5.
 *
 * ℹ️ Changes in this file are watched and automatically imported if the editor
 * is running. You can also manually run `node import-GDJS-Runtime.js` (in newIDE/app/scripts).
 *
 * The file must be named "JsExtension.js", otherwise GDevelop won't load it.
 * ⚠️ If you make a change and the extension is not loaded, open the developer console
 * and search for any errors.
 *
 * More information on https://github.com/4ian/GDevelop/blob/master/newIDE/README-extensions.md
 */

/** @type {ExtensionModule} */
module.exports = {
  createExtension: function (_, gd) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        'Lighting',
        _('Lights'),

        'This provides a 3D point light object for scenes rendered with Three.js.',
        'Harsimran Virk',
        'MIT'
      )
      .setShortDescription(
        '3D point light objects with configurable range, color, and intensity.'
      )
      .setDimension('3D')
      .setCategory('Visual effect')
      .setTags('light');

    const lightObject = new gd.ObjectJsImplementation();

    lightObject.updateProperty = function (propertyName, newValue) {
      const objectContent = this.content;
      if (propertyName === 'radius') {
        objectContent.radius = parseFloat(newValue);
        return true;
      }

      if (propertyName === 'color') {
        objectContent.color = newValue;
        return true;
      }

      if (propertyName === 'debugMode') {
        objectContent.debugMode = newValue === '1' || newValue === 'true';
        return true;
      }

      if (propertyName === 'intensity') {
        objectContent.intensity = parseFloat(newValue);
        return true;
      }

      return false;
    };

    lightObject.getProperties = function () {
      const objectProperties = new gd.MapStringPropertyDescriptor();
      const objectContent = this.content;

      objectProperties.set(
        'radius',
        new gd.PropertyDescriptor(objectContent.radius.toString())
          .setType('number')
          .setLabel(_('Range'))
      );

      objectProperties.set(
        'color',
        new gd.PropertyDescriptor(objectContent.color)
          .setType('color')
          .setLabel(_('Color'))
      );

      objectProperties.set(
        'debugMode',
        new gd.PropertyDescriptor(objectContent.debugMode ? 'true' : 'false')
          .setType('boolean')
          .setLabel(_('Debug mode'))
          .setDescription(
            _(
              'When activated, display the helper used to preview the point light.'
            )
          )
          .setGroup(_('Advanced'))
      );

      objectProperties.set(
        'intensity',
        new gd.PropertyDescriptor(objectContent.intensity.toString())
          .setType('number')
          .setLabel(_('Intensity'))
      );

      return objectProperties;
    };
    lightObject.content = {
      radius: 200,
      color: '255;255;255',
      intensity: 1,
      debugMode: false,
    };

    lightObject.updateInitialInstanceProperty = function (
      instance,
      propertyName,
      newValue
    ) {
      return false;
    };

    lightObject.getInitialInstanceProperties = function (instance) {
      const instanceProperties = new gd.MapStringPropertyDescriptor();

      return instanceProperties;
    };

    const object = extension
      .addObject(
        'LightObject',
        _('Light'),
        _(
          'Displays a 3D point light on the scene, with a customizable range, color, and intensity.'
        ),
        'CppPlatform/Extensions/lightIcon32.png',
        lightObject
      )
      .setIncludeFile('Extensions/Lighting/lightruntimeobject.js')
      .addIncludeFile('Extensions/Lighting/lightruntimeobject-three-renderer.js')
      .setCategory('Visual effect')
      .markAsRenderedIn3D();

    object
      .addInGameEditorResource()
      .setResourceName('InGameEditor-LightIcon')
      .setFilePath('Extensions/Lighting/InGameEditor/LightIcon.png')
      .setKind('image');

    object
      .addAction(
        'SetRadius',
        _('Light range'),
        _('Set the range of light object'),
        _('Set the range of _PARAM0_ to: _PARAM1_'),
        '',
        'CppPlatform/Extensions/lightIcon24.png',
        'CppPlatform/Extensions/lightIcon16.png'
      )
      .addParameter('object', _('Object'), 'LightObject', false)
      .addParameter('expression', _('Range'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setRadius');

    object
      .addAction(
        'SetColor',
        _('Light color'),
        _('Set the color of the 3D point light in format "R;G;B" string.'),
        _('Set the color of _PARAM0_ to: _PARAM1_'),
        '',
        'res/actions/color24.png',
        'res/actions/color.png'
      )
      .addParameter('object', _('Object'), 'LightObject', false)
      .addParameter('color', _('Color'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setColor');

    object
      .addAction(
        'SetIntensity',
        _('Light intensity'),
        _('Set the intensity of light object'),
        _('Set the intensity of _PARAM0_ to: _PARAM1_'),
        '',
        'CppPlatform/Extensions/lightIcon24.png',
        'CppPlatform/Extensions/lightIcon16.png'
      )
      .addParameter('object', _('Object'), 'LightObject', false)
      .addParameter('expression', _('Intensity'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setIntensity');

    return extension;
  },

  runExtensionSanityTests: function (gd, extension) {
    return [];
  },

  registerEditorConfigurations: function (objectsEditorService) {
    objectsEditorService.registerEditorConfiguration(
      'Lighting::LightObject',
      objectsEditorService.getDefaultObjectJsImplementationPropertiesEditor({
        helpPagePath: '',
      })
    );
  },
  /**
   * Register renderers for instance of objects on the scene editor.
   *
   * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change.
   */
  registerInstanceRenderers: function (objectsRenderingService) {
    const Rendered3DInstance = objectsRenderingService.Rendered3DInstance;
    const THREE = objectsRenderingService.THREE;

    class RenderedLightObject3DInstance extends Rendered3DInstance {
      _radius = 0;
      _color = 0;
      constructor(
        project,
        instance,
        associatedObjectConfiguration,
        pixiContainer,
        threeGroup,
        pixiResourcesLoader
      ) {
        super(
          project,
          instance,
          associatedObjectConfiguration,
          pixiContainer,
          threeGroup,
          pixiResourcesLoader
        );

        this._threeObject = new THREE.Group();
        this._threeGroup.add(this._threeObject);
        this._iconTexture = null;
        this._iconMaterial = null;
        this._iconSprite = null;
        this._rangeCircle = null;

        const iconTexture = new THREE.TextureLoader().load(
          'CppPlatform/Extensions/lightIcon32.png'
        );
        iconTexture.colorSpace = THREE.SRGBColorSpace;
        this._iconTexture = iconTexture;
        const iconMaterial = new THREE.SpriteMaterial({
          map: iconTexture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        });
        this._iconMaterial = iconMaterial;
        const iconSprite = new THREE.Sprite(iconMaterial);
        iconSprite.center.set(0.5, 0.5);
        iconSprite.scale.set(32, 32, 1);
        this._iconSprite = iconSprite;
        this._threeObject.add(iconSprite);

        this._rangeCircle = new THREE.LineLoop(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.8,
          })
        );
        this._threeObject.add(this._rangeCircle);
        this.update();
      }

      onRemovedFromScene() {
        super.onRemovedFromScene();
        const rangeCircle = this._rangeCircle;
        if (rangeCircle) {
          rangeCircle.geometry.dispose();
          rangeCircle.material.dispose();
        }
        const iconMaterial = this._iconMaterial;
        if (iconMaterial) {
          iconMaterial.dispose();
        }
        const iconTexture = this._iconTexture;
        if (iconTexture) {
          iconTexture.dispose();
        }
      }

      /**
       * Return the path to the thumbnail of the specified object.
       */
      static getThumbnail(project, resourcesLoader, objectConfiguration) {
        return 'CppPlatform/Extensions/lightIcon32.png';
      }

      /**
       * This is called to update the PIXI object on the scene editor
       */
      update() {
        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );

        this._threeObject.position.set(
          this._instance.getX(),
          this._instance.getY(),
          this._instance.getZ()
        );

        let radiusGraphicsDirty = false;

        let radius = object.content.radius;
        if (radius <= 0) radius = 1;
        if (radius !== this._radius) {
          this._radius = radius;
          radiusGraphicsDirty = true;
        }

        const color = objectsRenderingService.rgbOrHexToHexNumber(
          object.content.color
        );
        if (color !== this._color) {
          this._color = color;
          radiusGraphicsDirty = true;
        }

        const rangeCircle = this._rangeCircle;
        if (radiusGraphicsDirty && rangeCircle) {
          const segments = 48;
          const positions = new Float32Array(segments * 3);
          for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * Math.max(1, this._radius);
            positions[i * 3 + 1] = Math.sin(angle) * Math.max(1, this._radius);
            positions[i * 3 + 2] = 0;
          }

          rangeCircle.geometry.dispose();
          rangeCircle.geometry = new THREE.BufferGeometry();
          rangeCircle.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
          );
          rangeCircle.material.color.setHex(color);
        }

        if (rangeCircle) {
          rangeCircle.visible = !!object.content.debugMode;
        }
      }

      /**
       * Return the width of the instance, when it's not resized.
       */
      getDefaultWidth() {
        return this._radius * 2;
      }

      /**
       * Return the height of the instance, when it's not resized.
       */
      getDefaultHeight() {
        return this._radius * 2;
      }

      getDefaultDepth() {
        return this._radius * 2;
      }

      getOriginX() {
        return this.getWidth() / 2;
      }

      getOriginY() {
        return this.getHeight() / 2;
      }

      getOriginZ() {
        return this.getDepth() / 2;
      }
    }

    objectsRenderingService.registerInstance3DRenderer(
      'Lighting::LightObject',
      RenderedLightObject3DInstance
    );
  },
};
