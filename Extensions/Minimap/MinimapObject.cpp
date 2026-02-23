/**
 * GDevelop - Minimap Extension
 * Copyright (c) 2024 GDevelop Community
 * This project is released under the MIT License.
 */

#include "MinimapObject.h"
#include "GDCore/Project/PropertyDescriptor.h"
#include "GDCore/Serialization/SerializerElement.h"
#include "GDCore/Tools/Localization.h"

MinimapObject::MinimapObject()
    : size(200),
      zoom(0.1),
      stayOnScreen(true),
      backgroundImage(""),
      frameImage(""),
      backgroundColor("0;0;0"),
      backgroundOpacity(0.7),
      borderColor("255;255;255"),
      borderWidth(2),
      playerMarkerImage(""),
      playerColor("0;255;0"),
      playerSize(12),
      enemyMarkerImage(""),
      enemyColor("255;0;0"),
      enemySize(8),
      itemMarkerImage(""),
      itemColor("255;255;0"),
      itemSize(6),
      showObstacles(true),
      obstacleColor("128;128;128"),
      obstacleOpacity(0.5),
      useObjectShape(true),
      autoDetectBounds(true),
      updateRate(30) {}

std::map<gd::String, gd::PropertyDescriptor> MinimapObject::GetProperties()
    const {
  std::map<gd::String, gd::PropertyDescriptor> properties;

  // Basic Settings
  properties[_("size")]
      .SetValue(gd::String::From(size))
      .SetType("Number")
      .SetLabel(_("Size (square)"))
      .SetGroup(_("Basic Settings"));

  properties[_("zoom")]
      .SetValue(gd::String::From(zoom))
      .SetType("Number")
      .SetLabel(_("Zoom level"))
      .SetGroup(_("Basic Settings"));

  properties[_("stayOnScreen")]
      .SetValue(stayOnScreen ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Stay on screen (fixed position)"))
      .SetGroup(_("Basic Settings"));

  // Visual Customization
  properties[_("backgroundImage")]
      .SetValue(backgroundImage)
      .SetType("resource")
      .AddExtraInfo("image")
      .SetLabel(_("Background image"))
      .SetGroup(_("Visual Customization"));

  properties[_("frameImage")]
      .SetValue(frameImage)
      .SetType("resource")
      .AddExtraInfo("image")
      .SetLabel(_("Frame image"))
      .SetGroup(_("Visual Customization"));

  properties[_("backgroundColor")]
      .SetValue(backgroundColor)
      .SetType("color")
      .SetLabel(_("Background color"))
      .SetGroup(_("Visual Customization"));

  properties[_("backgroundOpacity")]
      .SetValue(gd::String::From(backgroundOpacity))
      .SetType("Number")
      .SetLabel(_("Background opacity (0-1)"))
      .SetGroup(_("Visual Customization"));

  properties[_("borderColor")]
      .SetValue(borderColor)
      .SetType("color")
      .SetLabel(_("Border color"))
      .SetGroup(_("Visual Customization"));

  properties[_("borderWidth")]
      .SetValue(gd::String::From(borderWidth))
      .SetType("Number")
      .SetLabel(_("Border width"))
      .SetGroup(_("Visual Customization"));

  // Marker customization is managed by MinimapMarker behavior (icon/size per object).

  // Obstacle Display
  properties[_("showObstacles")]
      .SetValue(showObstacles ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Show obstacles"))
      .SetGroup(_("Obstacle Display"));

  properties[_("obstacleOpacity")]
      .SetValue(gd::String::From(obstacleOpacity))
      .SetType("Number")
      .SetLabel(_("Obstacle opacity (0-1)"))
      .SetGroup(_("Obstacle Display"));

  properties[_("useObjectShape")]
      .SetValue(useObjectShape ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Use object shape for obstacles"))
      .SetGroup(_("Obstacle Display"));

  // Advanced
  properties[_("autoDetectBounds")]
      .SetValue(autoDetectBounds ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Auto-detect level bounds"))
      .SetGroup(_("Advanced"));

  properties[_("updateRate")]
      .SetValue(gd::String::From(updateRate))
      .SetType("Number")
      .SetLabel(_("Update rate (FPS)"))
      .SetGroup(_("Advanced"));

  return properties;
}

bool MinimapObject::UpdateProperty(const gd::String& name,
                                    const gd::String& value) {
  if (name == _("size")) {
    size = value.To<double>();
    return true;
  }
  if (name == _("zoom")) {
    zoom = value.To<double>();
    return true;
  }
  if (name == _("stayOnScreen")) {
    stayOnScreen = value == "1" || value == "true";
    return true;
  }
  if (name == _("backgroundImage")) {
    backgroundImage = value;
    return true;
  }
  if (name == _("frameImage")) {
    frameImage = value;
    return true;
  }
  if (name == _("backgroundColor")) {
    backgroundColor = value;
    return true;
  }
  if (name == _("backgroundOpacity")) {
    backgroundOpacity = value.To<double>();
    return true;
  }
  if (name == _("borderColor")) {
    borderColor = value;
    return true;
  }
  if (name == _("borderWidth")) {
    borderWidth = value.To<double>();
    return true;
  }
  if (name == _("playerMarkerImage")) {
    playerMarkerImage = value;
    return true;
  }
  if (name == _("playerColor")) {
    playerColor = value;
    return true;
  }
  if (name == _("playerSize")) {
    playerSize = value.To<double>();
    return true;
  }
  if (name == _("enemyMarkerImage")) {
    enemyMarkerImage = value;
    return true;
  }
  if (name == _("enemyColor")) {
    enemyColor = value;
    return true;
  }
  if (name == _("enemySize")) {
    enemySize = value.To<double>();
    return true;
  }
  if (name == _("itemMarkerImage")) {
    itemMarkerImage = value;
    return true;
  }
  if (name == _("itemColor")) {
    itemColor = value;
    return true;
  }
  if (name == _("itemSize")) {
    itemSize = value.To<double>();
    return true;
  }
  if (name == _("showObstacles")) {
    showObstacles = value == "1" || value == "true";
    return true;
  }
  if (name == _("obstacleColor")) {
    obstacleColor = value;
    return true;
  }
  if (name == _("obstacleOpacity")) {
    obstacleOpacity = value.To<double>();
    return true;
  }
  if (name == _("useObjectShape")) {
    useObjectShape = value == "1" || value == "true";
    return true;
  }
  if (name == _("autoDetectBounds")) {
    autoDetectBounds = value == "1" || value == "true";
    return true;
  }
  if (name == _("updateRate")) {
    updateRate = value.To<double>();
    return true;
  }

  return false;
}
