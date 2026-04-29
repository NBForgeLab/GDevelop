// @flow
import transformRect from '../Utils/TransformRect';
import * as PIXI from 'pixi.js';
import { type InstanceMeasurer } from './InstancesRenderer';
import Rectangle from '../Utils/Rectangle';

export default class HighlightedInstance {
  instanceMeasurer: InstanceMeasurer;
  toCanvasCoordinates: (x: number, y: number) => [number, number];
  isInstanceOf3DObject: gdInitialInstance => boolean;
  highlightedInstance: gdInitialInstance | null;
  isHighlightedInstanceOf3DObject: boolean;
  // $FlowFixMe[value-as-type]
  highlightContainer: PIXI.Container;
  // $FlowFixMe[value-as-type]
  highlightRectangle: PIXI.Graphics;
  // $FlowFixMe[value-as-type]
  tooltipBackground: PIXI.Graphics;
  // $FlowFixMe[value-as-type]
  tooltipText: PIXI.Text;

  constructor({
    instanceMeasurer,
    toCanvasCoordinates,
    isInstanceOf3DObject,
  }: {
    instanceMeasurer: InstanceMeasurer,
    toCanvasCoordinates: (x: number, y: number) => [number, number],
    isInstanceOf3DObject: gdInitialInstance => boolean,
  }) {
    this.instanceMeasurer = instanceMeasurer;
    this.toCanvasCoordinates = toCanvasCoordinates;
    this.isInstanceOf3DObject = isInstanceOf3DObject;

    this.highlightedInstance = null;
    this.isHighlightedInstanceOf3DObject = false;
    this.highlightContainer = new PIXI.Container();
    this.highlightRectangle = new PIXI.Graphics();
    this.highlightRectangle.hitArea = new PIXI.Rectangle(0, 0, 0, 0);

    this.tooltipBackground = new PIXI.Graphics();
    this.tooltipText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 15,
        fill: 0xffffff,
        align: 'center',
      },
    });
    this.highlightContainer.addChild(this.highlightRectangle);
    this.highlightContainer.addChild(this.tooltipBackground);
    this.highlightContainer.addChild(this.tooltipText);
  }

  setInstance(instance: gdInitialInstance | null) {
    this.isHighlightedInstanceOf3DObject = instance
      ? this.isInstanceOf3DObject(instance)
      : false;
    this.highlightedInstance = instance;
  }

  getInstance(): ?gdInitialInstance {
    return this.highlightedInstance;
  }

  // $FlowFixMe[value-as-type]
  getPixiObject(): PIXI.Container {
    return this.highlightContainer;
  }

  render() {
    const { highlightedInstance } = this;
    if (highlightedInstance === null) {
      this.highlightContainer.visible = false;
      return;
    }

    const highlightRectangle = transformRect(
      this.toCanvasCoordinates,
      this.instanceMeasurer.getInstanceAABB(
        highlightedInstance,
        new Rectangle()
      )
    );

    this.highlightContainer.visible = true;
    this.highlightRectangle.clear();
    this.highlightContainer.alpha = 0.8;
    this.highlightRectangle
      .rect(
        highlightRectangle.left,
        highlightRectangle.top,
        highlightRectangle.width(),
        highlightRectangle.height()
      )
      .fill({ color: 0xeeeeff, alpha: 0.1 })
      .stroke({ width: 1, color: 0x000000 });

    const tooltipInfo =
      highlightedInstance.getObjectName() +
      '\n' +
      'X: ' +
      Math.round(highlightedInstance.getX() * 100) / 100 + // An instance position can have a lot of decimals, so round to 2 decimals.
      '  Y: ' +
      Math.round(highlightedInstance.getY() * 100) / 100 + // An instance position can have a lot of decimals, so round to 2 decimals.
      (this.isHighlightedInstanceOf3DObject
        ? '  Z: ' +
          // An instance position can have a lot of decimals, so round to 2 decimals.
          Math.round(highlightedInstance.getZ() * 100) / 100
        : '') +
      '\n' +
      'Layer: ' +
      (highlightedInstance.getLayer() || 'Base layer') +
      (this.isHighlightedInstanceOf3DObject
        ? ''
        : '\nZ order: ' + highlightedInstance.getZOrder()) +
      '\n';

    this.tooltipText.text = tooltipInfo;

    this.tooltipText.x = Math.round(
      highlightRectangle.left -
        this.tooltipText.width / 2 +
        highlightRectangle.width() / 2
    );
    this.tooltipText.y = Math.round(
      highlightRectangle.top - this.tooltipText.height
    );

    const padding = 5;
    this.tooltipBackground
      .clear()
      .roundRect(
        this.tooltipText.x - padding,
        this.tooltipText.y - padding,
        this.tooltipText.width + padding * 2,
        this.tooltipText.height - padding,
        4
      )
      .fill({ color: 0x000000, alpha: 0.8 });
  }
}
