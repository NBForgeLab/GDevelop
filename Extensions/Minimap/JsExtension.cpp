/**
 * GDevelop - Minimap Extension
 * Copyright (c) 2024 GDevelop Community
 * This project is released under the MIT License.
 */

#include "GDCore/Extensions/PlatformExtension.h"

#if defined(GD_IDE_ONLY)
#include "MinimapObject.h"
#include "MinimapMarkerBehavior.h"
#include "GDCore/Extensions/Metadata/MultipleInstructionMetadata.h"
#include "GDCore/Project/BehaviorsSharedData.h"
#include "GDCore/Project/Object.h"
#include "GDCore/Tools/Localization.h"

void DeclareMinimapExtension(gd::PlatformExtension& extension);

/**
 * JavaScript extension declaration for the Minimap extension.
 */
class MinimapJsExtension : public gd::PlatformExtension {
 public:
  MinimapJsExtension() {
    DeclareMinimapExtension(*this);

    // Mark the extension as a JavaScript extension
    GetObjectMetadata("Map::Map")
        .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js")
        .AddIncludeFile("Extensions/Minimap/minimapruntimeobject-pixi-renderer.js");

    GetBehaviorMetadata("Map::MapMarker")
        .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");

    GD_COMPLETE_EXTENSION_COMPILATION_INFORMATION();
  };
};

#if defined(EMSCRIPTEN)
extern "C" gd::PlatformExtension* CreateGDJSMinimapExtension() {
  return new MinimapJsExtension;
}
#else
/**
 * Used by GDevelop to create the extension class
 * -- Do not need to be modified. --
 */
extern "C" gd::PlatformExtension* GD_EXTENSION_API CreateGDJSMinimapExtension() {
  return new MinimapJsExtension;
}
#endif

#else
// When not in IDE mode (e.g., for Emscripten builds), provide a minimal stub
class MinimapJsExtension : public gd::PlatformExtension {
 public:
  MinimapJsExtension() {
    SetExtensionInformation(
        "Map",
        "Map",
        "Add a map (minimap/worldmap) to your game with automatic object tracking.",
        "GDevelop Community",
        "Open source (MIT License)");
  }
};

#if defined(EMSCRIPTEN)
extern "C" gd::PlatformExtension* CreateGDJSMinimapExtension() {
  return new MinimapJsExtension;
}
#endif
#endif
