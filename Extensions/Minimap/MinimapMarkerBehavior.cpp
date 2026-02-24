/**
 * GDevelop - Minimap Extension
 * Copyright (c) 2024 GDevelop Community
 * This project is released under the MIT License.
 */

#include "MinimapMarkerBehavior.h"
#include "GDCore/Project/PropertyDescriptor.h"
#include "GDCore/Serialization/SerializerElement.h"
#include "GDCore/Tools/Localization.h"

MinimapMarkerBehavior::MinimapMarkerBehavior() {}

void MinimapMarkerBehavior::InitializeContent(gd::SerializerElement& content) {
  content.SetAttribute("markerType", "Player");
  content.SetAttribute("customColor", "255;255;255");
  content.SetAttribute("customSize", 0.0);
  content.SetAttribute("customIcon", "");
  content.SetAttribute("showRotation", false);
  content.SetAttribute("visibleOnMinimap", true);
}

std::map<gd::String, gd::PropertyDescriptor>
MinimapMarkerBehavior::GetProperties(const gd::SerializerElement& behaviorContent) const {
  std::map<gd::String, gd::PropertyDescriptor> properties;

  properties[_("markerType")]
      .SetValue(behaviorContent.GetStringAttribute("markerType", "Player"))
      .SetType("Choice")
      .AddChoice("Player", _("Player"))
      .AddChoice("Enemy", _("Enemy"))
      .AddChoice("Ally", _("Ally"))
      .AddChoice("Item", _("Item"))
      .AddChoice("Obstacle", _("Obstacle"))
      .AddChoice("Custom", _("Custom"))
      .SetLabel(_("Marker type"))
      .SetGroup(_("Configuration"));

  properties[_("customColor")]
      .SetValue(behaviorContent.GetStringAttribute("customColor", "255;255;255"))
      .SetType("Color")
      .SetLabel(_("Custom color"))
      .SetGroup(_("Custom Appearance"));

  properties[_("customSize")]
      .SetValue(gd::String::From(behaviorContent.GetDoubleAttribute("customSize", 0.0)))
      .SetType("Number")
      .SetLabel(_("Custom size (0 = use default)"))
      .SetGroup(_("Custom Appearance"));

  properties[_("customIcon")]
      .SetValue(behaviorContent.GetStringAttribute("customIcon", ""))
      .SetType("Resource")
      .AddExtraInfo("image")
      .SetLabel(_("Custom icon"))
      .SetGroup(_("Custom Appearance"));

  properties[_("showRotation")]
      .SetValue(behaviorContent.GetBoolAttribute("showRotation", false) ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Show rotation"))
      .SetGroup(_("Display Options"));

  properties[_("visibleOnMinimap")]
      .SetValue(behaviorContent.GetBoolAttribute("visibleOnMinimap", true) ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Visible on minimap"))
      .SetGroup(_("Display Options"));

  return properties;
}

bool MinimapMarkerBehavior::UpdateProperty(gd::SerializerElement& behaviorContent,
                                           const gd::String& name,
                                           const gd::String& value) {
  if (name == _("markerType")) {
    behaviorContent.SetAttribute("markerType", value);
    return true;
  }
  if (name == _("customColor")) {
    behaviorContent.SetAttribute("customColor", value);
    return true;
  }
  if (name == _("customSize")) {
    behaviorContent.SetAttribute("customSize", value.To<double>());
    return true;
  }
  if (name == _("customIcon")) {
    behaviorContent.SetAttribute("customIcon", value);
    return true;
  }
  if (name == _("showRotation")) {
    behaviorContent.SetAttribute("showRotation", value == "1" || value == "true");
    return true;
  }
  if (name == _("visibleOnMinimap")) {
    behaviorContent.SetAttribute("visibleOnMinimap", value == "1" || value == "true");
    return true;
  }

  return false;
}
