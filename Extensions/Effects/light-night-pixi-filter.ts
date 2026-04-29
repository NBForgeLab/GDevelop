namespace gdjs {
  /** @internal - should not have been exported? */
  export interface LightNightFilterExtra {
    o: number;
  }
  type LightNightFilterUniforms = {
    opacity: number;
  };
  type LightNightFilter = PIXI.Filter & {
    resources: {
      uniforms: {
        uniforms: LightNightFilterUniforms;
      };
    };
  };

  const getLightNightFilterUniforms = (
    filter: PIXI.Filter
  ): LightNightFilterUniforms =>
    (filter as LightNightFilter).resources.uniforms.uniforms;

  /** @internal - should not have been exported? */
  export const makeLightNightPixiFilter = (): PIXI.Filter => {
    const fragmentShader = [
      'in vec2 vTextureCoord;',
      'uniform sampler2D uTexture;',
      'uniform float opacity;',
      'out vec4 finalColor;',
      '',
      'void main(void)',
      '{',
      '   mat3 nightMatrix = mat3(0.6, 0, 0, 0, 0.7, 0, 0, 0, 1.3);',
      '   vec4 color = texture(uTexture, vTextureCoord);',
      '   color.rgb = mix(color.rgb, nightMatrix * color.rgb, opacity);',
      '   finalColor = color;',
      '}',
    ].join('\n');
    return PIXI.Filter.from({
      gl: {
        vertex: gdjs.PixiFiltersTools.defaultFilterVertexShader,
        fragment: fragmentShader,
      },
      resources: {
        uniforms: {
          opacity: { value: 1, type: 'f32' },
        },
      },
    });
  };
  gdjs.PixiFiltersTools.registerFilterCreator(
    'LightNight',
    new (class extends gdjs.PixiFiltersTools.PixiFilterCreator {
      makePIXIFilter(target: EffectsTarget, effectData) {
        const filter = gdjs.makeLightNightPixiFilter();
        return filter;
      }
      updatePreRender(filter: PIXI.Filter, target: EffectsTarget) {}
      updateDoubleParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: number
      ) {
        if (parameterName === 'opacity') {
          getLightNightFilterUniforms(filter).opacity =
            gdjs.PixiFiltersTools.clampValue(
              value,
              0,
              1
            );
        }
      }
      getDoubleParameter(filter: PIXI.Filter, parameterName: string): number {
        if (parameterName === 'opacity') {
          return getLightNightFilterUniforms(filter).opacity;
        }
        return 0;
      }
      updateStringParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: string
      ) {}
      updateColorParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: number
      ): void {}
      getColorParameter(filter: PIXI.Filter, parameterName: string): number {
        return 0;
      }
      updateBooleanParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: boolean
      ) {}
      getNetworkSyncData(filter: PIXI.Filter): LightNightFilterExtra {
        return {
          o: getLightNightFilterUniforms(filter).opacity,
        };
      }
      updateFromNetworkSyncData(
        filter: PIXI.Filter,
        data: LightNightFilterExtra
      ) {
        getLightNightFilterUniforms(filter).opacity = data.o;
      }
    })()
  );
}
