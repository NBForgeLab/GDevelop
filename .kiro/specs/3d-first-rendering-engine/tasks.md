# مهام تنفيذ محرك الرسم 3D-First

## المرحلة 1: البنية الأساسية (شهر واحد)

### 1.1 إعداد البيئة والبنية الأساسية
- [x] 1.1.1 إنشاء مجلد `GDJS/Runtime/three-renderers/`
- [x] 1.1.2 إنشاء ملفات التعريفات TypeScript
- [x] 1.1.3 تحديث `package.json` لإزالة PixiJS
- [x] 1.1.4 تحديث `tsconfig.json` للمسارات الجديدة

### 1.2 إنشاء RuntimeSceneThreeRenderer
- [x] 1.2.1 إنشاء ملف `runtimescene-three-renderer.ts`
- [x] 1.2.2 تنفيذ constructor مع THREE.WebGLRenderer
- [x] 1.2.3 تنفيذ دالة render() الأساسية
- [x] 1.2.4 تنفيذ onGameResolutionResized()
- [x] 1.2.5 إضافة دعم WebGL context options
- [x] 1.2.6 إضافة error handling للـ WebGL

### 1.3 إنشاء نظام الطبقات
- [x] 1.3.1 إنشاء ملف `layer-three-renderer.ts`
- [x] 1.3.2 تنفيذ LayerThreeRenderer class
- [x] 1.3.3 إضافة دعم THREE.Group للطبقات
- [x] 1.3.4 تنفيذ Z-ordering للكائنات
- [x] 1.3.5 تنفيذ إخفاء/إظهار الطبقات
- [ ] 1.3.6 إضافة دعم blend modes للطبقات

### 1.4 إنشاء نظام الكاميرا
- [ ] 1.4.1 إنشاء ملف `camera-system.ts`
- [x] 1.4.2 تنفيذ OrthographicCamera للطبقات 2D
- [x] 1.4.3 تنفيذ PerspectiveCamera للطبقات 3D
- [x] 1.4.4 تنفيذ دوال التحكم بالكاميرا (pan, zoom, rotate)
- [x] 1.4.5 تنفيذ convertScreenToWorld()
- [x] 1.4.6 تنفيذ convertWorldToScreen()

### 1.5 نظام إدارة الموارد (Resource Manager)
- [x] 1.5.1 إنشاء ملف `resource-manager.ts`
- [ ] 1.5.2 تنفيذ ResourceManager class
- [x] 1.5.3 تنفيذ loadTexture() مع cache
- [x] 1.5.4 تنفيذ getTexture() و getTextureSync()
- [x] 1.5.5 تنفيذ loadModel() للنماذج 3D (GLTF/GLB)
- [x] 1.5.6 تنفيذ getModel() و getModelSync()
- [x] 1.5.7 تنفيذ dispose() لتحرير الموارد
- [ ] 1.5.8 تنفيذ createAtlas() للـ texture atlases
- [ ] 1.5.9 إضافة دعم ضغط الصور (compression)
- [x] 1.5.10 تنفيذ نظام التحميل المسبق (preloading)
- [x] 1.5.11 إضافة دعم loading progress callbacks
- [ ] 1.5.12 كتابة unit tests

### 1.6 اختبارات المرحلة الأولى
- [ ] 1.6.1 كتابة unit tests للـ RuntimeSceneThreeRenderer
- [ ] 1.6.2 كتابة unit tests للـ LayerThreeRenderer
- [ ] 1.6.3 كتابة unit tests للـ CameraSystem
- [ ] 1.6.4 كتابة unit tests للـ ResourceManager
- [ ] 1.6.5 اختبار الرسم الأساسي (مكعب بسيط)

## المرحلة 2: الكائنات الأساسية (2-3 أشهر)

