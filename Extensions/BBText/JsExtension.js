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

const stringifyOptions = (options) => '["' + options.join('","') + '"]';

const cloneBBTextStyle = (style) => ({ ...style });

const normalizeBBTextColor = (color, fallback) => {
  if (!color) return fallback;
  const normalizedColor = color.trim();
  if (!normalizedColor) return fallback;
  if (normalizedColor.includes(';')) {
    const rgb = normalizedColor
      .split(';')
      .map((component) => parseInt(component, 10));
    return `rgb(${rgb[0] || 0}, ${rgb[1] || 0}, ${rgb[2] || 0})`;
  }
  if (normalizedColor[0] === '#') return normalizedColor;
  return normalizedColor;
};

const applyBBTextTag = (style, tagName, tagValue) => {
  const nextStyle = cloneBBTextStyle(style);
  if (tagName === 'b') nextStyle.fontWeight = 'bold';
  else if (tagName === 'i') nextStyle.fontStyle = 'italic';
  else if (tagName === 'color')
    nextStyle.fill = normalizeBBTextColor(tagValue, nextStyle.fill);
  else if (tagName === 'size') {
    const parsedSize = parseFloat(tagValue || '');
    if (!isNaN(parsedSize)) nextStyle.fontSize = Math.max(1, parsedSize);
  } else if (tagName === 'font' && tagValue) nextStyle.fontFamily = tagValue;
  else if (tagName === 'outline') {
    nextStyle.stroke = normalizeBBTextColor(tagValue, nextStyle.fill);
    nextStyle.strokeThickness = Math.max(1, nextStyle.fontSize / 8);
  } else if (tagName === 'shadow') {
    nextStyle.shadowColor = normalizeBBTextColor(tagValue, '#000000');
    nextStyle.shadowBlur = Math.max(1, nextStyle.fontSize / 10);
    nextStyle.shadowDistance = Math.max(1, nextStyle.fontSize / 10);
  } else if (tagName === 'spacing') {
    const parsedSpacing = parseFloat(tagValue || '');
    if (!isNaN(parsedSpacing)) nextStyle.letterSpacing = parsedSpacing;
  }

  return nextStyle;
};

const parseBBTextSegments = (text, baseStyle) => {
  const stylesStack = [
    { tagName: 'default', style: cloneBBTextStyle(baseStyle) },
  ];
  const segments = [];
  const tagRegExp =
    /\[(\/?)(b|i|color|size|font|outline|shadow|spacing)(?:=([^\]]+))?\]/gi;
  let lastIndex = 0;
  let match;

  while ((match = tagRegExp.exec(text))) {
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      const lines = plainText.split('\n');
      for (let index = 0; index < lines.length; index++) {
        if (lines[index]) {
          segments.push({
            text: lines[index],
            style: cloneBBTextStyle(stylesStack[stylesStack.length - 1].style),
          });
        }
        if (index < lines.length - 1) segments.push({ newline: true });
      }
    }

    const isClosingTag = match[1] === '/';
    const tagName = (match[2] || '').toLowerCase();
    const tagValue = match[3];

    if (isClosingTag) {
      for (
        let stackIndex = stylesStack.length - 1;
        stackIndex > 0;
        stackIndex--
      ) {
        if (stylesStack[stackIndex].tagName === tagName) {
          stylesStack.splice(stackIndex, 1);
          break;
        }
      }
    } else {
      stylesStack.push({
        tagName,
        style: applyBBTextTag(
          stylesStack[stylesStack.length - 1].style,
          tagName,
          tagValue
        ),
      });
    }

    lastIndex = tagRegExp.lastIndex;
  }

  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    const lines = plainText.split('\n');
    for (let index = 0; index < lines.length; index++) {
      if (lines[index]) {
        segments.push({
          text: lines[index],
          style: cloneBBTextStyle(stylesStack[stylesStack.length - 1].style),
        });
      }
      if (index < lines.length - 1) segments.push({ newline: true });
    }
  }

  return segments.length
    ? segments
    : [{ text: ' ', style: cloneBBTextStyle(baseStyle) }];
};

const getBBTextFontString = (style) => {
  const parts = [];
  if (style.fontStyle !== 'normal') parts.push(style.fontStyle);
  if (style.fontWeight !== 'normal') parts.push(style.fontWeight);
  parts.push(`${style.fontSize}px`);
  parts.push(`"${style.fontFamily}"`);
  return parts.join(' ');
};

