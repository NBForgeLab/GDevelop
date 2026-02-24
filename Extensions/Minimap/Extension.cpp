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
      "CppPlatform/Extensions/texticon.png")
      .SetCategory("User interface");

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
      .AddAction("SetVisible",
                 _("Show/hide minimap"),
                 _("Set the visibility of the minimap."),
                 _("Set visibility of _PARAM0_ to _PARAM1_"),
                 _("Minimap"),
                 "CppPlatform/Extensions/visibleicon.png",
                 "CppPlatform/Extensions/visibleicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("yesorno", _("Visible"))
      .SetFunctionName("setVisible")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      // (Removed legacy Hide action)

  // Removed toggle in favor of SetVisible

  // Zoom actions
  minimapObject
      .AddAction("ZoomIn",
                 _("Zoom in"),
                 _("Zoom in the minimap."),
                 _("Zoom in _PARAM0_"),
                 _("Minimap"),
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
                 _("Minimap"),
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
                 _("Minimap"),
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
                 _("Minimap"),
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
                 _("Minimap"),
                 "CppPlatform/Extensions/scalewidthicon.png",
                 "CppPlatform/Extensions/scalewidthicon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("expression", _("Size"))
      .SetFunctionName("setSize")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // Color actions
  minimapObject
      .AddAction("SetPlayerColor",
                 _("Set player color"),
                 _("Set the default color used for Player markers."),
                 _("Set player color of _PARAM0_ to _PARAM1_"),
                 _("Minimap"),
                 "CppPlatform/Extensions/texticon.png",
                 "CppPlatform/Extensions/texticon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("color", _("Color"))
      .SetFunctionName("setPlayerColor")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("SetEnemyColor",
                 _("Set enemy color"),
                 _("Set the default color used for Enemy markers."),
                 _("Set enemy color of _PARAM0_ to _PARAM1_"),
                 _("Minimap"),
                 "CppPlatform/Extensions/texticon.png",
                 "CppPlatform/Extensions/texticon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("color", _("Color"))
      .SetFunctionName("setEnemyColor")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("SetItemColor",
                 _("Set item color"),
                 _("Set the default color used for Item markers."),
                 _("Set item color of _PARAM0_ to _PARAM1_"),
                 _("Minimap"),
                 "CppPlatform/Extensions/texticon.png",
                 "CppPlatform/Extensions/texticon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("color", _("Color"))
      .SetFunctionName("setItemColor")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  minimapObject
      .AddAction("SetObstacleColor",
                 _("Set obstacle color"),
                 _("Set the default color used for obstacles on the minimap."),
                 _("Set obstacle color of _PARAM0_ to _PARAM1_"),
                 _("Minimap"),
                 "CppPlatform/Extensions/texticon.png",
                 "CppPlatform/Extensions/texticon.png")
      .AddParameter("object", _("Minimap"), "Minimap")
      .AddParameter("color", _("Color"))
      .SetFunctionName("setObstacleColor")
      .SetIncludeFile("Extensions/Minimap/minimapruntimeobject.js");

  // Conditions
  minimapObject
      .AddCondition("IsVisible",
                    _("Is visible"),
                    _("Check if the minimap is visible."),
                    _("_PARAM0_ is visible"),
                    _("Minimap"),
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
                 _("Minimap"),
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
                 _("Minimap"),
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
                 _("Minimap"),
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
                 _("Minimap"),
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
                    _("Minimap"),
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
                    _("Minimap"),
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