### 2.1 كائن Sprite
- [x] 2.1.1 إنشاء ملف `three-renderers/spriteruntimeobject-three-renderer.ts`
- [x] 2.1.2 تنفيذ SpriteRuntimeObjectThreeRenderer class
- [x] 2.1.3 تنفيذ تحميل الصور كـ THREE.Texture
- [x] 2.1.4 تنفيذ updatePosition()
- [x] 2.1.5 تنفيذ updateRotation()
- [x] 2.1.6 تنفيذ updateScale()
- [x] 2.1.7 تنفيذ setOpacity()
- [x] 2.1.8 تنفيذ setBlendMode()
- [x] 2.1.9 تنفيذ flip (horizontal/vertical)
- [x] 2.1.10 إضافة دعم tint color
- [ ] 2.1.11 كتابة unit tests

### 2.2 نظام الرسوم المتحركة للـ Sprites
- [ ] 2.2.1 إنشاء ملف `sprite-animation-system.ts`
- [ ] 2.2.2 تنفيذ Animation class
- [ ] 2.2.3 تنفيذ AnimationFrame class
- [ ] 2.2.4 تنفيذ playAnimation()
- [ ] 2.2.5 تنفيذ pauseAnimation()
- [ ] 2.2.6 تنفيذ stopAnimation()
- [ ] 2.2.7 تنفيذ setAnimationSpeed()
- [ ] 2.2.8 إضافة دعم animation events
- [ ] 2.2.9 كتابة unit tests

### 2.3 كائن النص (Text)
- [x] 2.3.1 إنشاء ملف `Extensions/TextObject/textruntimeobject-three-renderer.ts`
- [x] 2.3.2 تنفيذ TextRuntimeObjectThreeRenderer class
- [x] 2.3.3 تنفيذ رسم النص على Canvas
- [x] 2.3.4 تنفيذ تحويل Canvas إلى THREE.Texture
- [x] 2.3.5 تنفيذ updateText()
- [x] 2.3.6 تنفيذ setColor()
- [x] 2.3.7 تنفيذ setFontSize()
- [x] 2.3.8 تنفيذ setFontFamily()
- [x] 2.3.9 تنفيذ text alignment (left, center, right)
- [x] 2.3.10 إضافة دعم text shadow
- [x] 2.3.11 إضافة دعم text outline
- [ ] 2.3.12 تنفيذ text cache للأداء
- [ ] 2.3.13 كتابة unit tests

### 2.4 كائن الشكل (Shape)
- [ ] 2.4.1 إنشاء ملف `shaperuntimeobject-three.ts`
- [ ] 2.4.2 تنفيذ ShapeRuntimeObjectThreeRenderer class
- [ ] 2.4.3 تنفيذ رسم المستطيل (Rectangle)
- [ ] 2.4.4 تنفيذ رسم الدائرة (Circle)
- [ ] 2.4.5 تنفيذ رسم المضلع (Polygon)
- [ ] 2.4.6 تنفيذ setFillColor()
- [ ] 2.4.7 تنفيذ setStrokeColor()
- [ ] 2.4.8 تنفيذ setStrokeWidth()
- [ ] 2.4.9 إضافة دعم gradients
- [ ] 2.4.10 كتابة unit tests

### 2.5 كائن TiledSprite
- [x] 2.5.1 إنشاء ملف `Extensions/TiledSpriteObject/tiledspriteruntimeobject-three-renderer.ts`
- [x] 2.5.2 تنفيذ TiledSpriteRuntimeObjectThreeRenderer class
- [x] 2.5.3 تنفيذ repeating textures
- [ ] 2.5.4 تنفيذ setTileScale()
- [x] 2.5.5 تنفيذ setTileOffset()
- [x] 2.5.6 تنفيذ scrolling
- [ ] 2.5.7 كتابة unit tests

### 2.6 كائن الجسيمات (Particles)
- [x] 2.6.1 إنشاء ملف `particleemitterobject-three.ts`
- [ ] 2.6.2 تنفيذ ParticleEmitterObjectThreeRenderer class
- [ ] 2.6.3 تنفيذ نظام الجسيمات بـ THREE.Points
- [ ] 2.6.4 تنفيذ particle emitter
- [ ] 2.6.5 تنفيذ particle physics (velocity, gravity, etc.)
- [ ] 2.6.6 تنفيذ particle lifetime
- [ ] 2.6.7 تنفيذ particle color over time
- [ ] 2.6.8 تنفيذ particle size over time
- [ ] 2.6.9 إضافة دعم texture للجسيمات
- [ ] 2.6.10 تحسين الأداء بـ InstancedMesh
- [ ] 2.6.11 كتابة unit tests

