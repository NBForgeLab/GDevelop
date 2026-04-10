# تصميم محرك الرسم 3D-First

## نظرة عامة على التصميم

هذا المستند يصف التصميم التقني الكامل لمحرك الرسم الجديد 3D-First الذي يعتمد بالكامل على Three.js.

## البنية المعمارية

### الهيكل العام

```
┌─────────────────────────────────────────────────────────┐
│                    GDevelop Game                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              RuntimeSceneThreeRenderer                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │         THREE.WebGLRenderer                       │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   THREE.Scene                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Layer 1   │  │   Layer 2   │  │   Layer 3   │    │
│  │ (2D Group)  │  │ (3D Group)  │  │ (2D Group)  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 2D Objects   │  │ 3D Objects   │  │   Effects    │
│ (Sprites,    │  │ (Models,     │  │ (Shaders,    │
│  Text, etc.) │  │  Cubes, etc.)│  │  Lighting)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## المكونات الرئيسية

### 1. RuntimeSceneThreeRenderer

**المسؤولية**: المحرك الرئيسي للرسم

**الملف**: `GDJS/Runtime/three-renderers/runtimescene-three-renderer.ts`

**الواجهة**:
```typescript
class RuntimeSceneThreeRenderer {
  // الخصائص
  private _threeRenderer: THREE.WebGLRenderer;
  private _mainScene: THREE.Scene;
  private _camera: THREE.Camera;
  private _layers: Map<string, LayerThreeRenderer>;
  private _effectComposer: THREE_ADDONS.EffectComposer;
  
  // الدوال الرئيسية
  constructor(runtimeScene: RuntimeScene);
  render(): void;
  onGameResolutionResized(): void;
  addLayer(name: string, layerData: LayerData): void;
  removeLayer(name: string): void;
  getLayer(name: string): LayerThreeRenderer;
}
```

**التدفق**:
1. إنشاء `THREE.WebGLRenderer` عند البداية
2. إنشاء `THREE.Scene` رئيسي
3. إضافة الطبقات كـ `THREE.Group`
4. تحديث الكائنات في كل إطار
5. الرسم باستخدام `renderer.render(scene, camera)`

### 2. LayerThreeRenderer

**المسؤولية**: إدارة طبقة واحدة

**الملف**: `GDJS/Runtime/three-renderers/layer-three-renderer.ts`

**الواجهة**:
```typescript
class LayerThreeRenderer {
  // الخصائص
  private _group: THREE.Group;
  private _camera: THREE.Camera;
  private _renderingType: '2d' | '3d' | 'mixed';
  private _effects: EffectPass[];
  
  // الدوال الرئيسية
  constructor(layerData: LayerData);
  addObject(object: THREE.Object3D, zOrder: number): void;
  removeObject(object: THREE.Object3D): void;
  updatePosition(): void;
  setVisible(visible: boolean): void;
  addEffect(effect: EffectPass): void;
}
```

**أنواع الطبقات**:
- **2D Layer**: تستخدم `OrthographicCamera` مع Z ثابت
- **3D Layer**: تستخدم `PerspectiveCamera` مع حرية كاملة
- **Mixed Layer**: تدعم كلا النوعين

### 3. نظام الكائنات ثنائية الأبعاد

#### 3.1 SpriteRuntimeObjectThreeRenderer

**الملف**: `GDJS/Runtime/spriteruntimeobject-three.ts`

**الواجهة**:
```typescript
class SpriteRuntimeObjectThreeRenderer {
  private _sprite: THREE.Sprite;
  private _material: THREE.SpriteMaterial;
  private _animations: Map<string, Animation>;
  
  constructor(texture: THREE.Texture);
  updatePosition(x: number, y: number, z: number): void;
  updateRotation(angle: number): void;
  updateScale(scaleX: number, scaleY: number): void;
  setOpacity(opacity: number): void;
  setBlendMode(mode: BlendMode): void;
  playAnimation(name: string): void;
}
```

**التنفيذ**:
```typescript
// استخدام THREE.Sprite للكائنات البسيطة
this._sprite = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.01
  })
);

