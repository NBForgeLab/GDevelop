/**
 * GDevelop - Minimap Extension
 * Copyright (c) 2024 GDevelop Community
 * This project is released under the MIT License.
 */

#include "MinimapObject.h"
#include "MinimapMarkerBehavior.h"
#include "GDCore/Extensions/PlatformExtension.h"
#include "GDCore/Project/BehaviorsSharedData.h"
#include "GDCore/Tools/Localization.h"

void DeclareMinimapExtension(gd::PlatformExtension& extension) {
  extension
      .SetExtensionInformation(
          "Minimap",
          _("Minimap"),
          _("Add a minimap to your game with automatic object tracking, "
            "customizable markers, and visual customization support."),
          "GDevelop Community",
          "Open source (MIT License)")
      .SetExtensionHelpPath("/objects/minimap")
      .SetCategory("User interface")
      .SetTags("minimap");

  // ===== MINIMAP OBJECT =====
  
  gd::ObjectMetadata& minimapObject = extension.AddObject<MinimapObject>(
      "Minimap",
      _("Minimap"),
      _("A minimap that automatically tracks objects with markers and displays "
        "them on screen."),
      "CppPlatform/Extensions/texticon.png");

  minimapObject
      .AddExpression("ZoomLevel",
                     _("Zoom level"),
                     _("Get the current zoom level."),
                     _("Zoom"),
                     "CppPlatform/Extensions/cameraicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("getZoomLevel")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js")
      .AddIncludeFile("Extensions/Minimap/minimapruntimeobject-pixi-renderer.js");

  minimapObject
      .AddExpression("TrackedCount",
                     _("Tracked objects count"),
                     _("Get the number of tracked objects."),
                     _("Tracking"),
                     "CppPlatform/Extensions/positionicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("string", _("Marker type (optional)"), "", true)
      .SetDefaultValue("")
      .SetFunctionName("getTrackedCount")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // Visibility actions
  minimapObject
      .AddAction("Show",
                 _("Show minimap"),
                 _("Show the minimap."),
                 _("Show _PARAM0_"),
                 _("Visibility"),
                 "CppPlatform/Extensions/visibleicon.png",
                 "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("show")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("Hide",
                 _("Hide minimap"),
                 _("Hide the minimap."),
                 _("Hide _PARAM0_"),
                 _("Visibility"),
                 "CppPlatform/Extensions/visibleicon.png",
                 "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("hide")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("ToggleVisibility",
                 _("Toggle visibility"),
                 _("Toggle the minimap visibility."),
                 _("Toggle visibility of _PARAM0_"),
                 _("Visibility"),
                 "CppPlatform/Extensions/visibleicon.png",
                 "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("toggleVisibility")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // Zoom actions
  minimapObject
      .AddAction("ZoomIn",
                 _("Zoom in"),
                 _("Zoom in the minimap."),
                 _("Zoom in _PARAM0_"),
                 _("Zoom"),
                 "CppPlatform/Extensions/cameraicon.png",
                 "CppPlatform/Extensions/cameraicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("zoomIn")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("ZoomOut",
                 _("Zoom out"),
                 _("Zoom out the minimap."),
                 _("Zoom out _PARAM0_"),
                 _("Zoom"),
                 "CppPlatform/Extensions/cameraicon.png",
                 "CppPlatform/Extensions/cameraicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("zoomOut")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("SetZoom",
                 _("Set zoom level"),
                 _("Set the zoom level of the minimap."),
                 _("Set zoom level of _PARAM0_ to _PARAM1_"),
                 _("Zoom"),
                 "CppPlatform/Extensions/cameraicon.png",
                 "CppPlatform/Extensions/cameraicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("expression", _("Zoom level"))
      .SetFunctionName("setZoom")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // Position and size actions
  minimapObject
      .AddAction("SetPosition",
                 _("Set position"),
                 _("Set the position of the minimap on screen."),
                 _("Set position of _PARAM0_ to _PARAM1_;_PARAM2_"),
                 _("Position"),
                 "CppPlatform/Extensions/positionicon.png",
                 "CppPlatform/Extensions/positionicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("expression", _("X position"))
      .AddParameter("expression", _("Y position"))
      .SetFunctionName("setPosition")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("SetSize",
                 _("Set size"),
                 _("Set the size of the minimap."),
                 _("Set size of _PARAM0_ to _PARAM1_"),
                 _("Size"),
                 "CppPlatform/Extensions/scalewidthicon.png",
                 "CppPlatform/Extensions/scalewidthicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("expression", _("Size"))
      .SetFunctionName("setSize")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // Conditions
  minimapObject
      .AddCondition("IsVisible",
                    _("Is visible"),
                    _("Check if the minimap is visible."),
                    _("_PARAM0_ is visible"),
                    _("Visibility"),
                    "CppPlatform/Extensions/visibleicon.png",
                    "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .SetFunctionName("isVisible")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // ===== MINIMAP MARKER BEHAVIOR =====
  
  gd::BehaviorMetadata& minimapMarkerBehavior = extension.AddBehavior(
      "MinimapMarker",
      _("Minimap Marker"),
      "MinimapMarker",
      _("Mark this object to be tracked and displayed on the minimap."),
      "",
      "CppPlatform/Extensions/draggableicon.png",
      "MinimapMarker",
      std::make_shared<MinimapMarkerBehavior>(),
      std::make_shared<gd::BehaviorsSharedData>());

  // Behavior actions
  minimapMarkerBehavior
      .AddAction("ShowOnMinimap",
                 _("Show on minimap"),
                 _("Show the object on the minimap."),
                 _("Show _PARAM0_ on minimap"),
                 _("Visibility"),
                 "CppPlatform/Extensions/visibleicon.png",
                 "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Object"))
      .AddParameter("behavior", _("Behavior"), "MinimapMarker")
      .SetFunctionName("showOnMinimap")
      .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");

  minimapMarkerBehavior
      .AddAction("HideOnMinimap",
                 _("Hide on minimap"),
                 _("Hide the object from the minimap."),
                 _("Hide _PARAM0_ from minimap"),
                 _("Visibility"),
                 "CppPlatform/Extensions/visibleicon.png",
                 "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Object"))
      .AddParameter("behavior", _("Behavior"), "MinimapMarker")
      .SetFunctionName("hideOnMinimap")
      .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");

  minimapMarkerBehavior
      .AddAction("SetMarkerType",
                 _("Set marker type"),
                 _("Set the marker type."),
                 _("Set marker type of _PARAM0_ to _PARAM2_"),
                 _("Configuration"),
                 "CppPlatform/Extensions/texticon.png",
                 "CppPlatform/Extensions/texticon.png")
      .AddParameter("object", _("Object"))
      .AddParameter("behavior", _("Behavior"), "MinimapMarker")
      .AddParameter("stringWithSelector",
                    _("Marker type"),
                    "[\"Player\", \"Enemy\", \"Ally\", \"Item\", \"Objective\", "
                    "\"Waypoint\", \"Obstacle\", \"Neutral\", \"Custom\"]")
      .SetFunctionName("setMarkerType")
      .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");

  minimapMarkerBehavior
      .AddAction("Flash",
                 _("Flash marker"),
                 _("Make the marker flash to attract attention."),
                 _("Flash marker of _PARAM0_ for _PARAM2_ seconds"),
                 _("Effects"),
                 "CppPlatform/Extensions/particlesystemicon.png",
                 "CppPlatform/Extensions/particlesystemicon.png")
      .AddParameter("object", _("Object"))
      .AddParameter("behavior", _("Behavior"), "MinimapMarker")
      .AddParameter("expression", _("Duration (seconds)"))
      .SetFunctionName("flash")
      .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");

  // Behavior conditions
  minimapMarkerBehavior
      .AddCondition("IsVisibleOnMinimap",
                    _("Is visible on minimap"),
                    _("Check if the object is visible on the minimap."),
                    _("_PARAM0_ is visible on minimap"),
                    _("Visibility"),
                    "CppPlatform/Extensions/visibleicon.png",
                    "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Object"))
      .AddParameter("behavior", _("Behavior"), "MinimapMarker")
      .SetFunctionName("isVisibleOnMinimap")
      .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");

  minimapMarkerBehavior
      .AddCondition("MarkerTypeIs",
                    _("Marker type is"),
                    _("Check the marker type."),
                    _("Marker type of _PARAM0_ is _PARAM2_"),
                    _("Configuration"),
                    "CppPlatform/Extensions/texticon.png",
                    "CppPlatform/Extensions/texticon.png")
      .AddParameter("object", _("Object"))
      .AddParameter("behavior", _("Behavior"), "MinimapMarker")
      .AddParameter("stringWithSelector",
                    _("Marker type"),
                    "[\"Player\", \"Enemy\", \"Ally\", \"Item\", \"Objective\", "
                    "\"Waypoint\", \"Obstacle\", \"Neutral\", \"Custom\"]")
      .SetFunctionName("markerTypeIs")
      .SetIncludeFile("Extensions/Minimap/minimapmarkerbehavior.js");
}

/**
 * Used by GDevelop to create the extension class
 * -- Do not need to be modified. --
 */
extern "C" gd::PlatformExtension* GD_EXTENSION_API CreateGDExtension() {
  return new gd::PlatformExtension;
}

/**
 * Used by GDevelop to declare the extension
 */
extern "C" void GD_EXTENSION_API ExtensionDeclaration(
    gd::PlatformExtension& extension) {
  DeclareMinimapExtension(extension);
}
