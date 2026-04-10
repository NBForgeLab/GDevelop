# Three.js Renderers

This directory contains the 3D-First rendering system for GDevelop, built entirely on Three.js.

## Purpose

This folder replaces the hybrid PixiJS/Three.js rendering system with a unified Three.js-based renderer that handles both 2D and 3D objects.

## Structure

- `runtimescene-three-renderer.ts` - Main scene renderer
- `layer-three-renderer.ts` - Layer management
- `camera-system.ts` - Camera handling for 2D and 3D
- `resource-manager.ts` - Texture and model loading
- `effects/` - Post-processing effects

## Related

- See `.kiro/specs/3d-first-rendering-engine/` for the full specification
- This replaces `GDJS/Runtime/pixi-renderers/` in the new architecture