# Technology Stack

## Core Architecture

GDevelop uses a hybrid C++/TypeScript/JavaScript architecture:

- **Core (C++)**: Game structure manipulation, project handling, IDE tools
- **GDJS (TypeScript)**: HTML5/JavaScript game engine runtime
- **GDevelop.js**: Emscripten bindings exposing C++ to JavaScript
- **newIDE (JavaScript/React)**: The game editor application

## Build Systems

### C++ Components (CMake)
```bash
# Build Core, GDJS, and Extensions
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

Build options:
- `BUILD_CORE` - Build GDevelop Core library
- `BUILD_GDJS` - Build GDevelop JS Platform
- `BUILD_EXTENSIONS` - Build extensions
- `BUILD_TESTS` - Build tests

### Editor (Node.js/npm)
```bash
cd newIDE/app
npm install          # Install dependencies
npm start           # Start development server
npm run build       # Production build
npm test            # Run tests
npm run flow        # Type checking
npm run format      # Format code with Prettier
```

### Game Engine (GDJS)
```bash
cd GDJS
npm install          # Install dependencies
npm run build       # Build runtime (production)
npm run build -- --debug  # Debug build
npm run check-types # TypeScript type checking
npm test            # Run tests
```

### Electron Desktop App
```bash
cd newIDE/electron-app
npm install
npm run start       # Launch desktop app
npm run build       # Build for distribution
```

## Key Libraries & Frameworks

### Editor (newIDE)
- **React 18** - UI framework
- **Material-UI** - Component library
- **Electron** - Desktop app wrapper
- **PixiJS 7** - 2D rendering
- **Three.js** - 3D rendering
- **Flow** - Static type checking
- **Prettier** - Code formatting

### Game Engine (GDJS Runtime)
- **TypeScript** - Primary language
- **PixiJS 7** - 2D WebGL rendering
- **Three.js** - 3D WebGL rendering
- **esbuild** - Fast bundling

### C++ Core
- **C++11** - Language standard
- **Emscripten** - C++ to WebAssembly compilation
- **CMake** - Build system

## Code Style

### Game Engine & Extensions (TypeScript)
- Use ES6+ features cautiously (avoid spread operators, shorthand properties)
- Minimize garbage collection - pre-allocate objects, avoid runtime function creation
- Declare all properties at object creation for V8 hidden class optimization
- Type everything explicitly, avoid `any`

### Editor (JavaScript/Flow)
- Modern JavaScript with all latest features
- Arrow functions, classes, const/let required
- Flow for type checking

### C++ Code
- Google style with `BinPackParameters: false`
- Use clang-format for formatting

## Testing

- **Core/GDJS C++**: Catch-based tests in `Core/tests/` and `GDJS/tests/`
- **Editor**: Jest tests via `npm test` in `newIDE/app`
- **Game Engine**: Tests in `GDJS/tests/`

## CI/CD

- **CircleCI**: macOS and Linux builds
- **Semaphore**: Fast tests
- **AppVeyor**: Windows builds