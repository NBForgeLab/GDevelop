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
        'TextInput',
        _('Text Input'),
        _('A text field the player can type text into.'),
        'Florian Rival',
        'MIT'
      )
      .setShortDescription(
        'Text input field for players. Placeholder, font, color, disabled state, read-only, focus control.'
      )
      .setCategory('User interface');
    extension
      .addInstructionOrExpressionGroupMetadata(_('Text Input'))
      .setIcon('JsPlatform/Extensions/text_input.svg');

    const textInputObject = new gd.ObjectJsImplementation();
    textInputObject.updateProperty = function (propertyName, newValue) {
      const objectContent = this.content;
      if (propertyName === 'initialValue') {
        objectContent.initialValue = newValue;
        return true;
      } else if (propertyName === 'placeholder') {
        objectContent.placeholder = newValue;
        return true;
      } else if (propertyName === 'fontResourceName') {
        objectContent.fontResourceName = newValue;
        return true;
      } else if (propertyName === 'fontSize') {
        objectContent.fontSize = Math.max(1, parseFloat(newValue));
        return true;
      } else if (propertyName === 'inputType') {
        const normalizedValue = newValue.toLowerCase();
        if (
          normalizedValue === 'text' ||
          normalizedValue === 'text area' ||
          normalizedValue === 'email' ||
          normalizedValue === 'password' ||
          normalizedValue === 'number' ||
          normalizedValue === 'telephone number' ||
          normalizedValue === 'url' ||
          normalizedValue === 'search'
        ) {
          objectContent.inputType = normalizedValue;
          return true;
        }
        return false;
      } else if (propertyName === 'textColor') {
        objectContent.textColor = newValue;
        return true;
      } else if (propertyName === 'fillColor') {
        objectContent.fillColor = newValue;
        return true;
      } else if (propertyName === 'fillOpacity') {
        objectContent.fillOpacity = Math.max(
          0,
          Math.min(255, parseFloat(newValue))
        );
        return true;
      } else if (propertyName === 'borderColor') {
        objectContent.borderColor = newValue;
        return true;
      } else if (propertyName === 'borderOpacity') {
        objectContent.borderOpacity = Math.max(
          0,
          Math.min(255, parseFloat(newValue))
        );
        return true;
      } else if (propertyName === 'borderWidth') {
        objectContent.borderWidth = Math.max(0, parseFloat(newValue));
        return true;
      } else if (propertyName === 'readOnly') {
        objectContent.readOnly = newValue === '1';
        return true;
      } else if (propertyName === 'disabled') {
        objectContent.disabled = newValue === '1';
        return true;
      } else if (propertyName === 'spellCheck') {
        objectContent.spellCheck = newValue === '1';
        return true;
      } else if (propertyName === 'maxLength') {
        objectContent.maxLength = newValue;
        return true;
      } else if (propertyName === 'paddingX') {
        objectContent.paddingX = Math.max(0, parseFloat(newValue));
        return true;
      } else if (propertyName === 'paddingY') {
        objectContent.paddingY = Math.max(0, parseFloat(newValue));
        return true;
      } else if (propertyName === 'textAlign') {
        const normalizedValue = newValue.toLowerCase();
        if (
          normalizedValue === 'left' ||
          normalizedValue === 'center' ||
          normalizedValue === 'right'
        ) {
          objectContent.textAlign = normalizedValue;
          return true;
        }
        return false;
      }

      return false;
    };
    textInputObject.getProperties = function () {
      const objectProperties = new gd.MapStringPropertyDescriptor();
      const objectContent = this.content;

      objectProperties
        .getOrCreate('initialValue')
        .setValue(objectContent.initialValue)
        .setType('string')
        .setLabel(_('Initial value'))
        .setGroup(_('Content'));

      objectProperties
        .getOrCreate('placeholder')
        .setValue(objectContent.placeholder)
        .setType('string')
        .setLabel(_('Placeholder'))
        .setGroup(_('Content'));

      objectProperties
        .getOrCreate('fontResourceName')
        .setValue(objectContent.fontResourceName || '')
        .setType('resource')
        .addExtraInfo('font')
        .setLabel(_('Font'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('fontSize')
        .setValue((objectContent.fontSize || 20).toString())
        .setType('number')
        .setLabel(_('Font size (px)'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('inputType')
        .setValue(objectContent.inputType || '')
        .setType('choice')
        .addChoice('text', _('Text'))
        .addChoice('text area', _('Text area'))
        .addChoice('email', _('Email'))
        .addChoice('password', _('Password'))
        .addChoice('number', _('Number'))
        .addChoice('telephone number', _('Telephone number'))
        .addChoice('url', _('URL'))
        .addChoice('search', _('Search'))
        .setLabel(_('Input type'))
        .setDescription(
          _(
            'By default, a "text" is single line. Choose "text area" to allow multiple lines to be entered.'
          )
        );

      objectProperties
        .getOrCreate('readOnly')
        .setValue(objectContent.readOnly ? 'true' : 'false')
        .setType('boolean')
        .setLabel(_('Read only'))
        .setGroup(_('Field'));

      objectProperties
        .getOrCreate('disabled')
        .setValue(objectContent.disabled ? 'true' : 'false')
        .setType('boolean')
        .setLabel(_('Disabled'))
        .setGroup(_('Field'));

      objectProperties
        .getOrCreate('spellCheck')
        .setValue(objectContent.spellCheck ? 'true' : 'false')
        .setType('boolean')
        .setLabel(_('Enable spell check'))
        .setGroup(_('Field'));

      objectProperties
        .getOrCreate('textColor')
        .setValue(objectContent.textColor || '0;0;0')
        .setType('color')
        .setLabel(_('Text color'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('fillColor')
        .setValue(objectContent.fillColor || '255;255;255')
        .setType('color')
        .setLabel(_('Fill color'))
        .setGroup(_('Field appearance'));

      objectProperties
        .getOrCreate('fillOpacity')
        .setValue(
          (objectContent.fillOpacity != undefined
            ? objectContent.fillOpacity
            : 255
          ).toString()
        )
        .setType('number')
        .setLabel(_('Fill opacity'))
        .setGroup(_('Field appearance'));

      objectProperties
        .getOrCreate('borderColor')
        .setValue(objectContent.borderColor || '0;0;0')
        .setType('color')
        .setLabel(_('Color'))
        .setGroup(_('Border appearance'));

      objectProperties
        .getOrCreate('borderOpacity')
        .setValue(
          (objectContent.borderOpacity != undefined
            ? objectContent.borderOpacity
            : 255
          ).toString()
        )
        .setType('number')
        .setLabel(_('Opacity'))
        .setGroup(_('Border appearance'));

      objectProperties
        .getOrCreate('borderWidth')
        .setValue((objectContent.borderWidth || 0).toString())
        .setType('number')
        .setLabel(_('Width'))
        .setGroup(_('Border appearance'));

      objectProperties
        .getOrCreate('paddingX')
        .setValue(
          (objectContent.paddingX !== undefined
            ? objectContent.paddingX
            : 2
          ).toString()
        )
        .setType('number')
        .setLabel(_('Padding (horizontal)'))
        .setGroup(_('Field appearance'));
      objectProperties
        .getOrCreate('paddingY')
        .setValue(
          (objectContent.paddingY !== undefined
            ? objectContent.paddingY
            : 1
          ).toString()
        )
        .setType('number')
        .setLabel(_('Padding (vertical)'))
        .setGroup(_('Field appearance'));
      objectProperties
        .getOrCreate('maxLength')
        .setValue((objectContent.maxLength || 0).toString())
        .setType('number')
        .setLabel(_('Max length'))
        .setDescription(
          _(
            'The maximum length of the input value (this property will be ignored if the input type is a number).'
          )
        )
        .setAdvanced(true);

      objectProperties
        .getOrCreate('textAlign')
        .setValue(objectContent.textAlign || 'left')
        .setType('choice')
        .addChoice('left', _('Left'))
        .addChoice('center', _('Center'))
        .addChoice('right', _('Right'))
        .setLabel(_('Text alignment'))
        .setGroup(_('Field appearance'));

      return objectProperties;
    };
    textInputObject.content = {
      initialValue: '',
      placeholder: 'Touch to start typing',
      fontResourceName: '',
      fontSize: 20,
      inputType: 'text',
      textColor: '0;0;0',
      fillColor: '255;255;255',
      fillOpacity: 255,
      borderColor: '0;0;0',
      borderOpacity: 255,
      borderWidth: 1,
      readOnly: false,
      disabled: false,
      spellCheck: false,
      paddingX: 2,
      paddingY: 1,
      textAlign: 'left',
      maxLength: 0,
    };

    textInputObject.updateInitialInstanceProperty = function (
      instance,
      propertyName,
      newValue
    ) {
      if (propertyName === 'initialValue') {
        instance.setRawStringProperty('initialValue', newValue);
        return true;
      } else if (propertyName === 'placeholder') {
        instance.setRawStringProperty('placeholder', newValue);
        return true;
      }

      return false;
    };
    textInputObject.getInitialInstanceProperties = function (instance) {
      const instanceProperties = new gd.MapStringPropertyDescriptor();

      instanceProperties
        .getOrCreate('initialValue')
        .setValue(instance.getRawStringProperty('initialValue'))
        .setType('string')
        .setLabel(_('Initial value'));
      instanceProperties
        .getOrCreate('placeholder')
        .setValue(instance.getRawStringProperty('placeholder'))
        .setType('string')
        .setLabel(_('Placeholder'));

      return instanceProperties;
    };

    const object = extension
      .addObject(
        'TextInputObject',
        _('Text input'),
        _('A text field the player can type text into.'),
        'JsPlatform/Extensions/text_input.svg',
        textInputObject
      )
      .setCategory('User interface')
      // Effects are unsupported because the object is rendered as a DOM element.
      .setIncludeFile('Extensions/TextInput/textinputruntimeobject.js')
      .addIncludeFile(
        'Extensions/TextInput/textinputruntimeobject-three-renderer.js'
      )
      .addDefaultBehavior('TextContainerCapability::TextContainerBehavior')
      .addDefaultBehavior('ResizableCapability::ResizableBehavior')
      .addDefaultBehavior('OpacityCapability::OpacityBehavior');

    // Properties expressions/conditions/actions:

    // Deprecated, see TextContainerCapability
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
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters(
        'string',
        gd.ParameterOptions.makeNewOptions().setDescription(_('Text'))
      )
      .setFunctionName('setText')
      .setGetter('getText');

    // Deprecated, see TextContainerCapability
    object
      .addStrExpression(
        'Text',
        _('Text'),
        _('Return the text.'),
        '',
        'res/conditions/text24_black.png'
      )
      .setHidden()
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .setFunctionName('getText');

    object
      .addExpressionAndConditionAndAction(
        'string',
        'Placeholder',
        _('Placeholder'),
        _('the placeholder'),
        _('the placeholder'),
        '',
        'res/conditions/text24_black.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters(
        'string',
        gd.ParameterOptions.makeNewOptions().setDescription(_('Text'))
      )
      .setFunctionName('setPlaceholder')
      .setGetter('getPlaceholder');

    object
      .addExpressionAndConditionAndAction(
        'number',
        'Font size',
        _('Font size'),
        _('the font size'),
        _('the font size'),
        _('Font'),
        'res/conditions/opacity24.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters('number', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('setFontSize')
      .setGetter('getFontSize');

    object
      .addExpressionAndCondition(
        'string',
        'FontResourceName',
        _('Font name'),
        _('the font name'),
        _('the font name'),
        _('Font'),
        'res/conditions/font24.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters('string', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('getFontResourceName');

    // TODO: could this be merged with the previous expression and condition?
    object
      .addScopedAction(
        'SetFontResourceName',
        _('Font name'),
        _('Set the font of the object.'),
        _('Set the font of _PARAM0_ to _PARAM1_'),
        _('Font'),
        'res/actions/font24.png',
        'res/actions/font.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .addParameter('fontResource', _('Font resource name'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setFontResourceName');

    object
      .addExpressionAndConditionAndAction(
        'string',
        'InputType',
        _('Input type'),
        _('the input type'),
        _('the input type'),
        _('Type'),
        'res/conditions/text24_black.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters(
        'stringWithSelector',
        gd.ParameterOptions.makeNewOptions()
          .setDescription(_('Input type'))
          .setTypeExtraInfo(
            JSON.stringify([
              'text',
              'text area',
              'email',
              'password',
              'number',
              'telephone number',
              'url',
              'search',
            ])
          )
      )
      .setFunctionName('setInputType')
      .setGetter('getInputType');

    object
      .addScopedAction(
        'SetTextColor',
        _('Text color'),
        _('Set the text color of the object.'),
        _('Set the text color of _PARAM0_ to _PARAM1_'),
        _('Field appearance'),
        'res/actions/color24.png',
        'res/actions/color.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .addParameter('color', _('Color'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setTextColor');

    object
      .addScopedAction(
        'SetFillColor',
        _('Fill color'),
        _('Set the fill color of the object.'),
        _('Set the fill color of _PARAM0_ to _PARAM1_'),
        _('Field appearance'),
        'res/actions/color24.png',
        'res/actions/color.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .addParameter('color', _('Color'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setFillColor');

    object
      .addExpressionAndConditionAndAction(
        'number',
        'FillOpacity',
        _('Fill opacity'),
        _('the fill opacity, between 0 (fully transparent) and 255 (opaque)'),
        _('the fill opacity'),
        _('Field appearance'),
        'res/conditions/opacity24.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Opacity (0-255)')
        )
      )
      .setFunctionName('setFillOpacity')
      .setGetter('getFillOpacity');

    object
      .addScopedAction(
        'SetBorderColor',
        _('Border color'),
        _('Set the border color of the object.'),
        _('Set the border color of _PARAM0_ to _PARAM1_'),
        _('Field appearance'),
        'res/actions/color24.png',
        'res/actions/color.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .addParameter('color', _('Color'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setBorderColor');

    object
      .addExpressionAndConditionAndAction(
        'number',
        'BorderOpacity',
        _('Border opacity'),
        _('the border opacity, between 0 (fully transparent) and 255 (opaque)'),
        _('the border opacity'),
        _('Field appearance'),
        'res/conditions/opacity24.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Opacity (0-255)')
        )
      )
      .setFunctionName('setBorderOpacity')
      .setGetter('getBorderOpacity');

    object
      .addExpressionAndConditionAndAction(
        'number',
        'BorderWidth',
        _('Border width'),
        _('the border width'),
        _('the border width'),
        _('Field appearance'),
        'res/conditions/outlineSize24_black.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters('number', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('setBorderWidth')
      .setGetter('getBorderWidth');

    // TODO: expressions for colors?

    object
      .addExpressionAndConditionAndAction(
        'boolean',
        'ReadOnly',
        _('Read-only'),
        _('the text input is read-only'),
        _('read-only'),
        '',
        'res/conditions/text24_black.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters(
        'boolean',
        gd.ParameterOptions.makeNewOptions().setDescription(_('Read-only?'))
      )
      .setFunctionName('setReadOnly')
      .setGetter('isReadOnly');

    object
      .addExpressionAndConditionAndAction(
        'boolean',
        'Disabled',
        _('Disabled'),
        _('the text input is disabled'),
        _('disabled'),
        '',
        'res/conditions/text24_black.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters('boolean', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('setDisabled')
      .setGetter('isDisabled');

    object
      .addExpressionAndConditionAndAction(
        'boolean',
        'SpellCheck',
        _('Spell check enabled'),
        _('spell check is enabled'),
        _('spell check enabled'),
        '',
        'res/conditions/text24_black.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .useStandardParameters('boolean', gd.ParameterOptions.makeNewOptions())
      .setFunctionName('setSpellCheck')
      .setGetter('isSpellCheckEnabled');

    // Other expressions/conditions/actions:

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
      .addParameter('object', _('Text input'), 'TextInputObject', false)
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
      .addScopedCondition(
        'Focused',
        _('Focused'),
        _(
          'Check if the text input is focused (the cursor is in the field and player can type text in).'
        ),
        _('_PARAM0_ is focused'),
        '',
        'res/conditions/surObjet24.png',
        'res/conditions/surObjet.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isFocused');

    object
      .addScopedCondition(
        'IsInputSubmitted',
        _('Input is submitted'),
        _(
          'Check if the input is submitted, which usually happens when the Enter key is pressed on a keyboard, or a specific button on mobile virtual keyboards.'
        ),
        _('_PARAM0_ value was submitted'),
        '',
        'res/conditions/surObjet24.png',
        'res/conditions/surObjet.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isSubmitted');

    object
      .addScopedAction(
        'Focus',
        _('Focus'),
        _(
          'Focus the input so that text can be entered (like if it was touched/clicked).'
        ),
        _('Focus _PARAM0_'),
        _(''),
        'res/conditions/surObjet24.png',
        'res/conditions/surObjet.png'
      )
      .addParameter('object', _('Text input'), 'TextInputObject', false)
      .getCodeExtraInformation()
      .setFunctionName('focus');

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
      'TextInput::TextInputObject',
      objectsEditorService.getDefaultObjectJsImplementationPropertiesEditor({
        helpPagePath: '/objects/text_input',
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

    const DEFAULT_WIDTH = 300;
    const DEFAULT_HEIGHT = 30;

    class RenderedTextInputObjectInstance extends RenderedInstance {
      constructor(
        project,
        instance,
        associatedObjectConfiguration,
        threeGroup,
        resourcesLoader
      ) {
        super(
          project,
          instance,
          associatedObjectConfiguration,
          threeGroup,
          resourcesLoader
        );

        this._fontResourceName = '';
        this._finalTextColor = 0x0;
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

      onRemovedFromScene() {
        super.onRemovedFromScene();
        if (this._threeObject) {
          if (this._threeObject.material) this._threeObject.material.dispose();
          if (this._threeObject.geometry) this._threeObject.geometry.dispose();
          this._threeObject.userData.instance = null;
          this._threeObject = null;
        }
        if (this._canvasTexture) this._canvasTexture.dispose();
      }

      static getThumbnail(project, resourcesLoader, objectConfiguration) {
        return 'JsPlatform/Extensions/text_input.svg';
      }

      update() {
        if (!this._threeObject || !this._context) return;
        const instance = this._instance;
        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );

        const placeholder =
          instance.getRawStringProperty('placeholder') ||
          object.content.placeholder;
        const initialValue =
          instance.getRawStringProperty('initialValue') ||
          object.content.initialValue;
        const hasInitialValue = initialValue !== '';
        const displayedText = hasInitialValue
          ? initialValue
          : placeholder || ' ';

        const textColor = object.content.textColor;
        const finalTextColor = hasInitialValue
          ? objectsRenderingService.rgbOrHexToHexNumber(textColor)
          : 0x888888;
        if (this._finalTextColor !== finalTextColor) {
          this._finalTextColor = finalTextColor;
        }

        const fontSize = object.content.fontSize;

        const fontResourceName = object.content.fontResourceName;
        if (this._fontResourceName !== fontResourceName) {
          this._fontResourceName = fontResourceName;

          this._resourcesLoader
            .loadFontFamily(this._project, fontResourceName)
            .then((fontFamily) => {
              if (this._wasDestroyed) return;
              this._fontFamily = fontFamily;
              this.update();
            })
            .catch((err) => {
              console.warn(
                'Unable to load font family for RenderedTextInputObjectInstance',
                err
              );
            });
        }

        // Position the object.
        let width = DEFAULT_WIDTH;
        let height = DEFAULT_HEIGHT;
        if (instance.hasCustomSize()) {
          width = this.getCustomWidth();
          height = this.getCustomHeight();
        }

        const borderWidth = object.content.borderWidth || 0;
        const paddingX =
          object.content.paddingX !== undefined
            ? Math.min(
                parseFloat(object.content.paddingX),
                width / 2 - borderWidth
              )
            : 2;
        const paddingY =
          object.content.paddingY !== undefined
            ? Math.min(
                parseFloat(object.content.paddingY),
                height / 2 - borderWidth
              )
            : 1;

        const textOffsetX = borderWidth + paddingX;
        const textOffsetY = borderWidth;

        const isTextArea = object.content.inputType === 'text area';
        const textAlign = object.content.textAlign
          ? object.content.textAlign
          : 'left';
        const fillColor = object.content.fillColor;
        const fillOpacity = object.content.fillOpacity;
        const borderColor = object.content.borderColor;
        const borderOpacity = object.content.borderOpacity;
        const textAlignCanvas =
          textAlign === 'right'
            ? 'right'
            : textAlign === 'center'
              ? 'center'
              : 'left';
        const fontFamily = this._fontFamily || 'Arial';
        this._context.font = `${fontSize}px ${fontFamily}`;
        const canvasWidth = Math.max(1, Math.ceil(width));
        const canvasHeight = Math.max(1, Math.ceil(height));
        if (
          this._canvas.width !== canvasWidth ||
          this._canvas.height !== canvasHeight
        ) {
          this._canvas.width = canvasWidth;
          this._canvas.height = canvasHeight;
        }
        this._context.clearRect(0, 0, canvasWidth, canvasHeight);
        this._context.fillStyle = `rgba(${(fillOpacity / 255).toFixed(3)}, ${(fillOpacity / 255).toFixed(3)}, ${(fillOpacity / 255).toFixed(3)}, 1)`;
        const fillHex = objectsRenderingService.rgbOrHexToHexNumber(fillColor);
        const borderHex =
          objectsRenderingService.rgbOrHexToHexNumber(borderColor);
        const fillRgb = [
          (fillHex >> 16) & 255,
          (fillHex >> 8) & 255,
          fillHex & 255,
        ];
        const borderRgb = [
          (borderHex >> 16) & 255,
          (borderHex >> 8) & 255,
          borderHex & 255,
        ];
        this._context.fillStyle = `rgba(${fillRgb[0]}, ${fillRgb[1]}, ${fillRgb[2]}, ${fillOpacity / 255})`;
        this._context.fillRect(0, 0, width, height);
        if (borderWidth > 0) {
          this._context.lineWidth = borderWidth;
          this._context.strokeStyle = `rgba(${borderRgb[0]}, ${borderRgb[1]}, ${borderRgb[2]}, ${borderOpacity / 255})`;
          this._context.strokeRect(
            borderWidth / 2,
            borderWidth / 2,
            width - borderWidth,
            height - borderWidth
          );
        }

        this._context.font = `${fontSize}px ${fontFamily}`;
        this._context.textBaseline = 'top';
        this._context.textAlign = textAlignCanvas;
        const textRgb = [
          (finalTextColor >> 16) & 255,
          (finalTextColor >> 8) & 255,
          finalTextColor & 255,
        ];
        this._context.fillStyle = `rgb(${textRgb[0]}, ${textRgb[1]}, ${textRgb[2]})`;
        let textX = textOffsetX;
        if (textAlignCanvas === 'center') textX = width / 2;
        if (textAlignCanvas === 'right') textX = width - textOffsetX;
        const textHeight = fontSize;
        const textY = isTextArea
          ? textOffsetY + paddingY
          : height / 2 - textHeight / 2;
        this._context.save();
        this._context.beginPath();
        this._context.rect(
          textOffsetX,
          textOffsetY,
          width - 2 * textOffsetX,
          height - 2 * textOffsetY
        );
        this._context.clip();
        this._context.fillText(
          displayedText,
          textX,
          textY,
          width - 2 * textOffsetX
        );
        this._context.restore();
        this._canvasTexture.needsUpdate = true;

        this._threeObject.position.x = instance.getX() + width / 2;
        this._threeObject.position.y = instance.getY() + height / 2;
        this._threeObject.rotation.z = RenderedInstance.toRad(
          this._instance.getAngle()
        );
        this._threeObject.scale.set(width, height, 1);

        const alphaForDisplay = Math.max(
          this._instance.getOpacity() / 255,
          0.5
        );
        this._threeObject.material.opacity = alphaForDisplay;
        this._threeObject.material.transparent = true;
      }

      getDefaultWidth() {
        return DEFAULT_WIDTH;
      }

      getDefaultHeight() {
        return DEFAULT_HEIGHT;
      }
    }

    objectsRenderingService.registerInstanceRenderer(
      'TextInput::TextInputObject',
      RenderedTextInputObjectInstance
    );
  },
};
