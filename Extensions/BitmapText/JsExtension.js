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
        'BitmapText',
        _('Bitmap Text'),
        _(
          'Displays a text using a "Bitmap Font" (an image representing characters). This is more performant than a traditional Text object and it allows for complete control on the characters aesthetic.'
        ),
        'Aurélien Vivet',
        'Open source (MIT License)'
      )
      .setShortDescription(
        'Text rendered from bitmap font images. High performance, full character aesthetic control.'
      )
      .setDimension('2D')
      .setExtensionHelpPath('/objects/bitmap_text')
      .setCategory('Text');
    extension
      .addInstructionOrExpressionGroupMetadata(_('Bitmap Text'))
      .setIcon('JsPlatform/Extensions/bitmapfont32.png');

    const bitmapTextObject = new gd.ObjectJsImplementation();
    bitmapTextObject.updateProperty = function (propertyName, newValue) {
      const objectContent = this.content;
      if (propertyName === 'align') {
        const normalizedValue = newValue.toLowerCase();
        if (
          normalizedValue === 'left' ||
          normalizedValue === 'center' ||
          normalizedValue === 'right'
        ) {
          objectContent.align = normalizedValue;
          return true;
        }
        return false;
      }
      if (propertyName === 'verticalTextAlignment') {
        const normalizedValue = newValue.toLowerCase();
        if (
          normalizedValue === 'top' ||
          normalizedValue === 'center' ||
          normalizedValue === 'bottom'
        ) {
          objectContent.verticalTextAlignment = normalizedValue;
          return true;
        }
        return false;
      }
      if (propertyName in objectContent) {
        if (typeof objectContent[propertyName] === 'boolean')
          objectContent[propertyName] = newValue === '1';
        else if (typeof objectContent[propertyName] === 'number')
          objectContent[propertyName] = parseFloat(newValue);
        else objectContent[propertyName] = newValue;
        return true;
      }

      return false;
    };
    bitmapTextObject.getProperties = function () {
      const objectProperties = new gd.MapStringPropertyDescriptor();
      const objectContent = this.content;

      objectProperties
        .getOrCreate('text')
        .setValue(objectContent.text)
        .setType('multilinestring')
        .setLabel(_('Text'));

      objectProperties
        .getOrCreate('align')
        .setValue(objectContent.align)
        .setType('choice')
        .addChoice('left', _('Left'))
        .addChoice('center', _('Center'))
        .addChoice('right', _('Right'))
        .setLabel(_('Alignment'))
        .setGroup(_('Appearance'));

      if (!objectContent.verticalTextAlignment) {
        objectContent.verticalTextAlignment = 'top';
      }
      objectProperties
        .getOrCreate('verticalTextAlignment')
        .setValue(objectContent.verticalTextAlignment)
        .setType('choice')
        .addChoice('top', _('Top'))
        .addChoice('center', _('Center'))
        .addChoice('bottom', _('Bottom'))
        .setLabel(_('Vertical alignment'))
        .setGroup(_('Appearance'));

      objectProperties
        .getOrCreate('bitmapFontResourceName')
        .setValue(objectContent.bitmapFontResourceName)
        .setType('resource')
        .addExtraInfo('bitmapFont') //fnt or xml files
        .setLabel(_('Bitmap Font'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('textureAtlasResourceName')
        .setValue(objectContent.textureAtlasResourceName)
        .setType('resource')
        .addExtraInfo('image')
        .setLabel(_('Bitmap Atlas'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('scale')
        .setValue(objectContent.scale.toString())
        .setType('number')
        .setLabel(_('Text scale'))
        .setGroup(_('Appearance'));

      objectProperties
        .getOrCreate('tint')
        .setValue(objectContent.tint)
        .setType('color')
        .setLabel(_('Font tint'))
        .setGroup(_('Font'));

      return objectProperties;
    };
    bitmapTextObject.content = {
      text: 'This text use the default bitmap font.\nUse a custom Bitmap Font to create your own texts.',
      opacity: 255,
      scale: 1,
      fontSize: 20,
      tint: '255;255;255',
      bitmapFontResourceName: '',
      textureAtlasResourceName: '',
      align: 'left',
      verticalTextAlignment: 'top',
    };

    bitmapTextObject.updateInitialInstanceProperty = function (
      instance,
      propertyName,
      newValue
    ) {
      return false;
    };
    bitmapTextObject.getInitialInstanceProperties = function (instance) {
      var instanceProperties = new gd.MapStringPropertyDescriptor();
      return instanceProperties;
    };

    const object = extension
      .addObject(
        'BitmapTextObject',
        _('Bitmap Text'),
        _('Image-based text.'),
        'JsPlatform/Extensions/bitmapfont32.png',
        bitmapTextObject
      )
      .setIncludeFile('Extensions/BitmapText/bitmaptextruntimeobject.js')
      .addIncludeFile(
        'Extensions/BitmapText/bitmaptextruntimeobject-renderer.js'
      )
      .addIncludeFile(
        'Extensions/BitmapText/bitmaptextruntimeobject-pixi-renderer.js'
      )
      .setCategory('Text')
      .setAssetStoreTag('bitmap texts')
      .addDefaultBehavior('TextContainerCapability::TextContainerBehavior')
      .addDefaultBehavior('EffectCapability::EffectBehavior')
      .addDefaultBehavior('OpacityCapability::OpacityBehavior')
      .addDefaultBehavior('ScalableCapability::ScalableBehavior');

    // Deprecated
    object
      .addExpressionAndConditionAndAction(
        'string',
        'Text',
        _('Text'),
        _('the text'),
        _('the text'),
        '',
        'res/conditions/text24_black.png'
      )
      .setHidden()
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters('string', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('setText')
      .setGetter('getText');

    object
      .addStrExpression(
        'Text',
        _('Text'),
        _('Return the text.'),
        '',
        'res/conditions/text24_black.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .setFunctionName('getText');

    // Deprecated
    object
      .addExpressionAndConditionAndAction(
        'number',
        'Opacity',
        _('Opacity'),
        _('the opacity, between 0 (fully transparent) and 255 (opaque)'),
        _('the opacity'),
        '',
        'res/conditions/opacity24.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Opacity (0-255)')
        )
      )
      .setFunctionName('setOpacity')
      .setGetter('getOpacity')
      .setHidden();

    object
      .addExpressionAndCondition(
        'number',
        'FontSize',
        _('Font size'),
        _('the font size, defined in the Bitmap Font'),
        _('the font size'),
        '',
        'res/conditions/characterSize24.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters('number', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('getFontSize');

    // Deprecated
    object
      .addExpressionAndConditionAndAction(
        'number',
        'Scale',
        _('Scale'),
        _('the scale (1 by default)'),
        _('the scale'),
        '',
        'res/actions/scale24_black.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Scale (1 by default)')
        )
      )
      .setHidden()
      .setFunctionName('setScale')
      .setGetter('getScale');

    object
      .addExpressionAndCondition(
        'string',
        'FontName',
        _('Font name'),
        _('the font name (defined in the Bitmap font)'),
        _('the font name'),
        '',
        'res/conditions/font24.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters('string', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('getFontName');

    object
      .addAction(
        'SetTint',
        _('Tint'),
        _('Set the tint of the Bitmap Text object.'),
        _('Set tint of _PARAM0_ to _PARAM1_'),
        '',
        'res/actions/color24.png',
        'res/actions/color.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .addParameter('color', _('Color'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setTint');

    // Deprecated
    object
      .addAction(
        'SetBitmapFontAndTextureAtlasResourceName',
        _('Bitmap files resources'),
        _('Change the Bitmap Font and/or the atlas image used by the object.'),
        _(
          'Set the bitmap font of _PARAM0_ to _PARAM1_ and the atlas to _PARAM2_'
        ),
        '',
        'res/actions/font24.png',
        'res/actions/font.png'
      )
      .setHidden()
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .addParameter(
        'bitmapFontResource',
        _('Bitmap font resource name'),
        '',
        false
      )
      .setParameterLongDescription(
        'The resource name of the font file, without quotes.'
      )
      .addParameter('string', _('Texture atlas resource name'), '', false)
      .setParameterLongDescription(
        'The resource name of the image exported with the font, with quotes.'
      )
      .getCodeExtraInformation()
      .setFunctionName('setBitmapFontAndTextureAtlasResourceName');

    object
      .addAction(
        'SetBitmapFontAndTextureAtlasResourceName2',
        _('Bitmap files resources'),
        _('Change the Bitmap Font and/or the atlas image used by the object.'),
        _(
          'Set the bitmap font of _PARAM0_ to _PARAM1_ and the atlas to _PARAM2_'
        ),
        '',
        'res/actions/font24.png',
        'res/actions/font.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .addParameter(
        'bitmapFontResource',
        _('Bitmap font resource name'),
        '',
        false
      )
      .addParameter(
        'imageResource',
        _('Texture atlas resource name'),
        '',
        false
      )
      .getCodeExtraInformation()
      .setFunctionName('setBitmapFontAndTextureAtlasResourceName');

    object
      .addExpressionAndCondition(
        'string',
        'Alignment',
        _('Alignment'),
        _('the text alignment'),
        _('the text alignment'),
        '',
        'res/actions/textAlign24.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters(
        'string',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Alignment ("left", "right" or "center")')
        )
      )
      .setFunctionName('getTextAlignment');

    object
      .addAction(
        'SetAlignment',
        _('Alignment'),
        _('Change the alignment of a Bitmap text object.'),
        _('Set the alignment of _PARAM0_ to _PARAM1_'),
        '',
        'res/actions/textAlign24.png',
        'res/actions/textAlign.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .addParameter(
        'stringWithSelector',
        _('Alignment'),
        '["left", "center", "right"]',
        false
      )
      .getCodeExtraInformation()
      .setFunctionName('setTextAlignment');

    object
      .addCondition(
        'WordWrap',
        _('Word wrapping'),
        _('Check if word wrapping is enabled.'),
        _('_PARAM0_ word wrapping is enabled'),
        '',
        'res/conditions/wordWrap24_black.png',
        'res/conditions/wordWrap_black.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isWrapping');

    object
      .addAction(
        'SetWordWrap',
        _('Word wrapping'),
        _('De/activate word wrapping.'),
        _('Activate word wrapping of _PARAM0_: _PARAM1_'),
        '',
        'res/actions/wordWrap24_black.png',
        'res/actions/wordWrap_black.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .addParameter('yesorno', _('Activate word wrapping'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setWrapping');

    object
      .addExpressionAndConditionAndAction(
        'number',
        'WrappingWidth',
        _('Wrapping width'),
        _('the width, in pixels, after which the text is wrapped on next line'),
        _('the wrapping width'),
        '',
        'res/actions/scaleWidth24_black.png'
      )
      .addParameter('object', _('Bitmap text'), 'BitmapTextObject', false)
      .useStandardParameters('number', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('setWrappingWidth')
      .setGetter('getWrappingWidth');

    return extension;
  },

  /**
   * You can optionally add sanity tests that will check the basic working
   * of your extension behaviors/objects by instantiating behaviors/objects
   * and setting the property to a given value.
   *
   * If you don't have any tests, you can simply return an empty array.
   *
   * But it is recommended to create tests for the behaviors/objects properties you created
   * to avoid mistakes.
   */
  runExtensionSanityTests: function (gd, extension) {
    return [];
  },
  /**
   * Register editors for objects.
   *
   * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change.
   */
  registerEditorConfigurations: function (objectsEditorService) {
    objectsEditorService.registerEditorConfiguration(
      'BitmapText::BitmapTextObject',
      objectsEditorService.getDefaultObjectJsImplementationPropertiesEditor({
        helpPagePath: '/objects/bitmap_text',
      })
    );
  },
  /**
   * Register renderers for instance of objects on the scene editor.
   *
   * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change.
   */
  registerInstanceRenderers: function (objectsRenderingService) {
    const RenderedInstance = objectsRenderingService.RenderedInstance;
    const THREE = objectsRenderingService.THREE;

    /**
     * Return the path to the thumbnail of the specified object.
     * This is called to update the Three.js object on the scene editor.
     */
    class RenderedBitmapTextInstance extends RenderedInstance {
      static getThumbnail(project, resourcesLoader, objectConfiguration) {
        return 'JsPlatform/Extensions/bitmapfont24.png';
      }

      constructor(
        project,
        instance,
        associatedObjectConfiguration,
        threeGroup,
        resourcesLoader,
        getPropertyOverridings
      ) {
        super(
          project,
          instance,
          associatedObjectConfiguration,
          threeGroup,
          resourcesLoader,
          getPropertyOverridings
        );

        this._canvas = document.createElement('canvas');
        this._context = this._canvas.getContext('2d');
        this._canvasTexture = new THREE.CanvasTexture(this._canvas);
        this._canvasTexture.minFilter = THREE.LinearFilter;
        this._canvasTexture.magFilter = THREE.LinearFilter;
        this._canvasTexture.colorSpace = THREE.SRGBColorSpace;

        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
          map: this._canvasTexture,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        this._threeObject = new THREE.Mesh(geometry, material);
        this._threeObject.userData.instance = instance;
        this._threeObject.rotation.order = 'ZYX';
        this._layerGroup.add(this._threeObject);

        this.update();
      }

      update() {
        if (!this._threeObject || !this._context) return;

        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );

        const propertyOverridings = this.getPropertyOverridings();
        const text =
          propertyOverridings && propertyOverridings.has('Text')
            ? propertyOverridings.get('Text')
            : object.content.text;
        const align = object.content.align || 'left';
        const scale = object.content.scale || 1;
        const fontSize = Math.max(1, (object.content.fontSize || 20) * scale);
        const lines = (text || ' ').split('\n');

        this._context.font = `${fontSize}px Arial`;
        const padding = 8;
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(
            maxLineWidth,
            this._context.measureText(line || ' ').width
          );
        }
        const lineHeight = fontSize * 1.2;
        const canvasWidth = Math.max(1, Math.ceil(maxLineWidth + padding * 2));
        const canvasHeight = Math.max(
          1,
          Math.ceil(lines.length * lineHeight + padding * 2)
        );
        if (
          this._canvas.width !== canvasWidth ||
          this._canvas.height !== canvasHeight
        ) {
          this._canvas.width = canvasWidth;
          this._canvas.height = canvasHeight;
        }

        this._context.clearRect(0, 0, canvasWidth, canvasHeight);
        this._context.font = `${fontSize}px Arial`;
        this._context.textBaseline = 'top';
        this._context.textAlign = align;

        const color = object.content.tint
          .split(';')
          .map((component) => parseInt(component, 10));
        this._context.fillStyle = `rgb(${color[0] || 255}, ${color[1] || 255}, ${color[2] || 255})`;

        let x = padding;
        if (align === 'center') x = canvasWidth / 2;
        if (align === 'right') x = canvasWidth - padding;

        let y = padding;
        for (const line of lines) {
          this._context.fillText(line || ' ', x, y);
          y += lineHeight;
        }
        this._canvasTexture.needsUpdate = true;

        if (this._instance.hasCustomSize() && this.getDefaultWidth() !== 0) {
          const alignmentX =
            object.content.align === 'right'
              ? 1
              : object.content.align === 'center'
                ? 0.5
                : 0;

          const width = this.getCustomWidth();
          const renderedWidth = this.getDefaultWidth();

          const centerToCenterX = (width - renderedWidth) * (alignmentX - 0.5);

          this._threeObject.position.x = this._instance.getX() + width / 2;
          this._threeObject.scale.x = width;
          this._threeObject.userData.anchorX =
            0.5 - centerToCenterX / renderedWidth;
        } else {
          this._threeObject.position.x =
            this._instance.getX() + this.getDefaultWidth() / 2;
          this._threeObject.scale.x = this.getDefaultWidth();
          this._threeObject.userData.anchorX = 0.5;
        }
        const alignmentY =
          object.content.verticalTextAlignment === 'bottom'
            ? 1
            : object.content.verticalTextAlignment === 'center'
              ? 0.5
              : 0;
        this._threeObject.position.y =
          this._instance.getY() + this.getDefaultHeight() * (0.5 - alignmentY);
        this._threeObject.scale.y = this.getDefaultHeight();

        this._threeObject.rotation.z = RenderedInstance.toRad(
          this._instance.getAngle()
        );

        const alphaForDisplay = Math.max(
          this._instance.getOpacity() / 255,
          0.5
        );
        this._threeObject.material.opacity = alphaForDisplay;
        this._threeObject.material.transparent = true;
      }

      onRemovedFromScene() {
        super.onRemovedFromScene();
        if (this._threeObject) {
          if (this._threeObject.material) {
            this._threeObject.material.dispose();
          }
          if (this._threeObject.geometry) {
            this._threeObject.geometry.dispose();
          }
          this._threeObject.userData.instance = null;
          this._threeObject = null;
        }
        if (this._canvasTexture) {
          this._canvasTexture.dispose();
        }
      }

      getDefaultWidth() {
        return this._canvas.width;
      }

      getDefaultHeight() {
        return this._canvas.height;
      }

      getOriginY() {
        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );
        const height = this.getHeight();
        return object.content.verticalTextAlignment === 'bottom'
          ? height
          : object.content.verticalTextAlignment === 'center'
            ? height / 2
            : 0;
      }
    }

    objectsRenderingService.registerInstanceRenderer(
      'BitmapText::BitmapTextObject',
      RenderedBitmapTextInstance
    );
  },
};
