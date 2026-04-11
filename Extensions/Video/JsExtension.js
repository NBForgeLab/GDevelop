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
        'Video',
        _('Video'),
        _(
          'Provides an object to display a video on the scene. The recommended file format is MPEG4, with H264 video codec and AAC audio codec, to maximize the support of the video on different platform and browsers.'
        ),
        'Aurélien Vivet',
        'Open source (MIT License)'
      )
      .setShortDescription(
        'Video object: play/pause/loop MPEG4 videos on screen. Volume, playback speed, opacity control.'
      )
      .setCategory('User interface')
      .setExtensionHelpPath('/objects/video');
    extension
      .addInstructionOrExpressionGroupMetadata(_('Video'))
      .setIcon('JsPlatform/Extensions/videoicon16.png');

    var videoObject = new gd.ObjectJsImplementation();
    videoObject.updateProperty = function (propertyName, newValue) {
      if (propertyName === 'Opacity') {
        this.content.opacity = parseFloat(newValue);
        return true;
      }
      if (propertyName === 'Looped') {
        this.content.loop = newValue === '1';
        return true;
      }
      if (propertyName === 'Volume') {
        this.content.volume = parseFloat(newValue);
        return true;
      }
      if (propertyName === 'videoResource') {
        this.content.videoResource = newValue;
        return true;
      }

      return false;
    };
    videoObject.getProperties = function () {
      var objectProperties = new gd.MapStringPropertyDescriptor();

      objectProperties
        .getOrCreate('Looped')
        .setValue(this.content.loop ? 'true' : 'false')
        .setType('boolean')
        .setLabel(_('Loop the video'))
        .setGroup(_('Playback settings'));
      objectProperties
        .getOrCreate('Volume')
        .setValue(this.content.volume.toString())
        .setType('number')
        .setLabel(_('Video volume (0-100)'))
        .setGroup(_('Playback settings'));
      objectProperties
        .getOrCreate('videoResource')
        .setValue(this.content.videoResource)
        .setType('resource')
        .addExtraInfo('video')
        .setLabel(_('Video resource'));

      return objectProperties;
    };
    videoObject.content = {
      opacity: 255,
      loop: false,
      volume: 100,
      videoResource: '',
    };

    videoObject.updateInitialInstanceProperty = function (
      instance,
      propertyName,
      newValue
    ) {
      return false;
    };
    videoObject.getInitialInstanceProperties = function (instance) {
      var instanceProperties = new gd.MapStringPropertyDescriptor();
      return instanceProperties;
    };

    const object = extension
      .addObject(
        'VideoObject',
        _('Video'),
        _('Displays a video.'),
        'JsPlatform/Extensions/videoicon32.png',
        // @ts-ignore - TODO: Fix videoObject being an ObjectJsImplementation instead of an ObjectConfiguration
        videoObject
      )
      .setIncludeFile('Extensions/Video/videoruntimeobject.js')
      .addIncludeFile('Extensions/Video/videoruntimeobject-three-renderer.js')
      .setCategory('User interface')
      .addDefaultBehavior('EffectCapability::EffectBehavior')
      .addDefaultBehavior('OpacityCapability::OpacityBehavior');

    object
      .addAction(
        'Play',
        _('Play a video'),
        _(
          'Play a video (recommended file format is MPEG4, with H264 video codec and AAC audio codec).'
        ),
        _('Play the video of _PARAM0_'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('play');

    object
      .addAction(
        'Pause',
        _('Pause a video'),
        _('Pause the specified video.'),
        _('Pause video _PARAM0_'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('pause');

    object
      .addAction(
        'Loop',
        _('Loop a video'),
        _('Loop the specified video.'),
        _('Loop video of _PARAM0_: _PARAM1_'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .addParameter('yesorno', _('Activate loop'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setLoop');

    object
      .addAction(
        'Mute',
        _('Mute a video'),
        _('Mute, or unmute, the specified video.'),
        _('Mute video of _PARAM0_: _PARAM1_'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .addParameter('yesorno', _('Activate mute'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('mute');

    object
      .addAction(
        'SetTime',
        _('Current time'),
        _('Set the time of the video'),
        _('the time'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Position (in seconds)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('setCurrentTime')
      .setGetter('getCurrentTime');

    object
      .addAction(
        'SetVolume',
        _('Volume'),
        _('Set the volume of the video object.'),
        _('the volume'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(_('Volume (0-100)'))
      )
      .getCodeExtraInformation()
      .setFunctionName('setVolume')
      .setGetter('getVolume');

    object
      .addExpression(
        'Volume',
        _('Get the volume'),
        _(
          'Get the volume of a video object, between 0 (muted) and 100 (maximum).'
        ),
        '',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('getVolume');

    object
      .addCondition(
        'Play',
        _('Is played'),
        _('Check if a video is played.'),
        _('_PARAM0_ is played'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isPlayed');

    object
      .addCondition(
        'Pause',
        _('Is paused'),
        _('Check if the video is paused.'),
        _('_PARAM0_ is paused'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isPaused');

    object
      .addCondition(
        'Loop',
        _('Is looped'),
        _('Check if the video is looped.'),
        _('_PARAM0_ is looped'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isLooped');

    object
      .addCondition(
        'Volume',
        _('Volume'),
        _('Compare the current volume of a video object.'),
        _('the volume'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardRelationalOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Volume to compare to (0-100)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('getVolume');

    object
      .addCondition(
        'Mute',
        _('Is muted'),
        _('Check if a video is muted.'),
        _('_PARAM0_ is muted'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isMuted');

    object
      .addExpression(
        'CurrentTime',
        _('Get current time'),
        _('Return the current time of a video object (in seconds).'),
        '',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('getCurrentTime');

    object
      .addExpression(
        'Duration',
        _('Get the duration'),
        _('Return the duration of a video object (in seconds).'),
        '',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('getDuration');

    object
      .addCondition(
        'Duration',
        _('Duration'),
        _('Compare the duration of a video object'),
        _('the duration (in seconds)'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardRelationalOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Duration to compare to (in seconds)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('getDuration');

    object
      .addCondition(
        'CurrentTime',
        _('Current time'),
        _('Compare the current time of a video object'),
        _('the current time (in seconds)'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardRelationalOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Time to compare to (in seconds)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('getCurrentTime');

    object
      .addCondition(
        'Ended',
        _('Is ended'),
        _('Check if a video is ended'),
        _('_PARAM0_ is ended'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isEnded');

    object
      .addAction(
        'SetOpacity',
        _('Set opacity'),
        _('Set opacity of the specified video object.'),
        _('the opacity'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Opacity (0-255)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('setOpacity')
      .setGetter('getOpacity')
      .setHidden();

    // Deprecated
    object
      .addCondition(
        'GetOpacity',
        _('Opacity'),
        _('Compare the opacity of a video object'),
        _('the opacity'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardRelationalOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Opacity to compare to (0-255)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('getOpacity')
      .setHidden();

    // Deprecated
    object
      .addExpression(
        'Opacity',
        _('Get current opacity'),
        _('Return the opacity of a video object'),
        '',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('getOpacity')
      .setHidden();

    object
      .addAction(
        'SetPlaybackSpeed',
        _('Set playback speed'),
        _(
          'Set playback speed of the specified video object, (1 = the default speed, >1 = faster and <1 = slower).'
        ),
        _('the playback speed'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Playback speed (1 by default)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('setPlaybackSpeed')
      .setGetter('getPlaybackSpeed');

    object
      .addCondition(
        'GetPlaybackSpeed',
        _('Playback speed '),
        _('Compare the playback speed of a video object'),
        _('the playback speed'),
        '',
        'JsPlatform/Extensions/videoicon24.png',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Video object'), 'VideoObject', false)
      .useStandardRelationalOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions().setDescription(
          _('Playback speed (1 by default)')
        )
      )
      .getCodeExtraInformation()
      .setFunctionName('getPlaybackSpeed');

    object
      .addExpression(
        'PlaybackSpeed',
        _('Get current playback speed'),
        _('Return the playback speed of a video object'),
        '',
        'JsPlatform/Extensions/videoicon16.png'
      )
      .addParameter('object', _('Object'), 'VideoObject', false)
      .getCodeExtraInformation()
      .setFunctionName('getPlaybackSpeed');

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
      'Video::VideoObject',
      objectsEditorService.getDefaultObjectJsImplementationPropertiesEditor({
        helpPagePath: '/objects/video',
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
     * Renderer for instances of VideoObject inside the IDE.
     */
    class RenderedVideoObjectInstance extends RenderedInstance {
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

        this._videoResource = undefined;
        this._loadedVideoResource = null;

        const geometry = new THREE.PlaneGeometry(1, 1);
        geometry.translate(0.5, -0.5, 0);
        const material = new THREE.MeshBasicMaterial({
          map: this._resourcesLoader.getInvalidThreeTexture(),
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
          if (this._threeObject.material) {
            this._threeObject.material.dispose();
          }
          if (this._threeObject.geometry) {
            this._threeObject.geometry.dispose();
          }
          this._threeObject.userData.instance = null;
          this._threeObject = null;
        }
        this._loadedVideoResource = null;
      }

      /**
       * Return the path to the thumbnail of the specified object.
       */
      static getThumbnail(project, resourcesLoader, objectConfiguration) {
        return 'JsPlatform/Extensions/videoicon24.png';
      }

      async _loadVideoTexture() {
        // Get the video resource to use
        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );
        const videoResource = object.content.videoResource;

        const loadedVideoResource =
          await this._resourcesLoader.getThreeVideoTexture(
            this._project,
            videoResource
          );
        if (this._wasDestroyed || !this._threeObject) {
          return;
        }

        this._loadedVideoResource = loadedVideoResource;
        this._threeObject.material.map = loadedVideoResource.texture;
        this._threeObject.material.needsUpdate = true;
        this.update();
      }

      /**
       * This is called to update the Three.js object on the scene editor.
       */
      update() {
        if (!this._threeObject) {
          return;
        }
        // Check if the video resource has changed
        const object = gd.castObject(
          this._associatedObjectConfiguration,
          gd.ObjectJsImplementation
        );
        const videoResource = object.content.videoResource;

        if (videoResource !== this._videoResource) {
          this._videoResource = videoResource;
          this._loadVideoTexture();
        }

        // Read position and angle from the instance
        const width = this.getDefaultWidth();
        const height = this.getDefaultHeight();
        this._threeObject.position.x = this._instance.getX() + width / 2;
        this._threeObject.position.y = this._instance.getY() + height / 2;
        this._threeObject.rotation.z = -RenderedInstance.toRad(
          this._instance.getAngle()
        );

        if (this._instance.hasCustomSize()) {
          this._threeObject.scale.set(
            this.getCustomWidth(),
            this.getCustomHeight(),
            1
          );
        } else {
          this._threeObject.scale.set(width, height, 1);
        }

        // Do not hide completely an object so it can still be manipulated
        const alphaForDisplay = Math.max(
          this._instance.getOpacity() / 255,
          0.5
        );
        this._threeObject.material.opacity = alphaForDisplay;
        this._threeObject.material.transparent = true;
      }

      /**
       * Return the width of the instance, when it's not resized.
       */
      getDefaultWidth() {
        return (
          this._loadedVideoResource?.video.videoWidth ||
          this._loadedVideoResource?.video.clientWidth ||
          32
        );
      }

      /**
       * Return the height of the instance, when it's not resized.
       */
      getDefaultHeight() {
        return (
          this._loadedVideoResource?.video.videoHeight ||
          this._loadedVideoResource?.video.clientHeight ||
          32
        );
      }
    }

    // We don't do anything special when instance is removed from the scene,
    // because the video is never really played.

    objectsRenderingService.registerInstanceRenderer(
      'Video::VideoObject',
      RenderedVideoObjectInstance
    );
  },
};