// أو استخدام THREE.Mesh للكائنات المعقدة
this._mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  })
);
```

#### 3.2 TextRuntimeObjectThreeRenderer

**الملف**: `GDJS/Runtime/textruntimeobject-three.ts`

**الواجهة**:
```typescript
class TextRuntimeObjectThreeRenderer {
  private _sprite: THREE.Sprite;
  private _canvas: HTMLCanvasElement;
  private _texture: THREE.CanvasTexture;
  private _textCache: Map<string, THREE.Texture>;
  
  constructor();
  updateText(text: string, style: TextStyle): void;
  setColor(color: string): void;
  setFontSize(size: number): void;
  setFontFamily(family: string): void;
}
```

**التنفيذ**:
```typescript
// رسم النص على Canvas
const ctx = this._canvas.getContext('2d');
ctx.font = `${style.fontSize}px ${style.fontFamily}`;
ctx.fillStyle = style.color;
ctx.textAlign = style.align;
ctx.fillText(text, x, y);

// تحويل إلى Texture
this._texture = new THREE.CanvasTexture(this._canvas);
this._texture.needsUpdate = true;

// استخدام cache للنصوص المتكررة
const cacheKey = `${text}_${style.fontSize}_${style.color}`;
if (!this._textCache.has(cacheKey)) {
  this._textCache.set(cacheKey, this._texture.clone());
}
```

#### 3.3 ShapeRuntimeObjectThreeRenderer

**الملف**: `GDJS/Runtime/shaperuntimeobject-three.ts`

**الواجهة**:
```typescript
class ShapeRuntimeObjectThreeRenderer {
  private _mesh: THREE.Mesh;
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.MeshBasicMaterial;
  
  constructor(shapeType: 'rectangle' | 'circle' | 'polygon');
  setFillColor(color: number): void;
  setStrokeColor(color: number): void;
  setStrokeWidth(width: number): void;
}
```

**التنفيذ**:
```typescript
// مستطيل
this._geometry = new THREE.PlaneGeometry(width, height);

// دائرة
this._geometry = new THREE.CircleGeometry(radius, 32);

// مضلع مخصص
const shape = new THREE.Shape();
shape.moveTo(points[0].x, points[0].y);
for (let i = 1; i < points.length; i++) {
  shape.lineTo(points[i].x, points[i].y);
}
this._geometry = new THREE.ShapeGeometry(shape);
```

### 4. نظام الكاميرا

**الملف**: `GDJS/Runtime/three-renderers/camera-system.ts`

**الواجهة**:
```typescript
class CameraSystem {
  private _camera: THREE.Camera;
  private _cameraType: 'orthographic' | 'perspective';
  
  constructor(type: 'orthographic' | 'perspective');
  updatePosition(x: number, y: number, z: number): void;
  updateRotation(x: number, y: number, z: number): void;
  setZoom(zoom: number): void;
  setFOV(fov: number): void;
  convertScreenToWorld(screenX: number, screenY: number): Vector3;
}
```

**التنفيذ**:
```typescript
// للطبقات 2D
this._camera = new THREE.OrthographicCamera(
  -width / 2, width / 2,
  height / 2, -height / 2,
  0.1, 1000
);
this._camera.position.z = 500; // ثابت

// للطبقات 3D
this._camera = new THREE.PerspectiveCamera(
  45, // FOV
  width / height, // aspect
  0.1, // near
  2000 // far
);
```

### 5. نظام التأثيرات (Effects)

#### 5.1 البنية الأساسية

**الملف**: `GDJS/Runtime/three-renderers/effects/effect-system.ts`

**الواجهة**:
```typescript
interface EffectPass {
  name: string;
  enabled: boolean;
  pass: THREE_ADDONS.Pass;
  uniforms: Record<string, any>;
}

class EffectSystem {
  private _composer: THREE_ADDONS.EffectComposer;
  private _passes: Map<string, EffectPass>;
  
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera);
  addEffect(name: string, pass: THREE_ADDONS.Pass): void;
  removeEffect(name: string): void;
  setEffectParameter(name: string, param: string, value: any): void;
  render(): void;
}
```

#### 5.2 تأثير Blur

**الملف**: `GDJS/Runtime/three-renderers/effects/blur-effect.ts`

**الشيفر**:
```glsl
// Vertex Shader
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float blurAmount;
varying vec2 vUv;