### 2.7 اختبارات المرحلة الثانية
- [ ] 2.7.1 اختبار جميع الكائنات معاً
- [ ] 2.7.2 اختبار الأداء مع 1000+ كائن
- [ ] 2.7.3 اختبار الذاكرة (memory leaks)
- [ ] 2.7.4 اختبار التوافق مع المتصفحات

## المرحلة 3: التأثيرات والأنظمة (2 أشهر)

### 3.1 نظام التأثيرات الأساسي
- [ ] 3.1.1 إنشاء ملف `effect-system.ts`
- [ ] 3.1.2 تنفيذ EffectSystem class
- [ ] 3.1.3 إضافة دعم THREE_ADDONS.EffectComposer
- [ ] 3.1.4 تنفيذ addEffect()
- [ ] 3.1.5 تنفيذ removeEffect()
- [ ] 3.1.6 تنفيذ setEffectParameter()
- [ ] 3.1.7 تنفيذ enableEffect() / disableEffect()

### 3.2 تأثير Blur
- [ ] 3.2.1 إنشاء ملف `effects/blur-effect.ts`
- [ ] 3.2.2 كتابة vertex shader
- [ ] 3.2.3 كتابة fragment shader (Gaussian blur)
- [ ] 3.2.4 تنفيذ BlurEffect class
- [ ] 3.2.5 تنفيذ setBlurAmount()
- [ ] 3.2.6 تحسين الأداء (two-pass blur)
- [ ] 3.2.7 كتابة unit tests

### 3.3 تأثير Glow
- [ ] 3.3.1 إنشاء ملف `effects/glow-effect.ts`
- [ ] 3.3.2 كتابة shaders
- [ ] 3.3.3 تنفيذ GlowEffect class
- [ ] 3.3.4 تنفيذ setGlowIntensity()
- [ ] 3.3.5 تنفيذ setGlowColor()
- [ ] 3.3.6 كتابة unit tests

### 3.4 تأثير Color Matrix
- [ ] 3.4.1 إنشاء ملف `effects/color-matrix-effect.ts`
- [ ] 3.4.2 كتابة shaders
- [ ] 3.4.3 تنفيذ ColorMatrixEffect class
- [ ] 3.4.4 تنفيذ setBrightness()
- [ ] 3.4.5 تنفيذ setContrast()
- [ ] 3.4.6 تنفيذ setSaturation()
- [ ] 3.4.7 تنفيذ setHue()
- [ ] 3.4.8 كتابة unit tests

### 3.5 تأثير Displacement
- [ ] 3.5.1 إنشاء ملف `effects/displacement-effect.ts`
- [ ] 3.5.2 كتابة shaders
- [ ] 3.5.3 تنفيذ DisplacementEffect class
- [ ] 3.5.4 تنفيذ setDisplacementMap()
- [ ] 3.5.5 تنفيذ setDisplacementScale()
- [ ] 3.5.6 كتابة unit tests

### 3.6 تأثير Pixelate
- [ ] 3.6.1 إنشاء ملف `effects/pixelate-effect.ts`
- [ ] 3.6.2 كتابة shaders
- [ ] 3.6.3 تنفيذ PixelateEffect class
- [ ] 3.6.4 تنفيذ setPixelSize()
- [ ] 3.6.5 كتابة unit tests

### 3.7 تأثير Bloom (Post-Processing)
- [ ] 3.7.1 إنشاء ملف `effects/bloom-effect.ts`
- [ ] 3.7.2 استخدام THREE_ADDONS.UnrealBloomPass
- [ ] 3.7.3 تنفيذ BloomEffect class
- [ ] 3.7.4 تنفيذ setStrength()
- [ ] 3.7.5 تنفيذ setRadius()
- [ ] 3.7.6 تنفيذ setThreshold()
- [ ] 3.7.7 كتابة unit tests

