//@ts-check
/// <reference path="../JsExtensionTypes.d.ts" />
/**
 * Extension for controlling bones in 3D models.
 */

/** @type {ExtensionModule} */
module.exports = {
  createExtension: function (_, gd) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        'BoneControl',
        _('Bone Control'),
        _('Control individual bones in 3D models for advanced animations and transformations.'),
        'GDevelop Community',
        'MIT'
      )
      .setCategory('General');
    
    extension
      .addInstructionOrExpressionGroupMetadata(_('Bone Control'))
      .setIcon('res/conditions/3d_box.svg');

    const boneControl = extension
      .addBehavior(
        'BoneControlBehavior',
        _('Bone Control'),
        'BoneControl',
        _('Control individual bones in a 3D model for advanced animations and transformations.'),
        '',
        'res/conditions/3d_box.svg',
        'BoneControlBehavior',
        new gd.Behavior(),
        new gd.BehaviorsSharedData()
      )
      .setIncludeFile('Extensions/BoneControl/bonecontrolbehavior.js');

    // Bone existence check
    boneControl
      .addCondition(
        'HasBone',
        _('Has bone'),
        _('Check if the model has a bone with the given name.'),
        _('_PARAM0_ has bone _PARAM2_'),
        _('Bones'),
        'res/conditions/3d_box.svg',
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('hasBone');

    // Bones count
    boneControl
      .addExpression(
        'BonesCount',
        _('Bones count'),
        _('Get the number of bones in the model'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .setFunctionName('getBonesCount');

    // Bone Position
    boneControl
      .addAction(
        'SetBonePosition',
        _('Set bone position'),
        _('Set the position of a bone.'),
        _('Set position of bone _PARAM2_ of _PARAM0_ to X: _PARAM3_, Y: _PARAM4_, Z: _PARAM5_'),
        _('Bones'),
        'res/conditions/3d_box.svg',
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .addParameter('number', _('X position'), '', false)
      .addParameter('number', _('Y position'), '', false)
      .addParameter('number', _('Z position'), '', false)
      .setFunctionName('setBonePosition');

    boneControl
      .addExpression(
        'BonePositionX',
        _('Bone X position'),
        _('Get the X position of a bone'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBonePositionX');

    boneControl
      .addExpression(
        'BonePositionY',
        _('Bone Y position'),
        _('Get the Y position of a bone'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBonePositionY');

    boneControl
      .addExpression(
        'BonePositionZ',
        _('Bone Z position'),
        _('Get the Z position of a bone'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBonePositionZ');

    // Bone Rotation
    boneControl
      .addAction(
        'SetBoneRotation',
        _('Set bone rotation'),
        _('Set the rotation of a bone in degrees.'),
        _('Set rotation of bone _PARAM2_ of _PARAM0_ to X: _PARAM3_°, Y: _PARAM4_°, Z: _PARAM5_°'),
        _('Bones'),
        'res/conditions/3d_box.svg',
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .addParameter('number', _('X rotation (degrees)'), '', false)
      .addParameter('number', _('Y rotation (degrees)'), '', false)
      .addParameter('number', _('Z rotation (degrees)'), '', false)
      .setFunctionName('setBoneRotation');

    boneControl
      .addExpression(
        'BoneRotationX',
        _('Bone X rotation'),
        _('Get the X rotation of a bone in degrees'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBoneRotationX');

    boneControl
      .addExpression(
        'BoneRotationY',
        _('Bone Y rotation'),
        _('Get the Y rotation of a bone in degrees'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBoneRotationY');

    boneControl
      .addExpression(
        'BoneRotationZ',
        _('Bone Z rotation'),
        _('Get the Z rotation of a bone in degrees'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBoneRotationZ');

    // Bone Scale
    boneControl
      .addAction(
        'SetBoneScale',
        _('Set bone scale'),
        _('Set the scale of a bone.'),
        _('Set scale of bone _PARAM2_ of _PARAM0_ to X: _PARAM3_, Y: _PARAM4_, Z: _PARAM5_'),
        _('Bones'),
        'res/conditions/3d_box.svg',
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .addParameter('number', _('X scale'), '', false)
      .addParameter('number', _('Y scale'), '', false)
      .addParameter('number', _('Z scale'), '', false)
      .setFunctionName('setBoneScale');

    boneControl
      .addExpression(
        'BoneScaleX',
        _('Bone X scale'),
        _('Get the X scale of a bone'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBoneScaleX');

    boneControl
      .addExpression(
        'BoneScaleY',
        _('Bone Y scale'),
        _('Get the Y scale of a bone'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBoneScaleY');

    boneControl
      .addExpression(
        'BoneScaleZ',
        _('Bone Z scale'),
        _('Get the Z scale of a bone'),
        _('Bones'),
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('getBoneScaleZ');

    // Reset bone
    boneControl
      .addAction(
        'ResetBone',
        _('Reset bone'),
        _('Reset a bone to its original transformation.'),
        _('Reset bone _PARAM2_ of _PARAM0_'),
        _('Bones'),
        'res/conditions/3d_box.svg',
        'res/conditions/3d_box.svg'
      )
      .addParameter('object', _('3D Model'), '', false)
      .addParameter('behavior', _('Behavior'), 'BoneControlBehavior')
      .addParameter('string', _('Bone name'), '', false)
      .setFunctionName('resetBone');

    return extension;
  },
  runExtensionSanityTests: function (gd, extension) {
    return [];
  },
};
