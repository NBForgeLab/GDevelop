/**
GDevelop - Sticker3D Behavior Extension
Copyright (c) 2024 GDevelop Team
This project is released under the MIT License.
*/
#include "Sticker3DBehavior.h"

#include <map>

#include "GDCore/CommonTools.h"
#include "GDCore/Project/PropertyDescriptor.h"
#include "GDCore/Serialization/SerializerElement.h"
#include "GDCore/Tools/Localization.h"

/**
 * @brief Set default values for Sticker3D behavior content.
 *
 * Populates the given behavior content with the Sticker3D defaults:
 * - "followRotation" = true
 * - "destroyWithStuckToObject" = false
 *
 * @param content Serializer element representing the behavior's stored data to populate.
 */
void Sticker3DBehavior::InitializeContent(gd::SerializerElement& content) {
  content.SetAttribute("followRotation", true);
  content.SetAttribute("destroyWithStuckToObject", false);
}

/**
 * @brief Builds a map of editable property descriptors for the Sticker3D behavior from serialized content.
 *
 * @param behaviorContent Serialized behavior settings used to populate each property's current value.
 * @return std::map<gd::String, gd::PropertyDescriptor> Map where keys are property names (e.g., "followRotation",
 * "destroyWithStuckToObject") and values are PropertyDescriptor instances containing the property's current value,
 * type, label, and description.
 */
std::map<gd::String, gd::PropertyDescriptor> Sticker3DBehavior::GetProperties(
    const gd::SerializerElement& behaviorContent) const {
  std::map<gd::String, gd::PropertyDescriptor> properties;

  properties["followRotation"]
      .SetValue(behaviorContent.GetBoolAttribute("followRotation") ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Follow rotation"))
      .SetDescription(_("If enabled, the 3D object will also follow the rotation of the stuck-to 3D object."));

  properties["destroyWithStuckToObject"]
      .SetValue(behaviorContent.GetBoolAttribute("destroyWithStuckToObject") ? "true" : "false")
      .SetType("Boolean")
      .SetLabel(_("Destroy when the 3D object it's stuck on is destroyed"))
      .SetDescription(_("If enabled, this 3D object will be automatically destroyed when the stuck-to 3D object is destroyed."));

  return properties;
}

/**
 * @brief Updates a Sticker3D behavior property stored in the serialized content.
 *
 * Updates the serialized attribute corresponding to the given property name and sets it
 * to true when `value` equals `"1"`, false otherwise.
 *
 * @param behaviorContent Serializer element containing the behavior's stored attributes; it is modified on success.
 * @param name Name of the property to update. Recognized names: `"followRotation"`, `"destroyWithStuckToObject"`.
 * @param value New property value as a string; `"1"` is treated as true, any other value as false.
 * @return true if the property name was recognized and updated, false otherwise.
 */
bool Sticker3DBehavior::UpdateProperty(gd::SerializerElement& behaviorContent,
                                      const gd::String& name,
                                      const gd::String& value) {
  if (name == "followRotation") {
    behaviorContent.SetAttribute("followRotation", value == "1");
    return true;
  }
  if (name == "destroyWithStuckToObject") {
    behaviorContent.SetAttribute("destroyWithStuckToObject", value == "1");
    return true;
  }

  return false;
}