# استبدال مستطيل منطقة الكاميرا بشبكة (Grid) في محرر 3D

## التغيير
في محرر اللعبة المدمج 3D (`embedded-game`):
- **قبل**: مستطيل (BoxHelper) يحيط بمنطقة عرض الكاميرا
- **بعد**: شبكة (GridHelper) تظهر في منطقة عرض الكاميرا

## ملاحظة مهمة
هذا التغيير **فقط** في محرر 3D (`embedded-game`)، وليس في محرر 2D (`instances-editor`).

## التنفيذ

### الملف المعدل
`GDJS/Runtime/InGameEditor/InGameEditor.tsx`

### الدالة المعدلة
`_updateInnerAreaOutline()`

### التفاصيل التقنية

```typescript
// إنشاء GridHelper بدلاً من BoxHelper
const gridSize = 1000; // سيتم تحجيمه ليناسب منطقة الكاميرا
const divisions = 20; // عدد خطوط الشبكة
const gridHelper = new THREE.GridHelper(gridSize, divisions, '#444444', '#444444');

// خصائص الشبكة
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.3; // شفافية 30%
gridHelper.rotation.x = Math.PI / 2; // تدوير إلى مستوى XY
gridHelper.material.fog = false; // تعطيل تأثير الضباب
```

### التموضع والتحجيم
- **الموضع**: مركز منطقة عرض الكاميرا
- **الحجم**: يتم تحجيم الشبكة تلقائياً لتناسب أبعاد منطقة الكاميرا
- **المستوى**: XY (أفقي)

## الفرق بين المحررين

### محرر 2D (instances-editor)
- **الملف**: `newIDE/app/src/InstancesEditor/WindowBorder.js`
- **العرض**: مستطيل (Rectangle) - **لم يتغير**
- **السبب**: محرر 2D يستخدم PixiJS وليس Three.js

### محرر 3D (embedded-game)
- **الملف**: `GDJS/Runtime/InGameEditor/InGameEditor.tsx`
- **العرض**: شبكة (Grid) - **تم التغيير**
- **السبب**: محرر 3D يستخدم Three.js ويدعم GridHelper

## الخصائص المستخدمة

| الخاصية | القيمة | الوصف |
|---------|--------|-------|
| `gridSize` | 1000 | الحجم الأساسي (يتم تحجيمه) |
| `divisions` | 20 | عدد خطوط الشبكة |
| `color` | #444444 | لون رمادي |
| `opacity` | 0.3 | شفافية 30% |
| `rotation.x` | π/2 | تدوير إلى مستوى XY |

## النتيجة
✅ الشبكة تظهر في محرر 3D فقط
✅ المستطيل يظهر في محرر 2D فقط
✅ استخدام `THREE.GridHelper` المدمج في Three.js
✅ تحجيم وتموضع تلقائي
