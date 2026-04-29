namespace gdjs {
  interface NightFilterNetworkSyncData {
    i: number;
    o: number;
  }
  type NightFilterUniforms = {
    intensity: number;
    opacity: number;
  };
  type NightFilter = PIXI.Filter & {
    resources: {
      uniforms: {
        uniforms: NightFilterUniforms;
      };
    };
  };

  const getNightFilterUniforms = (
    filter: PIXI.Filter
  ): NightFilterUniforms => (filter as NightFilter).resources.uniforms.uniforms;

  /** @internal - should not have been exported? */
  export const makeNightPixiFilter = (): PIXI.Filter => {
    const fragmentShader = [
      'in vec2 vTextureCoord;',
      'uniform sampler2D uTexture;',
      'uniform float intensity;',
      'uniform float opacity;',
      'out vec4 finalColor;',
      '',
      'void main(void)',
      '{',
      '   mat3 nightMatrix = mat3(-2.0 * intensity, -1.0 * intensity, 0, -1.0 * intensity, 0, 1.0 * intensity, 0, 1.0 * intensity, 2.0 * intensity);',
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
          intensity: { value: 1, type: 'f32' },
          opacity: { value: 1, type: 'f32' },
        },
      },
    });
  };
  gdjs.PixiFiltersTools.registerFilterCreator(
    'Night',
    new (class extends gdjs.PixiFiltersTools.PixiFilterCreator {
      makePIXIFilter(target: EffectsTarget, effectData) {
        const filter = gdjs.makeNightPixiFilter();
        return filter;
      }
      updatePreRender(filter: PIXI.Filter, target: EffectsTarget) {}
      updateDoubleParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: number
      ) {
        if (parameterName !== 'intensity' && parameterName !== 'opacity') {
          return;
        }
        getNightFilterUniforms(filter)[parameterName] = gdjs.PixiFiltersTools.clampValue(
          value,
          0,
          1
        );
      }
      getDoubleParameter(filter: PIXI.Filter, parameterName: string): number {
        return getNightFilterUniforms(filter)[parameterName] || 0;
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
      getNetworkSyncData(filter: PIXI.Filter): NightFilterNetworkSyncData {
        return {
          i: getNightFilterUniforms(filter).intensity,
          o: getNightFilterUniforms(filter).opacity,
        };
      }
      updateFromNetworkSyncData(
        filter: PIXI.Filter,
        data: NightFilterNetworkSyncData
      ) {
        getNightFilterUniforms(filter).intensity = data.i;
        getNightFilterUniforms(filter).opacity = data.o;
      }
    })()
  );
}