### 3.8 تأثير Depth of Field
- [ ] 3.8.1 إنشاء ملف `effects/dof-effect.ts`
- [ ] 3.8.2 استخدام THREE_ADDONS.BokehPass
- [ ] 3.8.3 تنفيذ DOFEffect class
- [ ] 3.8.4 تنفيذ setFocus()
- [ ] 3.8.5 تنفيذ setAperture()
- [ ] 3.8.6 تنفيذ setMaxBlur()
- [ ] 3.8.7 كتابة unit tests

### 3.9 تأثير SSAO
- [ ] 3.9.1 إنشاء ملف `effects/ssao-effect.ts`
- [ ] 3.9.2 استخدام THREE_ADDONS.SSAOPass
- [ ] 3.9.3 تنفيذ SSAOEffect class
- [ ] 3.9.4 تنفيذ setRadius()
- [ ] 3.9.5 تنفيذ setIntensity()
- [ ] 3.9.6 كتابة unit tests

### 3.10 نظام الإضاءة الموحد
- [ ] 3.10.1 إنشاء ملف `lighting/light-system.ts`
- [ ] 3.10.2 تنفيذ LightSystem class
- [ ] 3.10.3 إضافة دعم إضاءة الكائنات 2D
- [ ] 3.10.4 تحديث materials للكائنات 2D لدعم الإضاءة
- [ ] 3.10.5 تنفيذ addLight()
- [ ] 3.10.6 تنفيذ removeLight()
- [ ] 3.10.7 كتابة unit tests

### 3.11 نظام الظلال
- [ ] 3.11.1 إنشاء ملف `lighting/shadow-system.ts`
- [ ] 3.11.2 تنفيذ ShadowSystem class
- [ ] 3.11.3 إضافة دعم ظلال للكائنات 2D
- [ ] 3.11.4 تنفيذ setShadowQuality()
- [ ] 3.11.5 تنفيذ setShadowBias()
- [ ] 3.11.6 تحسين أداء الظلال
- [ ] 3.11.7 كتابة unit tests

### 3.12 اختبارات المرحلة الثالثة
- [ ] 3.12.1 اختبار جميع التأثيرات معاً
- [ ] 3.12.2 اختبار الأداء مع تأثيرات متعددة
- [ ] 3.12.3 اختبار الإضاءة والظلال
- [ ] 3.12.4 اختبار visual regression

## المرحلة 4: التكامل والإطلاق (أسبوعان)

### 4.1 التكامل مع GDevelop
- [ ] 4.1.1 تحديث المحرر (Editor)
- [ ] 4.1.2 تحديث معاينة الكائنات
- [ ] 4.1.3 تحديث نظام الأحداث (Events)
- [ ] 4.1.4 اختبار التكامل الكامل

### 4.2 إزالة الكود القديم
- [ ] 4.2.1 إزالة جميع ملفات pixi-renderers
- [ ] 4.2.2 إزالة PixiJS من dependencies
- [ ] 4.2.3 تنظيف الكود
- [ ] 4.2.4 تحديث build scripts

### 4.3 الإطلاق
- [ ] 4.3.1 إنشاء release notes
- [ ] 4.3.2 إنشاء migration guide للمستخدمين
- [ ] 4.3.3 تحديث الموقع والتوثيق
- [ ] 4.3.4 الإطلاق التجريبي (beta)
- [ ] 4.3.5 جمع feedback
- [ ] 4.3.6 إصلاح المشاكل
- [ ] 4.3.7 الإطلاق النهائي

## ملاحظات

### الأولويات
- **عالية جداً**: المرحلة 1 و 2 (البنية الأساسية والكائنات)
- **عالية**: المرحلة 3 (التأثيرات)
- **متوسطة**: المرحلة 4 (التكامل والإطلاق)

### التبعيات
- المرحلة 2 تعتمد على المرحلة 1
- المرحلة 3 تعتمد على المرحلة 1 و 2
- المرحلة 4 تعتمد على جميع المراحل السابقة

### الجدول الزمني المقدر
- المرحلة 1: 4 أسابيع
- المرحلة 2: 8-12 أسبوع
- المرحلة 3: 8 أسابيع
- المرحلة 4: 2 أسبوع
- **المجموع**: 22-26 أسبوع (5-6 أشهر)