void main() {
  vec4 sum = vec4(0.0);
  float blur = blurAmount / resolution.x;
  
  // 9-tap Gaussian blur
  sum += texture2D(tDiffuse, vec2(vUv.x - 4.0*blur, vUv.y)) * 0.05;
  sum += texture2D(tDiffuse, vec2(vUv.x - 3.0*blur, vUv.y)) * 0.09;
  sum += texture2D(tDiffuse, vec2(vUv.x - 2.0*blur, vUv.y)) * 0.12;
  sum += texture2D(tDiffuse, vec2(vUv.x - blur, vUv.y)) * 0.15;
  sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.16;
  sum += texture2D(tDiffuse, vec2(vUv.x + blur, vUv.y)) * 0.15;
  sum += texture2D(tDiffuse, vec2(vUv.x + 2.0*blur, vUv.y)) * 0.12;
  sum += texture2D(tDiffuse, vec2(vUv.x + 3.0*blur, vUv.y)) * 0.09;
  sum += texture2D(tDiffuse, vec2(vUv.x + 4.0*blur, vUv.y)) * 0.05;
  
  gl_FragColor = sum;
}
```

#### 5.3 تأثير Bloom

**الملف**: `GDJS/Runtime/three-renderers/effects/bloom-effect.ts`

**التنفيذ**:
```typescript
const bloomPass = new THREE_ADDONS.UnrealBloomPass(
  new THREE.Vector2(width, height),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
);

this._composer.addPass(bloomPass);
```

### 6. نظام إدارة الموارد

**الملف**: `GDJS/Runtime/three-renderers/resource-manager.ts`

**الواجهة**:
```typescript
class ResourceManager {
  private _textures: Map<string, THREE.Texture>;
  private _models: Map<string, THREE_ADDONS.GLTF>;
  private _textureLoader: THREE.TextureLoader;
  private _gltfLoader: THREE_ADDONS.GLTFLoader;
  
  loadTexture(url: string): Promise<THREE.Texture>;
  loadModel(url: string): Promise<THREE_ADDONS.GLTF>;
  getTexture(url: string): THREE.Texture | null;
  getModel(url: string): THREE_ADDONS.GLTF | null;
  dispose(): void;
}
```

**التنفيذ**:
```typescript
// تحميل الصور مع cache
async loadTexture(url: string): Promise<THREE.Texture> {
  if (this._textures.has(url)) {
    return this._textures.get(url)!;
  }
  
  const texture = await this._textureLoader.loadAsync(url);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  this._textures.set(url, texture);
  return texture;
}

// Texture Atlas للأداء
createAtlas(images: string[]): THREE.Texture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // ترتيب الصور في atlas
  // ... logic
  
  return new THREE.CanvasTexture(canvas);
}
```

## تدفق البيانات

### 1. تدفق الرسم الرئيسي

```
Game Loop
    │
    ▼
RuntimeScene.step()
    │
    ▼
RuntimeScene.render()
    │
    ▼
RuntimeSceneThreeRenderer.render()
    │
    ├─► Update all objects
    │   ├─► Update 2D objects (sprites, text, etc.)
    │   └─► Update 3D objects (models, cubes, etc.)
    │
    ├─► Update cameras
    │
    ├─► Update effects
    │
    └─► THREE.WebGLRenderer.render(scene, camera)
```

### 2. تدفق إضافة كائن جديد

```
Create Object
    │
    ▼
RuntimeObject.constructor()
    │
    ▼
Create Renderer (e.g., SpriteRuntimeObjectThreeRenderer)
    │
    ├─► Load texture
    │
    ├─► Create THREE.Sprite or THREE.Mesh
    │
    └─► Add to layer
        │
        ▼
    LayerThreeRenderer.addObject()
        │
        ▼
    THREE.Group.add(object)
```

### 3. تدفق تطبيق تأثير

```
Add Effect
    │
    ▼
Layer.addEffect(effectData)
    │
    ▼
EffectSystem.addEffect()
    │
    ├─► Create shader pass
    │
    ├─► Set uniforms
    │
    └─► Add to composer
        │
        ▼
    EffectComposer.addPass(pass)