const measureBBTextSegmentWidth = (context, text, style) => {
  if (!text.length) return 0;
  context.font = getBBTextFontString(style);
  let width = 0;
  for (let index = 0; index < text.length; index++) {
    width += context.measureText(text[index]).width;
    if (index < text.length - 1) width += style.letterSpacing;
  }
  return width;
};

const buildBBTextLines = (context, parsedSegments, maxWidth) => {
  /** @type {Array<any>} */
  const lines = [];
  let currentLine = {
    height: 1,
    segments: /** @type {Array<any>} */ ([]),
    width: 0,
  };

  const pushCurrentLine = () => {
    lines.push(currentLine);
    currentLine = {
      height: 1,
      segments: /** @type {Array<any>} */ ([]),
      width: 0,
    };
  };

  const appendChunk = (text, style) => {
    if (!text.length) return;
    let chunk = '';

    for (const character of text) {
      const candidate = chunk + character;
      const candidateWidth = measureBBTextSegmentWidth(
        context,
        candidate,
        style
      );
      if (
        maxWidth > 0 &&
        currentLine.width > 0 &&
        currentLine.width + candidateWidth > maxWidth
      ) {
        const chunkWidth = measureBBTextSegmentWidth(context, chunk, style);
        currentLine.segments.push({ text: chunk, style, width: chunkWidth });
        currentLine.width += chunkWidth;
        currentLine.height = Math.max(
          currentLine.height,
          Math.ceil(
            style.fontSize * 1.2 + style.strokeThickness + style.shadowDistance
          )
        );
        pushCurrentLine();
        chunk = character;
      } else {
        chunk = candidate;
      }
    }

    if (!chunk.length) return;
    const chunkWidth = measureBBTextSegmentWidth(context, chunk, style);
    currentLine.segments.push({ text: chunk, style, width: chunkWidth });
    currentLine.width += chunkWidth;
    currentLine.height = Math.max(
      currentLine.height,
      Math.ceil(
        style.fontSize * 1.2 + style.strokeThickness + style.shadowDistance
      )
    );
  };

  for (const parsedSegment of parsedSegments) {
    if (parsedSegment.newline) {
      pushCurrentLine();
      continue;
    }
    appendChunk(parsedSegment.text || ' ', parsedSegment.style);
  }

  lines.push(currentLine);
  return lines.length ? lines : [{ height: 1, segments: [], width: 0 }];
};

