/**
 * GDevelop - Minimap Extension
 * Copyright (c) 2024 GDevelop Community
 * This project is released under the MIT License.
 */

#pragma once

#include "GDCore/Project/Behavior.h"
#include "GDCore/Project/Object.h"

namespace gd {
class SerializerElement;
class PropertyDescriptor;
class Project;
class Layout;
}  // namespace gd

/**
 * MinimapMarker Behavior - marks objects to be tracked on the minimap
 */
class GD_EXTENSION_API MinimapMarkerBehavior : public gd::Behavior {
 public:
  MinimapMarkerBehavior();
  virtual ~MinimapMarkerBehavior(){};
  
  virtual std::unique_ptr<gd::Behavior> Clone() const override {
    return gd::make_unique<MinimapMarkerBehavior>(*this);
  }

  virtual std::map<gd::String, gd::PropertyDescriptor> GetProperties(
      const gd::SerializerElement& behaviorContent) const override;
  virtual bool UpdateProperty(gd::SerializerElement& behaviorContent,
                              const gd::String& name,
                              const gd::String& value) override;
  
  virtual void InitializeContent(
      gd::SerializerElement& behaviorContent) override;
};