```

## قرارات التصميم الرئيسية

### 1. لماذا THREE.Sprite بدلاً من THREE.Mesh؟

**القرار**: استخدام `THREE.Sprite` للكائنات البسيطة و `THREE.Mesh` للكائنات المعقدة

**الأسباب**:
- `THREE.Sprite` أسرع للكائنات البسيطة
- `THREE.Sprite` يواجه الكاميرا تلقائياً (billboard)
- `THREE.Mesh` يعطي تحكم أكبر في الدوران والإضاءة

### 2. لماذا Canvas للنصوص؟

**القرار**: رسم النصوص على Canvas ثم تحويلها إلى Texture

**الأسباب**:
- Canvas API قوي جداً للنصوص
- دعم جميع الخطوط والأحجام
- سهولة تطبيق التأثيرات (shadow, outline)
- أداء جيد مع نظام cache

### 3. لماذا EffectComposer؟

**القرار**: استخدام `THREE_ADDONS.EffectComposer` للتأثيرات

**الأسباب**:
- نظام قياسي في Three.js
- دعم تسلسل التأثيرات
- سهولة إضافة تأثيرات جديدة
- أداء ممتاز

### 4. لماذا OrthographicCamera للطبقات 2D؟

**القرار**: استخدام `OrthographicCamera` للطبقات ثنائية الأبعاد

**الأسباب**:
- لا تشويه في المنظور
- أحجام ثابتة بغض النظر عن المسافة
- أداء أفضل قليلاً
- توافق أفضل مع الألعاب 2D التقليدية

## الاختبارات

### 1. اختبارات الوحدة (Unit Tests)

```typescript
describe('SpriteRuntimeObjectThreeRenderer', () => {
  it('should create a sprite', () => {
    const renderer = new SpriteRuntimeObjectThreeRenderer(texture);
    expect(renderer._sprite).toBeDefined();
  });
  
  it('should update position', () => {
    renderer.updatePosition(10, 20, 0);
    expect(renderer._sprite.position.x).toBe(10);
    expect(renderer._sprite.position.y).toBe(-20); // Y معكوس
  });
  
  it('should set opacity', () => {
    renderer.setOpacity(0.5);
    expect(renderer._material.opacity).toBe(0.5);
  });
});
```

### 2. اختبارات الأداء (Performance Tests)

```typescript
describe('Performance', () => {
  it('should render 10000 sprites at 60 FPS', () => {
    const sprites = [];
    for (let i = 0; i < 10000; i++) {
      sprites.push(createSprite());
    }
    
    const startTime = performance.now();
    renderer.render();
    const endTime = performance.now();
    
    const frameTime = endTime - startTime;
    expect(frameTime).toBeLessThan(16.67); // 60 FPS
  });
});
```

### 3. اختبارات التكامل (Integration Tests)

```typescript
describe('Integration', () => {
  it('should render a complete scene', () => {
    const scene = createTestScene();
    scene.addSprite('player', 100, 100);
    scene.addText('Hello World', 200, 200);
    scene.addEffect('blur', { amount: 5 });
    
    expect(() => scene.render()).not.toThrow();
  });
});
```

## التوثيق

### 1. توثيق API

كل دالة عامة يجب أن تحتوي على:
- وصف الوظيفة
- المعاملات (parameters)
- القيمة المرجعة (return value)
- أمثلة الاستخدام
- ملاحظات خاصة

مثال:
```typescript
/**
 * Updates the position of the sprite in 3D space.
 * 
 * @param x - The X coordinate in world space
 * @param y - The Y coordinate in world space (will be negated for Three.js)
 * @param z - The Z coordinate (depth)
 * 
 * @example
 * ```typescript
 * renderer.updatePosition(100, 200, 0);
 * ```
 * 
 * @remarks
 * The Y coordinate is negated to match GDevelop's coordinate system
 * where Y increases downward.
 */
updatePosition(x: number, y: number, z: number): void {
  this._sprite.position.set(x, -y, z);
}
```

### 2. دليل المطور

يجب إنشاء دليل شامل يشمل:
- نظرة عامة على البنية
- كيفية إضافة كائنات جديدة
- كيفية إضافة تأثيرات جديدة
- أفضل الممارسات
- نصائح الأداء

## الخلاصة

هذا التصميم يوفر أساساً قوياً لمحرك رسم حديث وفعال. البنية المعمارية بسيطة ونظيفة، والأداء محسّن، والتوسع سهل. التحويل الكامل إلى Three.js سيجعل GDevelop محرك ألعاب أكثر قوة ومرونة.
