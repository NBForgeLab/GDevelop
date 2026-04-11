// @flow
import * as THREE from 'three';
import {
  getBasicProfilingCountersText,
  type BasicProfilingCounters,
} from './InstancesRenderer/BasicProfilingCounters';

/**
 * Renders a profiling overlay in the scene editor using a canvas-backed
 * Three.js sprite. This replaces the old PixiJS PIXI.Text-based implementation.
 */
export default class ProfilerBar {
  // $FlowFixMe[value-as-type]
  _profilerBarContainer: THREE.Group;
  _canvas: HTMLCanvasElement;
  _ctx: CanvasRenderingContext2D;
  // $FlowFixMe[value-as-type]
  _texture: THREE.CanvasTexture;
  // $FlowFixMe[value-as-type]
  _sprite: THREE.Sprite;
  _lastText: string = '';

  constructor() {
    this._profilerBarContainer = new THREE.Group();

    // Create an offscreen canvas for text rendering
    this._canvas = document.createElement('canvas');
    this._canvas.width = 512;
    this._canvas.height = 256;
    const ctx = this._canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context for profiler bar');
    this._ctx = ctx;

    // Create a Three.js texture from the canvas
    this._texture = new THREE.CanvasTexture(this._canvas);
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;

    // Create a sprite to display the profiler overlay
    const material = new THREE.SpriteMaterial({
      map: this._texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this._sprite = new THREE.Sprite(material);
    this._sprite.renderOrder = 99999;
    this._profilerBarContainer.add(this._sprite);
  }

  // $FlowFixMe[value-as-type]
  getThreeObject(): THREE.Group {
    return this._profilerBarContainer;
  }

  _updateCanvas(text: string) {
    const ctx = this._ctx;
    const canvas = this._canvas;
    const fontSize = 12;
    const lineHeight = fontSize + 4;
    const padding = 5;
    const barPadding = 15;

    ctx.font = `${fontSize}px monospace`;
    const lines = text.split('\n');

    // Measure text to size the background
    let maxWidth = 0;
    for (const line of lines) {
      const measured = ctx.measureText(line);
      if (measured.width > maxWidth) maxWidth = measured.width;
    }

    const bgWidth = maxWidth + padding * 2;
    const bgHeight = lines.length * lineHeight + padding * 2;

    // Resize canvas if needed (keep power-of-two friendly)
    const requiredW = Math.ceil(barPadding + bgWidth + barPadding);
    const requiredH = Math.ceil(barPadding + bgHeight + barPadding);
    if (canvas.width < requiredW || canvas.height < requiredH) {
      canvas.width = Math.max(canvas.width, requiredW);
      canvas.height = Math.max(canvas.height, requiredH);
      // Re-set font after resize (canvas resize resets context state)
      ctx.font = `${fontSize}px monospace`;
    }

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rounded-rect background
    const bx = barPadding;
    const by = barPadding;
    const borderRadius = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(bx + borderRadius, by);
    ctx.lineTo(bx + bgWidth - borderRadius, by);
    ctx.quadraticCurveTo(bx + bgWidth, by, bx + bgWidth, by + borderRadius);
    ctx.lineTo(bx + bgWidth, by + bgHeight - borderRadius);
    ctx.quadraticCurveTo(
      bx + bgWidth,
      by + bgHeight,
      bx + bgWidth - borderRadius,
      by + bgHeight
    );
    ctx.lineTo(bx + borderRadius, by + bgHeight);
    ctx.quadraticCurveTo(bx, by + bgHeight, bx, by + bgHeight - borderRadius);
    ctx.lineTo(bx, by + borderRadius);
    ctx.quadraticCurveTo(bx, by, bx + borderRadius, by);
    ctx.closePath();
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(
        lines[i],
        barPadding + padding,
        barPadding + padding + i * lineHeight
      );
    }

    this._texture.needsUpdate = true;

    // Update sprite scale to match the canvas size in screen pixels
    this._sprite.scale.set(canvas.width, canvas.height, 1);
    // Position at top-left (sprite center is at 0.5, 0.5 by default)
    this._sprite.center.set(0, 1);
    this._sprite.position.set(0, 0, 0);
  }

  render({
    basicProfilingCounters,
    display,
  }: {|
    basicProfilingCounters: BasicProfilingCounters,
    display: boolean,
  |}) {
    if (!display) {
      this._profilerBarContainer.visible = false;
      return;
    }

    this._profilerBarContainer.visible = true;

    const text = getBasicProfilingCountersText(basicProfilingCounters);
    // Only re-render the canvas when the text changes to avoid unnecessary work
    if (text !== this._lastText) {
      this._lastText = text;
      this._updateCanvas(text);
    }
  }
}
