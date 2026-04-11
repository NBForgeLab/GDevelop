//A simple Three.js shader effect doing some color changes
namespace gdjs {
  const logger = new gdjs.Logger('Dummy effect');

  // Register the effect type and associate it with a "filter creator" object, containing
  // functions to create and manipulate the filter.
  // Don't forget your extension name in the effect type!
  gdjs.EffectsTools.registerFilterCreator(
    'MyDummyExtension::DummyEffect',
    new (class extends gdjs.EffectsTools.EffectCreator {
      // makeEffectHandle should return an effect handle that will be applied on the renderer object.
      makeEffectHandle(layer, effectData) {
        const filter = {
          enabled: true,
          opacity: 1.0,
        };

        // If you need to store the time or some state, you can set it up now:
        // filter._time = 0;

        // You can also access to the effect properties, classified by type:
        // `effectData.doubleParameters.opacity`
        // `effectData.stringParameters.someImage`
        // `effectData.stringParameters.someColor`
        // `effectData.booleanParameters.someBoolean`
        logger.info(
          'The Three.js texture found for the Dummy Effect (not actually used):',
          (
            layer
              .getRuntimeScene()
              .getGame()
              .getImageManager() as gdjs.ImageManager
          ).getThreeTexture(effectData.stringParameters.someImage)
        );
        return filter;
      }
      // Function called at every frame, after events and before the frame is rendered.
      updatePreRender(filter, layer) {
        // If your filter depends on the time, you can get the elapsed time
        // with `layer.getElapsedTime()`.
        // You can update the uniforms or other state of the filter.
      }
      // Function that will be called to update a (number) parameter of the effect with a new value
      updateDoubleParameter(
        filter: any,
        parameterName: string,
        value: number
      ) {
        if (parameterName === 'opacity') {
          filter.opacity = gdjs.EffectsTools.clampValue(value, 0, 1);
        }
      }
      getDoubleParameter(filter: any, parameterName: string): number {
        if (parameterName === 'opacity') {
          return filter.opacity;
        }
        return 0;
      }
      // Function that will be called to update a (string) parameter of the effect with a new value
      updateStringParameter(
        filter: any,
        parameterName: string,
        value: string
      ) {}
      updateColorParameter(
        filter: any,
        parameterName: string,
        value: number
      ): void {}
      getColorParameter(filter: any, parameterName: string): number {
        return 0;
      }
      // Function that will be called to update a (boolean) parameter of the effect with a new value
      updateBooleanParameter(
        filter: any,
        parameterName: string,
        value: boolean
      ) {}
      getNetworkSyncData(filter: any): any {
        return { opacity: filter.opacity };
      }
      updateFromNetworkSyncData(filter: any, data: any) {
        filter.opacity = data.opacity;
      }
    })()
  );
}