/** @type {ExtensionModule} */
module.exports = {
  createExtension: function (_, gd) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        'BBText',
        _('BBCode Text Object'),
        'A BBText is an object displaying on the screen a rich text formatted using BBCode markup (allowing to set parts of the text as bold, italic, use different colors and shadows).',
        'Todor Imreorov',
        'Open source (MIT License)'
      )
      .setShortDescription(
        'Rich text with BBCode markup: bold, italic, colors, sizes, shadows in a single object.'
      )
      .setDimension('2D')
      .setExtensionHelpPath('/objects/bbtext')
      .setCategory('Text');
    extension
      .addInstructionOrExpressionGroupMetadata(_('BBCode Text Object'))
      .setIcon('JsPlatform/Extensions/bbcode32.png');

    var objectBBText = new gd.ObjectJsImplementation();
    objectBBText.updateProperty = function (propertyName, newValue) {
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
    objectBBText.getProperties = function () {
      const objectProperties = new gd.MapStringPropertyDescriptor();
      const objectContent = this.content;

      objectProperties
        .getOrCreate('text')
        .setValue(objectContent.text)
        .setType('multilinestring')
        .setLabel(_('BBCode text'));

      objectProperties
        .getOrCreate('color')
        .setValue(objectContent.color)
        .setType('color')
        .setLabel(_('Base color'))
        .setGroup(_('Appearance'));

      objectProperties
        .getOrCreate('fontSize')
        .setValue(objectContent.fontSize.toString())
        .setType('number')
        .setLabel(_('Base size'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('align')
        .setValue(objectContent.align)
        .setType('choice')
        .addChoice('left', _('Left'))
        .addChoice('center', _('Center'))
        .addChoice('right', _('Right'))
        .setLabel(_('Base alignment'))
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
        .getOrCreate('fontFamily')
        .setValue(objectContent.fontFamily)
        .setType('resource')
        .addExtraInfo('font')
        .setLabel(_('Font'))
        .setGroup(_('Font'));

      objectProperties
        .getOrCreate('visible')
        .setValue(objectContent.visible ? 'true' : 'false')
        .setType('boolean')
        .setLabel(_('Visible on start'))
        .setGroup(_('Appearance'));

      return objectProperties;
    };
    objectBBText.content = {
      text: '[b]bold[/b] [i]italic[/i] [size=15]smaller[/size] [font=times]times[/font] font\n[spacing=12]spaced out[/spacing]\n[outline=yellow]outlined[/outline] [shadow=red]DropShadow[/shadow] ',
      opacity: 255,
      fontSize: 20,
      visible: true,
      color: '0;0;0',
      fontFamily: 'Arial',
      align: 'left',
      verticalTextAlignment: 'top',
    };

    objectBBText.updateInitialInstanceProperty = function (
      instance,
      propertyName,
      newValue
    ) {
      return false;
    };
    objectBBText.getInitialInstanceProperties = function (instance) {
      var instanceProperties = new gd.MapStringPropertyDescriptor();
      return instanceProperties;
    };

    const object = extension
      .addObject(
        'BBText',
        _('BBText'),
        _('Formatted text allowing to mix styles using BBCode markup.'),
        'JsPlatform/Extensions/bbcode32.png',
        objectBBText
      )
      .setIncludeFile('Extensions/BBText/bbtextruntimeobject.js')
      .addIncludeFile('Extensions/BBText/bbtextruntimeobject-renderer.js')
      .addIncludeFile('Extensions/BBText/bbtextruntimeobject-pixi-renderer.js')
      .setCategory('Text')
      .addDefaultBehavior('EffectCapability::EffectBehavior')
      .addDefaultBehavior('OpacityCapability::OpacityBehavior');

    /**
     * Utility function to add both a setter and a getter to a property from a list.
     * Useful for setting multiple generic properties.
     */
    const addSettersAndGettersToObject = (gdObject, properties, objectName) => {
      properties.forEach((property) => {
        const parameterType =
          property.type === 'boolean' ? 'yesorno' : property.type;

        // Add the expression
        if (parameterType === 'number') {
          gdObject
            .addExpression(
              `Get${property.functionName}`,
              property.expressionLabel,
              property.expressionDescription,
              '',
              property.iconPath
            )
            .addParameter('object', objectName, objectName, false)
            .getCodeExtraInformation()
            .setFunctionName(`get${property.functionName}`);
        } else if (
          parameterType === 'string' ||
          parameterType === 'stringWithSelector'
        ) {
          gdObject
            .addStrExpression(
              `Get${property.functionName}`,
              property.expressionLabel,
              property.expressionDescription,
              '',
              property.iconPath
            )
            .addParameter('object', objectName, objectName, false)
            .getCodeExtraInformation()
            .setFunctionName(`get${property.functionName}`);
        }

        // Add the action
        if (
          parameterType === 'number' ||
          parameterType === 'string' ||
          parameterType === 'stringWithSelector'
        ) {
          const parameterOptions =
            gd.ParameterOptions.makeNewOptions().setDescription(
              property.paramLabel
            );
          if (property.options) {
            parameterOptions.setTypeExtraInfo(
              stringifyOptions(property.options)
            );
          }
          gdObject
            .addAction(
              `Set${property.functionName}`,
              property.instructionLabel,
              property.actionDescription,
              property.actionSentence,
              '',
              property.iconPath,
              property.iconPath
            )
            .addParameter('object', objectName, objectName, false)
            .useStandardOperatorParameters(parameterType, parameterOptions)
            .getCodeExtraInformation()
            .setFunctionName(`set${property.functionName}`)
            .setGetter(`get${property.functionName}`);
        } else {
          gdObject
            .addAction(
              `Set${property.functionName}`,
              property.instructionLabel,
              property.actionDescription,
              property.actionSentence,
              '',
              property.iconPath,
              property.iconPath
            )
            .addParameter('object', objectName, objectName, false)
            .addParameter(
              parameterType,
              property.paramLabel,
              '', // There should not be options for the property if it's not a stringWithSelector
              false
            )
            .getCodeExtraInformation()
            .setFunctionName(`set${property.functionName}`)
            .setGetter(`get${property.functionName}`);
        }

        // Add condition
        if (
          parameterType === 'string' ||
          parameterType === 'number' ||
          parameterType === 'stringWithSelector'
        ) {
          const parameterOptions =
            gd.ParameterOptions.makeNewOptions().setDescription(
              property.paramLabel
            );
          if (property.options) {
            parameterOptions.setTypeExtraInfo(
              stringifyOptions(property.options)
            );
          }
          gdObject
            .addCondition(
              `Is${property.functionName}`,
              property.instructionLabel,
              property.conditionDescription,
              property.conditionSentence,
              '',
              property.iconPath,
              property.iconPath
            )
            .addParameter('object', objectName, objectName, false)
            .useStandardRelationalOperatorParameters(
              parameterType,
              parameterOptions
            )
            .getCodeExtraInformation()
            .setFunctionName(`get${property.functionName}`);
        } else if (parameterType === 'yesorno') {
          gdObject
            .addCondition(
              `Is${property.functionName}`,
              property.instructionLabel,
              property.conditionDescription,
              property.conditionSentence,
              '',
              property.iconPath,
              property.iconPath
            )
            .addParameter('object', objectName, objectName, false)
            .getCodeExtraInformation()
            .setFunctionName(`get${property.functionName}`);
        }
      });
    };

    const setterAndGetterProperties = [
      {
        functionName: 'BBText',
        iconPath: 'res/actions/text24_black.png',
        type: 'string',
        instructionLabel: _('BBCode text'),
        paramLabel: _('Text'),
        conditionDescription: _('Compare the value of the BBCode text.'),
        conditionSentence: _('the BBCode text'),
        actionDescription: _('Set BBCode text'),
        actionSentence: _('the BBCode text'),
        expressionLabel: _('Get BBCode text'),
        expressionDescription: _('Get BBCode text'),
      },
      {
        functionName: 'Color',
        iconPath: 'res/actions/color24.png',
        type: 'color',
        instructionLabel: _('Color'),
        paramLabel: _('Color (R;G;B)'),
        conditionDescription: '', // No conditions for a "color" property
        conditionSentence: '', // No conditions for a "color" property
        actionDescription: _('Set base color'),
        actionSentence: _('Set base color of _PARAM0_ to _PARAM1_'),
        expressionLabel: '', // No expression for a "color" property
        expressionDescription: '', // No expression for a "color" property
      },
      {
        functionName: 'Opacity',
        iconPath: 'res/actions/opacity24.png',
        type: 'number',
        instructionLabel: _('Opacity'),
        paramLabel: _('Opacity (0-255)'),
        conditionDescription: _(
          'Compare the value of the base opacity of the text.'
        ),
        conditionSentence: _('the base opacity'),
        actionDescription: _('Set base opacity'),
        actionSentence: _('the base opacity'),
        expressionLabel: _('Get the base opacity'),
        expressionDescription: _('Get the base opacity'),
      },
      {
        functionName: 'FontSize',
        iconPath: 'res/actions/characterSize24.png',
        type: 'number',
        instructionLabel: _('Font size'),
        paramLabel: _('Font size'),
        conditionDescription: _('Compare the base font size of the text.'),
        conditionSentence: _('the base font size'),
        actionDescription: _('Set base font size'),
        actionSentence: _('the base font size'),
        expressionLabel: _('Get the base font size'),
        expressionDescription: _('Get the base font size'),
      },
      {
        functionName: 'FontFamily',
        iconPath: 'res/actions/font24.png',
        type: 'string',
        instructionLabel: _('Font family'),
        paramLabel: _('Font family'),
        conditionDescription: _('Compare the value of font family'),
        conditionSentence: _('the base font family'),
        actionDescription: _('Set font family'),
        actionSentence: _('the base font family'),
        expressionLabel: _('Get the base font family'),
        expressionDescription: _('Get the base font family'),
      },
      {
        functionName: 'Alignment',
        iconPath: 'res/actions/textAlign24.png',
        type: 'stringWithSelector',
        instructionLabel: _('Alignment'),
        paramLabel: _('Alignment'),
        options: ['left', 'right', 'center'],
        conditionDescription: _('Check the current text alignment.'),
        conditionSentence: _('The text alignment of _PARAM0_ is _PARAM1_'),
        actionDescription: _('Change the alignment of the text.'),
        actionSentence: _('text alignment'),
        expressionLabel: _('Get the text alignment'),
        expressionDescription: _('Get the text alignment'),
      },
      {
        functionName: 'WrappingWidth',
        iconPath: 'res/actions/scaleWidth24_black.png',
        type: 'number',
        instructionLabel: _('Wrapping width'),
        paramLabel: _('Wrapping width'),
        conditionDescription: _(
          'Compare the width, in pixels, after which the text is wrapped on next line.'
        ),
        conditionSentence: _('the wrapping width'),
        actionDescription: _(
          'Change the width, in pixels, after which the text is wrapped on next line.'
        ),
        actionSentence: _('the wrapping width'),
        expressionLabel: _('Get the wrapping width'),
        expressionDescription: _('Get the wrapping width'),
      },
    ];

    addSettersAndGettersToObject(object, setterAndGetterProperties, 'BBText');

    object
      .addCondition(
        'IsWordWrap',
        _('Word wrapping'),
        _('Check if word wrapping is enabled.'),
        _('_PARAM0_ word wrapping is enabled'),
        '',
        'res/conditions/wordWrap24_black.png',
        'res/conditions/wordWrap_black.png'
      )
      .addParameter('object', 'BBText', 'BBText', false)
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
      .addParameter('object', 'BBText', 'BBText', false)
      .addParameter('yesorno', _('Activate word wrapping'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setWrapping');

    object
      .addAction(
        `SetFontFamily2`,
        _('Font family'),
        _('Set font family'),
        _('Set the font of _PARAM0_ to _PARAM1_'),
        '',
        'res/actions/font24.png',
        'res/actions/font24.png'
      )
      .addParameter('object', 'BBText', 'BBText', false)
      .addParameter('fontResource', _('Font family'), '', false)
      .getCodeExtraInformation()
      .setFunctionName(`setFontFamily`);

    const actions = object.getAllActions();
    const conditions = object.getAllConditions();
    const expressions = object.getAllExpressions();

    actions.get('BBText::SetOpacity').setHidden();
    conditions.get('BBText::IsOpacity').setHidden();
    expressions.get('GetOpacity').setHidden();
    // Action deprecated because it's using the `string` type instead of the more
    // user-friendly `fontResource` type.
    actions.get('BBText::SetFontFamily').setHidden();

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
      'BBText::BBText',
      objectsEditorService.getDefaultObjectJsImplementationPropertiesEditor({
        helpPagePath: '/objects/bbtext',
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

    /**
     * Renderer for instances of BBText inside the IDE.
     *
     * @extends RenderedInstance
     * @class RenderedBBTextInstance
     * @constructor
     */
    class RenderedBBTextInstance extends RenderedInstance {
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
        this._fontResourceName = '';
        this._fontFamily = 'Arial';
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

      /**
       * Return the path to the thumbnail of the specified object.
       */
      static getThumbnail(project, resourcesLoader, objectConfiguration) {
        return 'JsPlatform/Extensions/bbcode24.png';
      }

      /**
       * This is called to update the Three.js object on the scene editor
       */
      update() {
        if (!this._threeObject || !this._context) return;
        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );

        const propertyOverridings = this.getPropertyOverridings();
        const rawText =
          propertyOverridings && propertyOverridings.has('Text')
            ? propertyOverridings.get('Text')
            : object.content.text;
        const baseColor = normalizeBBTextColor(object.content.color, '#cccccc');
        const fontSize = Math.max(1, object.content.fontSize || 20);

        const fontResourceName = object.content.fontFamily;
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
                'Unable to load font family for RenderedBBTextInstance',
                err
              );
            });
        }

        const align = object.content.align;
        const baseStyle = {
          fill: baseColor,
          fontFamily: this._fontFamily || 'Arial',
          fontSize,
          fontStyle: 'normal',
          fontWeight: 'normal',
          letterSpacing: 0,
          stroke: null,
          strokeThickness: 0,
          shadowColor: null,
          shadowBlur: 0,
          shadowDistance: 0,
        };
        const parsedSegments = parseBBTextSegments(rawText || ' ', baseStyle);
        const wrappingWidth = this._instance.hasCustomSize()
          ? Math.max(1, this.getCustomWidth())
          : 0;
        const lines = buildBBTextLines(
          this._context,
          parsedSegments,
          wrappingWidth
        );
        const padding = 6;
        const naturalWidth = lines.reduce(
          (maxWidth, line) => Math.max(maxWidth, Math.ceil(line.width)),
          1
        );
        const canvasWidth = Math.max(
          1,
          Math.ceil((wrappingWidth || naturalWidth) + padding * 2)
        );
        const canvasHeight = Math.max(
          1,
          Math.ceil(
            lines.reduce(
              (height, line) => height + Math.max(1, line.height),
              0
            ) +
              padding * 2
          )
        );

        if (
          this._canvas.width !== canvasWidth ||
          this._canvas.height !== canvasHeight
        ) {
          this._canvas.width = canvasWidth;
          this._canvas.height = canvasHeight;
        }

        this._context.clearRect(0, 0, canvasWidth, canvasHeight);
        this._context.textBaseline = 'top';

        let drawY = padding;
        for (const line of lines) {
          const drawX =
            align === 'right'
              ? canvasWidth - padding - line.width
              : align === 'center'
                ? padding + ((wrappingWidth || line.width) - line.width) / 2
                : padding;
          let cursorX = drawX;

          for (const segment of line.segments) {
            this._context.font = getBBTextFontString(segment.style);
            this._context.fillStyle = segment.style.fill;
            this._context.strokeStyle =
              segment.style.stroke || segment.style.fill;
            this._context.lineWidth = segment.style.strokeThickness;
            this._context.shadowColor =
              segment.style.shadowColor || 'rgba(0,0,0,0)';
            this._context.shadowBlur = segment.style.shadowBlur;
            this._context.shadowOffsetX = segment.style.shadowDistance;
            this._context.shadowOffsetY = segment.style.shadowDistance;

            for (let index = 0; index < segment.text.length; index++) {
              const character = segment.text[index];
              const characterWidth = this._context.measureText(character).width;
              if (segment.style.stroke && segment.style.strokeThickness > 0) {
                this._context.strokeText(character, cursorX, drawY);
              }
              this._context.fillText(character, cursorX, drawY);
              cursorX +=
                characterWidth +
                (index < segment.text.length - 1
                  ? segment.style.letterSpacing
                  : 0);
            }

            this._context.shadowColor = 'rgba(0,0,0,0)';
            this._context.shadowBlur = 0;
            this._context.shadowOffsetX = 0;
            this._context.shadowOffsetY = 0;
          }

          drawY += Math.max(1, line.height);
        }

        this._canvasTexture.needsUpdate = true;

        if (this._instance.hasCustomSize() && canvasWidth !== 0) {
          const alignmentX =
            object.content.align === 'right'
              ? 1
              : object.content.align === 'center'
                ? 0.5
                : 0;

          const width = this.getCustomWidth();
          const centerToCenterX = (width - canvasWidth) * (alignmentX - 0.5);
          this._threeObject.position.x = this._instance.getX() + width / 2;
          this._threeObject.scale.x = width;
          this._threeObject.userData.anchorX =
            0.5 - centerToCenterX / canvasWidth;
        } else {
          this._threeObject.position.x =
            this._instance.getX() + canvasWidth / 2;
          this._threeObject.scale.x = canvasWidth;
          this._threeObject.userData.anchorX = 0.5;
        }
        const alignmentY =
          object.content.verticalTextAlignment === 'bottom'
            ? 1
            : object.content.verticalTextAlignment === 'center'
              ? 0.5
              : 0;
        this._threeObject.position.y =
          this._instance.getY() + canvasHeight * (alignmentY - 0.5);
        this._threeObject.scale.y = canvasHeight;
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
          if (this._threeObject.material) this._threeObject.material.dispose();
          if (this._threeObject.geometry) this._threeObject.geometry.dispose();
          this._threeObject.userData.instance = null;
          this._threeObject = /** @type {any} */ (null);
        }
        if (this._canvasTexture) this._canvasTexture.dispose();
      }

      /**
       * Return the width of the instance, when it's not resized.
       */
      getDefaultWidth() {
        return this._canvas.width;
      }

      /**
       * Return the height of the instance, when it's not resized.
       */
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
      'BBText::BBText',
      RenderedBBTextInstance
    );
  },
};
