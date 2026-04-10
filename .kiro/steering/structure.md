# Project Structure

## Top-Level Directories

```
GDevelop/
├── Core/              # C++ core library - game structure, IDE tools
├── GDJS/              # TypeScript game engine + C++ exporters
├── GDevelop.js/       # Emscripten bindings (C++ to JS bridge)
├── newIDE/            # React-based game editor
├── Extensions/        # Built-in extensions (objects, behaviors, effects)
├── ExtLibs/           # External C++ libraries
├── SharedLibs/        # Shared JavaScript libraries
├── Binaries/          # Build outputs
└── scripts/           # Build and utility scripts
```

## Core Directory (`Core/`)

```
Core/
├── GDCore/
│   ├── Project/       # Game structure classes (Project, Layout, Object, etc.)
│   ├── IDE/           # IDE tools (refactoring, search, project ops)
│   ├── Events/        # Event system (conditions, actions, instructions)
│   ├── Extensions/    # Built-in extension declarations
│   ├── Serialization/ # JSON serialization
│   └── Tools/         # Utility functions
└── tests/             # C++ unit tests (Catch framework)
```

## GDJS Directory (`GDJS/`)

```
GDJS/
├── Runtime/           # TypeScript game engine (runs in games)
│   ├── gdjs/          # Core runtime classes
│   └── libs/          # Runtime libraries
├── GDJS/              # C++ IDE part (exporters, code generation)
│   ├── IDE/           # Export tools
│   ├── Events/        # Code generation from events
│   └── Extensions/    # Extension declarations for JS platform
└── tests/             # Engine tests
```

## newIDE Directory (`newIDE/`)

```
newIDE/
├── app/               # Main React application
│   ├── src/           # Source code
│   │   ├── UI/        # UI components
│   │   ├── MainFrame/ # Main editor frame
│   │   ├── ProjectManager/  # Project management
│   │   └── locales/   # Translations
│   └── scripts/       # Build scripts
├── electron-app/      # Electron desktop wrapper
├── web-app/           # Web deployment config
└── docs/              # Documentation
```

## Extensions Directory (`Extensions/`)

Each extension folder contains:
```
ExtensionName/
├── JsExtension.js     # Extension declaration (required)
├── *.ts               # Runtime implementation (TypeScript)
├── *.cpp/.h           # C++ implementation (if needed)
└── tests/             # Extension tests
```

Extension types:
- **Objects**: Game entities (sprites, text, 3D models)
- **Behaviors**: Reusable object logic (physics, pathfinding)
- **Effects**: Visual shaders
- **Actions/Conditions**: Event sheet instructions

## Key Architecture Concepts

### IDE vs Runtime
- **IDE code**: Used in the editor (C++ in Core/GDJS, JS in newIDE)
- **Runtime code**: Runs inside games (TypeScript in GDJS/Runtime)

### Extension Structure
- `JsExtension.js` - Declares extension to IDE
- `*runtime*.ts` - Runtime implementation for games
- `*renderer*.ts` - Editor rendering (PixiJS/Three.js)

### Code Generation
Events are transpiled to JavaScript/TypeScript at export time by `GDJS/GDJS/Events/CodeGeneration/`.

## Important Files

- `CMakeLists.txt` - Root CMake configuration
- `newIDE/app/package.json` - Editor dependencies and scripts
- `GDJS/package.json` - Game engine dependencies
- `.clang_format` - C++ formatting rules
- `Extensions/JsExtensionTypes.d.ts` - TypeScript definitions for extensions