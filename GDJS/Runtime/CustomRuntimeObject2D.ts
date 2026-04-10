namespace gdjs {
  /**
   * Base class for 2D custom objects.
   * @category Objects > Custom Object
   */
  export class CustomRuntimeObject2D extends gdjs.CustomRuntimeObject {
    constructor(
      parent: gdjs.RuntimeInstanceContainer,
      objectData: ObjectData & CustomObjectConfiguration,
      instanceData?: InstanceData
    ) {
      super(parent, objectData, instanceData);
    }

    protected override _createRender(): gdjs.CustomRuntimeObject2DThreeRenderer {
      const parent = this._runtimeScene;
      return new gdjs.CustomRuntimeObject2DThreeRenderer(
        this,
        this._instanceContainer,
        parent
      );
    }

    protected override _reinitializeRenderer(): void {
      this.getRenderer().reinitialize(this, this.getParent());
    }

    override getRenderer(): gdjs.CustomRuntimeObject2DThreeRenderer {
      return super.getRenderer() as gdjs.CustomRuntimeObject2DThreeRenderer;
    }

    override getRendererObject() {
      return this.getRenderer().getRendererObject();
    }
  }
}
