// @flow
import '@esotericsoftware/spine-pixi-v8';
import slugs from 'slugs';
import axios from 'axios';
import * as PIXI from 'pixi.js';
import * as PIXI_SPINE from '@esotericsoftware/spine-pixi-v8';
import { SkeletonData, TextureAtlas } from '@esotericsoftware/spine-pixi-v8';
import * as THREE from 'three';
// $FlowFixMe[cannot-resolve-module]
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader';
// $FlowFixMe[cannot-resolve-module]
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader';
import ResourcesLoader from '../ResourcesLoader';
import { loadFontFace } from '../Utils/FontFaceLoader';
import { checkIfCredentialsRequired } from '../Utils/CrossOrigin';
import { type ResourceKind } from '../ResourcesList/ResourceSource';
const gd: libGDevelop = global.gd;

type SpineTextureAtlasOrLoadingError = {|
  // $FlowFixMe[value-as-type]
  textureAtlas: ?TextureAtlas,
  loadingError: ?Error,
  loadingErrorReason:
    | null
    | 'invalid-atlas-resource'
    | 'missing-texture-resources'
    | 'atlas-resource-loading-error',
|};

export type SpineDataOrLoadingError = {|
  // $FlowFixMe[value-as-type]
  skeleton: ?SkeletonData,
  loadingError: ?Error,
  loadingErrorReason:
    | null
    | 'invalid-spine-resource'
    | 'missing-texture-atlas-name'
    | 'spine-resource-loading-error'
    // Atlas loading error reasons:
    | 'invalid-atlas-resource'
    | 'missing-texture-resources'
    | 'atlas-resource-loading-error',
|};

type ResourcePromise<T> = { [resourceName: string]: Promise<T> };

let loadedBitmapFonts = {};
let loadedFontFamilies = {};
let loadedTextures: { [string]: any } = {};
let loadedFromUrls: { [string]: string } = {};
const invalidTexture = PIXI.Texture.EMPTY;
const loadingTexture = PIXI.Texture.WHITE;
// $FlowFixMe[value-as-type]
let loadedOrLoadingThreeTextures: ResourcePromise<THREE.Texture> = {};
// $FlowFixMe[value-as-type]
let loadedOrLoadingThreeMaterials: ResourcePromise<THREE.Material> = {};
// $FlowFixMe[value-as-type]
let loadedOrLoading3DModelPromises: ResourcePromise<THREE.THREE_ADDONS.GLTF> = {};
let spineAtlasPromises: ResourcePromise<SpineTextureAtlasOrLoadingError> = {};
let spineDataPromises: ResourcePromise<SpineDataOrLoadingError> = {};

/** Promise to serialize reloads of resources, to avoid race conditions. */
let ongoingResourceReloads: Promise<void> | null = null;

/**
 * Ensure only one reload of a resource is being done at a time.
 * Avoid race conditions when multiple SceneEditors are open.
 */
let pendingResourceReloadPromises: {
  [resourceName: string]: Promise<void>,
} = {};

/**
 * Pending cleanup timers for the dedup entries above. We hold each entry for a
 * short window after a reload completes so that other editors which call
 * `reloadResource` shortly after still dedup against the resolved promise
 * instead of starting a fresh `_doReloadResource` that would re-destroy the
 * just-loaded texture (and crash any tab still rendering it).
 */
const pendingResourceReloadCleanupTimers: {
  [resourceName: string]: TimeoutID,
} = {};
const RESOURCE_RELOAD_DEDUP_COOLDOWN_MS = 500;

// $FlowFixMe[value-as-type]
const createInvalidModel = (): GLTF => {
  /**
   * The invalid model is a box with magenta (#ff00ff) faces, to be
   * easily spotted if rendered on screen.
   */
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#ff00ff' })
    )
  );
  return {
    scene: group,
    animations: [],
    cameras: [],
    scenes: [],
    asset: {},
    userData: {},
    parser: null,
  };
};
// $FlowFixMe[value-as-type]
const invalidModel: GLTF = createInvalidModel();

let gltfLoader = null;
const getOrCreateGltfLoader = () => {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./external/draco/gltf/');
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  return gltfLoader;
};

const load3DModel = (
  project: gdProject,
  resourceName: string
  // $FlowFixMe[value-as-type]
): Promise<THREE.THREE_ADDONS.GLTF> => {
  if (
    resourceName.length === 0 ||
    !project.getResourcesManager().hasResource(resourceName)
  )
    return Promise.resolve(invalidModel);

  const resource = project.getResourcesManager().getResource(resourceName);
  if (resource.getKind() !== 'model3D') return Promise.resolve(invalidModel);

  const url = ResourcesLoader.getResourceFullUrl(project, resourceName, {
    isResourceForPixi: true,
  });

  const gltfLoader = getOrCreateGltfLoader();
  gltfLoader.withCredentials = checkIfCredentialsRequired(url);
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      gltf => {
        traverseToRemoveMetalnessFromMeshes(gltf.scene);
        resolve(gltf);
      },
      undefined,
      error => {
        reject(error);
      }
    );
  });
};

const determineCrossOrigin = (url: string) => {
  // Any resource stored on the GDevelop Cloud buckets needs the "credentials" of the user,
  // i.e: its gdevelop.io cookie, to be passed.
  if (checkIfCredentialsRequired(url)) return 'use-credentials';

  // For other resources, use "anonymous" as done by default by PixiJS. Note that using `false`
  // to not having `crossorigin` at all would NOT work because the browser would taint the
  // loaded resource so that it can't be read/used in a canvas (it's only working for display `<img>` on screen).
  return 'anonymous';
};

const isTextureDestroyed = (texture: any): boolean =>
  !texture || texture.destroyed || !texture.source || texture.source.destroyed;

const createLoadingTexture = () =>
  new PIXI.Texture({ source: loadingTexture.source, dynamic: true });

const clonePixiRectangle = (rectangle: any): any =>
  rectangle && typeof rectangle.clone === 'function'
    ? rectangle.clone()
    : rectangle;

const copyTextureIntoCachedTexture = (cachedTexture: any, texture: any) => {
  // PixiJS v8 emits a texture "update" immediately from the public `source`
  // setter. Existing sprite renderers listen to this event to refresh their
  // geometry, so update the texture metadata first and emit exactly once after
  // the texture is coherent.
  if (cachedTexture.source && cachedTexture.source.off) {
    cachedTexture.source.off('resize', cachedTexture.update, cachedTexture);
  }

  // $FlowFixMe[prop-missing] PixiJS v8 stores the source internally.
  cachedTexture._source = texture.source;
  if (cachedTexture.source && cachedTexture.source.on) {
    cachedTexture.source.on('resize', cachedTexture.update, cachedTexture);
  }

  cachedTexture.noFrame = texture.noFrame;
  cachedTexture.frame.copyFrom(texture.frame);
  cachedTexture.orig =
    texture.orig === texture.frame
      ? cachedTexture.frame
      : clonePixiRectangle(texture.orig);
  cachedTexture.trim = clonePixiRectangle(texture.trim);
  cachedTexture.rotate = texture.rotate;
  cachedTexture.defaultAnchor = texture.defaultAnchor;
  cachedTexture.defaultBorders = texture.defaultBorders;
  cachedTexture.dynamic = true;
  cachedTexture.update();
};

const updateCachedTexture = (resourceName: string, loadedTexture: any) => {
  const cachedTexture = loadedTextures[resourceName];
  if (
    cachedTexture &&
    cachedTexture !== invalidTexture &&
    cachedTexture !== loadingTexture &&
    cachedTexture !== loadedTexture &&
    !isTextureDestroyed(cachedTexture)
  ) {
    copyTextureIntoCachedTexture(cachedTexture, loadedTexture);
    return cachedTexture;
  }

  return loadedTexture;
};

const getResourcePixiUrl = (
  project: gdProject,
  resourceName: string
): string | null => {
  const resourcesManager = project.getResourcesManager();
  if (!resourcesManager.hasResource(resourceName)) return null;

  return ResourcesLoader.getResourceFullUrl(project, resourceName, {
    isResourceForPixi: true,
  });
};

const applyPixiTextureSettings = (resource: gdResource, texture: any) => {
  if (resource.getKind() !== 'image') return;

  const imageResource = gd.asImageResource(resource);
  if (!imageResource.isSmooth()) {
    texture.source.scaleMode = 'nearest';
  }
};

const applyThreeTextureSettings = (
  resource: gdResource,
  // $FlowFixMe[value-as-type]
  threeTexture: THREE.Texture
) => {
  if (resource.getKind() !== 'image') return;

  const imageResource = gd.asImageResource(resource);
  if (!imageResource.isSmooth()) {
    threeTexture.magFilter = THREE.NearestFilter;
    threeTexture.minFilter = THREE.NearestFilter;
  }
};

// If modifying this function, make sure to update Resource3DPreview.worker.js copy.
// $FlowFixMe[value-as-type]
const removeMetalness = (material: THREE.Material): void => {
  if (material.metalness) {
    material.metalness = 0;
  }
};

// If modifying this function, make sure to update Resource3DPreview.worker.js copy.
// $FlowFixMe[value-as-type]
const removeMetalnessFromMesh = (node: THREE.Object3D): void => {
  // $FlowFixMe[value-as-type]
  const mesh = (node: THREE.Mesh);
  if (!mesh.material) {
    return;
  }
  if (Array.isArray(mesh.material)) {
    for (let index = 0; index < mesh.material.length; index++) {
      removeMetalness(mesh.material[index]);
    }
  } else {
    removeMetalness(mesh.material);
  }
};

// $FlowFixMe[value-as-type]
const traverseToRemoveMetalnessFromMeshes = (node: THREE.Object3D) =>
  node.traverse(removeMetalnessFromMesh);

export const readEmbeddedResourcesMapping = (
  resource: gdResource
): {} | null => {
  const metadataString = resource.getMetadata();
  try {
    const metadata = JSON.parse(metadataString);
    if (
      !metadata.embeddedResourcesMapping ||
      typeof metadata.embeddedResourcesMapping !== 'object'
    ) {
      return null;
    }

    return metadata.embeddedResourcesMapping;
  } catch (err) {
    return null;
  }
};

const getEmbedderResources = (
  project: gdProject,
  embeddedResourceName: string,
  embedderResourceKind: ResourceKind
): Array<gdResource> => {
  const resourcesManager = project.getResourcesManager();
  const embedderResources: Array<gdResource> = [];

  for (const resourceName of resourcesManager
    .getAllResourceNames()
    .toJSArray()) {
    if (embeddedResourceName === resourceName) {
      continue;
    }

    const possibleEmbedderResource = resourcesManager.getResource(resourceName);
    if (possibleEmbedderResource.getKind() !== embedderResourceKind) {
      continue;
    }

    const embeddedResourcesMapping = readEmbeddedResourcesMapping(
      possibleEmbedderResource
    );
    if (!embeddedResourcesMapping) {
      continue;
    }

    const mappedResources = Object.values(embeddedResourcesMapping);
    if (mappedResources.includes(embeddedResourceName)) {
      embedderResources.push(possibleEmbedderResource);
    }
  }

  return embedderResources;
};

/**
 * Expose functions to load PIXI textures or fonts, given the names of
 * resources and a gd.Project.
 *
 * This internally uses ResourcesLoader to get the URL of the resources.
 */
export default class PixiResourcesLoader {
  static burstCache() {
    loadedBitmapFonts = {};
    loadedFontFamilies = {};
    loadedTextures = {};
    loadedFromUrls = {};
    loadedOrLoadingThreeTextures = {};
    loadedOrLoadingThreeMaterials = {};
    loadedOrLoading3DModelPromises = {};
    spineAtlasPromises = {};
    spineDataPromises = {};
    ongoingResourceReloads = null;
    pendingResourceReloadPromises = {};
  }

  static async _reloadEmbedderResources(
    project: gdProject,
    embeddedResourceName: string,
    embedderResourceKind: ResourceKind
  ) {
    const embeddedResources = getEmbedderResources(
      project,
      embeddedResourceName,
      embedderResourceKind
    );

    if (embeddedResources.length === 0) {
      return;
    }

    console.log(
      `Reloading resources embedding ${embeddedResourceName}: ${embeddedResources
        .map(embeddedResource => embeddedResource.getName())
        .join(', ')}`
    );
    await Promise.all(
      embeddedResources.map(async embeddedResource => {
        const result = await this._doReloadResource(
          project,
          embeddedResource.getName()
        );
        return result;
      })
    );
    console.log(
      `Finished reloading resources embedding ${embeddedResourceName}.`
    );
  }

  static async _doReloadResource(project: gdProject, resourceName: string) {
    const loadedTexture = loadedTextures[resourceName];
    const loadedFromUrl = loadedFromUrls[resourceName];

    // Optimization: if this is an image resource whose resolved URL did not
    // change since it was loaded, its content is identical and there's no need
    // to unload and re-fetch it (which is expensive and visually disruptive).
    // This makes reloading "every resource of an edited object" cheap when only
    // a few of them actually changed: editing one animation no longer re-fetches
    // every other animation's frames.
    //
    // It's only safe to skip when we are *certain* the content is unchanged:
    // - cloud projects: any change yields a new immutable URL;
    // - local files: the URL carries a cache-busting token that only changes
    //   when `burstUrlsCacheForResources`/`burstAllUrlsCache` was called (which
    //   every "resource content changed" code path does).
    // In any other case (texture not loaded yet, invalid/loading texture, no
    // recorded URL, or a non-image resource), we fall back to a full reload.
    const resourcesManager = project.getResourcesManager();
    if (
      loadedTexture &&
      loadedFromUrl !== undefined &&
      loadedTexture !== invalidTexture &&
      loadedTexture !== loadingTexture &&
      !isTextureDestroyed(loadedTexture) &&
      resourcesManager.hasResource(resourceName) &&
      resourcesManager.getResource(resourceName).getKind() === 'image'
    ) {
      const currentUrl = ResourcesLoader.getResourceFullUrl(
        project,
        resourceName,
        { isResourceForPixi: true }
      );
      if (currentUrl === loadedFromUrl) {
        console.info(
          `Resource "${resourceName}" file/URL is unchanged: keeping the already loaded texture (no reload needed).`
        );
        return;
      }
    }

    if (loadedTexture) {
      // Remove the cached texture BEFORE awaiting the unload.
      // PIXI.Assets.unload destroys the texture source synchronously. If
      // getPIXITexture is called before the cache entry is removed, it would
      // return the destroyed texture.
      // $FlowFixMe[prop-missing]
      delete loadedTextures[resourceName];
      delete loadedFromUrls[resourceName];

      // Check if another resource still references the same texture source
      // (happens when multiple resources point to the same file/URL).
      // If so, skip PIXI.Assets.unload to avoid destroying the shared source.
      const loadedTextureSource = loadedTexture.source;
      const otherResourcesWithSameLoadedTexture = Object.keys(
        loadedTextures
      ).filter(
        otherName =>
          loadedTextures[otherName] &&
          loadedTextures[otherName].source === loadedTextureSource
      );

      if (otherResourcesWithSameLoadedTexture.length > 0) {
        console.info(
          `Texture for resource "${resourceName}", which being reloaded, is still referenced by other resources: ${otherResourcesWithSameLoadedTexture.join(
            ', '
          )}. Skipping unload for it.`
        );
      } else {
        // Texture should be unloaded.
        if (
          loadedTexture !== invalidTexture &&
          loadedTexture !== loadingTexture &&
          !isTextureDestroyed(loadedTexture)
        ) {
          console.info(
            `Unloading texture cache for resource "${resourceName}".`
          );
          const url = getResourcePixiUrl(project, resourceName);
          if (url) {
            await PIXI.Assets.unload(url).catch(() => {
              loadedTexture.destroy(true);
            });
          } else {
            loadedTexture.destroy(true);
          }
        } else {
          console.info(
            `Texture for resource "${resourceName}" was invalid or already destroyed (so nothing to unload).`
          );
        }
      }

      // Also reload any resource embedding this resource:
      await this._reloadEmbedderResources(project, resourceName, 'atlas');
    }

    await PixiResourcesLoader.loadTextures(project, [resourceName]);

    if (loadedOrLoading3DModelPromises[resourceName]) {
      delete loadedOrLoading3DModelPromises[resourceName];
    }
    // $FlowFixMe[invalid-computed-prop]
    if (loadedFontFamilies[resourceName]) {
      // $FlowFixMe[prop-missing]
      delete loadedFontFamilies[resourceName];
    }
    // $FlowFixMe[invalid-computed-prop]
    if (loadedBitmapFonts[resourceName]) {
      // $FlowFixMe[prop-missing]
      delete loadedBitmapFonts[resourceName];
    }
    if (loadedOrLoadingThreeTextures[resourceName]) {
      const threeTexture = await loadedOrLoadingThreeTextures[resourceName];
      threeTexture.dispose();
      delete loadedOrLoadingThreeTextures[resourceName];
    }
    if (spineAtlasPromises[resourceName]) {
      // TODO: only unload if no other resources pointing to the same Spine Atlas?

      await PIXI.Assets.unload(resourceName).catch(async () => {
        const { textureAtlas } = await spineAtlasPromises[resourceName];
        if (textureAtlas) {
          textureAtlas.dispose();
        }
      });
      delete spineAtlasPromises[resourceName];

      // Also reload any resource embedding this resource:
      await this._reloadEmbedderResources(project, resourceName, 'spine');
    }
    if (spineDataPromises[resourceName]) {
      // TODO: only unload if no other resources pointing to the same Spine Data?

      await PIXI.Assets.unload(resourceName);
      delete spineDataPromises[resourceName];

      // This line allows us to avoid issue https://github.com/pixijs/pixijs/issues/10069.
      // PIXI.Assets.resolver caches data that was passed to `PIXI.Assets.add`, even if resource was unloaded.
      // So every time we unload spine resources, we need to call it to clean the resolver cache
      // and pick up fresh data next time we call `getSpineData`.
      PIXI.Assets.resolver.prefer();
    }

    const matchingMaterialCacheKeys = Object.keys(
      loadedOrLoadingThreeMaterials
    ).filter(key => key.startsWith(resourceName));
    if (matchingMaterialCacheKeys.length > 0) {
      await Promise.all(
        matchingMaterialCacheKeys.map(async key => {
          const material = await loadedOrLoadingThreeMaterials[key];
          material.dispose();
          delete loadedOrLoadingThreeMaterials[key];
        })
      );
    }
  }

  static async reloadResource(project: gdProject, resourceName: string) {
    // If a reload for this specific resource is already pending (still
    // running, or recently completed within the cooldown window), wait for
    // it instead of queuing a duplicate. This prevents a race condition when
    // multiple SceneEditors are open: both get notified of a resource change
    // and both call reloadResource. Without deduplication, the second reload
    // would unload the texture that was just freshly loaded by the first,
    // destroying textures that active renderers are already using.
    if (pendingResourceReloadPromises[resourceName]) {
      await pendingResourceReloadPromises[resourceName];
      return;
    }

    const currentReload = (ongoingResourceReloads || Promise.resolve()).then(
      () => {
        console.log(`Starting reload of resource "${resourceName}".`);
        return this._doReloadResource(project, resourceName);
      }
    );
    ongoingResourceReloads = currentReload;
    pendingResourceReloadPromises[resourceName] = currentReload;
    try {
      await currentReload;
    } finally {
      console.log(`Finished reload of resource "${resourceName}".`);
      // Keep the dedup entry alive for a short cooldown so other editors
      // calling reloadResource right after completion still dedup against
      // the resolved promise. The timer is cancelled if a fresh reload is
      // requested in the meantime.
      if (pendingResourceReloadCleanupTimers[resourceName]) {
        clearTimeout(pendingResourceReloadCleanupTimers[resourceName]);
      }
      pendingResourceReloadCleanupTimers[resourceName] = setTimeout(() => {
        if (pendingResourceReloadPromises[resourceName] === currentReload) {
          delete pendingResourceReloadPromises[resourceName];
        }
        delete pendingResourceReloadCleanupTimers[resourceName];
      }, RESOURCE_RELOAD_DEDUP_COOLDOWN_MS);
      if (ongoingResourceReloads === currentReload) {
        ongoingResourceReloads = null;
        console.log(`No more reload are queued.`);
      }
    }
  }
  /**
   * (Re)load the PIXI texture represented by the given resources.
   */
  static async loadTextures(
    project: gdProject,
    resourceNames: Array<string>
  ): Promise<void> {
    const resourcesManager = project.getResourcesManager();

    const imageResources = resourceNames
      .map(resourceName => {
        if (!resourcesManager.hasResource(resourceName)) {
          return null;
        }
        const resource = resourcesManager.getResource(resourceName);
        if (resource.getKind() !== 'image') {
          return null;
        }
        return resource;
      })
      .filter(Boolean);
    const videoResources = resourceNames
      .map(resourceName => {
        if (!resourcesManager.hasResource(resourceName)) {
          return null;
        }
        const resource = resourcesManager.getResource(resourceName);
        if (resource.getKind() !== 'video') {
          return null;
        }
        return resource;
      })
      .filter(Boolean);

    const allResources = [...imageResources, ...videoResources];
    if (allResources.length === 0) {
      return;
    }

    console.log(
      `Loading textures for resources ${allResources
        .map(resource => resource.getName())
        .join(', ')}...`
    );

    await Promise.all([
      ...imageResources.map(async resource => {
        const resourceName = resource.getName();
        try {
          const url = ResourcesLoader.getResourceFullUrl(
            project,
            resourceName,
            {
              isResourceForPixi: true,
            }
          );
          PIXI.Assets.setPreferences({
            preferWorkers: false,
            preferCreateImageBitmap: false,
            crossOrigin: determineCrossOrigin(url),
          });
          const loadedTexture = await PIXI.Assets.load(url);
          if (!loadedTexture) {
            throw new Error(
              `Texture loading for "${url}" returned null/undefined.`
            );
          }

          loadedFromUrls[resourceName] = url;
          // TODO What if 2 assets share the same file with different settings?
          applyPixiTextureSettings(resource, loadedTexture);
          loadedTextures[resourceName] = updateCachedTexture(
            resourceName,
            loadedTexture
          );
        } catch (error) {
          loadedTextures[resourceName] = updateCachedTexture(
            resourceName,
            invalidTexture
          );
          delete loadedFromUrls[resourceName];
          console.error(
            `Unable to load file ${resource.getFile()} for image resource ${resourceName}:`,
            error ? error : '(unknown error)'
          );
        }
      }),
      ...videoResources.map(async resource => {
        const resourceName = resource.getName();
        try {
          const url = ResourcesLoader.getResourceFullUrl(
            project,
            resourceName,
            {
              isResourceForPixi: true,
            }
          );

          const videoElement = document.createElement('video');
          videoElement.crossOrigin = determineCrossOrigin(url);
          videoElement.preload = 'auto';
          // $FlowFixMe[prop-missing]
          videoElement.playsInline = true;
          videoElement.src = url;

          const loadedTexture = PIXI.Texture.from({
            resource: videoElement,
            scaleMode: 'linear',
            autoPlay: false,
            autoLoad: true,
            crossorigin: determineCrossOrigin(url),
          });
          if (!loadedTexture) {
            console.error(`Texture loading for ${url} returned nothing`);
            loadedTextures[resourceName] = updateCachedTexture(
              resourceName,
              invalidTexture
            );
            return;
          }

          loadedTextures[resourceName] = updateCachedTexture(
            resourceName,
            loadedTexture
          );
          loadedTextures[resourceName].source.load().catch(error => {
            console.error(
              `Unable to load video texture from url ${url}:`,
              error
            );
            loadedTextures[resourceName] = updateCachedTexture(
              resourceName,
              invalidTexture
            );
          });
        } catch (error) {
          console.error(
            `Unable to load file ${resource.getFile()} for video resource ${resourceName}:`,
            error ? error : '(unknown error)'
          );
        }
      }),
    ]);
  }

  static getPIXITexture(project: gdProject, resourceName: string): any {
    // $FlowFixMe[invalid-computed-prop]
    if (loadedTextures[resourceName]) {
      // Extra safety: If the texture source was destroyed somehow,
      // evict it from the cache and recreate it below.
      if (isTextureDestroyed(loadedTextures[resourceName])) {
        console.warn(
          `Texture for resource "${resourceName}" was requested but destroyed. Evicting it from the cache and recreating it.`
        );
        delete loadedTextures[resourceName];
        delete loadedFromUrls[resourceName];

        // Then we let the new texture be loaded below.
      } else {
        return loadedTextures[resourceName];
      }
    }

    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    )
      return invalidTexture;

    const resource = project.getResourcesManager().getResource(resourceName);
    if (resource.getKind() !== 'image') return invalidTexture;

    loadedTextures[resourceName] = createLoadingTexture();
    PixiResourcesLoader.loadTextures(project, [resourceName]).catch(error => {
      console.error(
        `Unable to load texture for resource "${resourceName}":`,
        error
      );
      loadedTextures[resourceName] = updateCachedTexture(
        resourceName,
        invalidTexture
      );
    });

    return loadedTextures[resourceName];
  }

  /**
   * Return the three.js texture associated to the specified resource name.
   * Returns a placeholder texture if not found.
   * @param project The project
   * @param resourceName The name of the resource
   * @returns The requested texture, or a placeholder if not found.
   */
  static async getThreeTexture(
    project: gdProject,
    resourceName: string
    // $FlowFixMe[value-as-type]
  ): Promise<THREE.Texture> {
    const loadedOrLoadingPromise = loadedOrLoadingThreeTextures[resourceName];
    // $FlowFixMe[constant-condition]
    if (loadedOrLoadingPromise) return loadedOrLoadingPromise;

    // Texture is not loaded, load it now from the PixiJS texture.
    // TODO (3D) - optimization: don't load the PixiJS Texture if not used by PixiJS.
    // TODO (3D) - optimization: Ideally we could even share the same WebGL texture.
    const pixiTexture = PixiResourcesLoader.getPIXITexture(
      project,
      resourceName
    );

    if (pixiTexture.source === invalidTexture.source) {
      throw new Error(
        `Can't load texture for resource "${resourceName}" as it could not be loaded by PixiJS.`
      );
    }

    const image = pixiTexture.source && pixiTexture.source.resource;
    if (!(image instanceof HTMLImageElement)) {
      // Post pone texture update if texture is not loaded.
      return new Promise(resolve => {
        pixiTexture.once('update', () =>
          resolve(this.getThreeTexture(project, resourceName))
        );
      });
    }

    const threeTexture = new THREE.Texture(image);
    threeTexture.magFilter = THREE.LinearFilter;
    threeTexture.minFilter = THREE.LinearFilter;
    threeTexture.wrapS = THREE.RepeatWrapping;
    threeTexture.wrapT = THREE.RepeatWrapping;
    threeTexture.colorSpace = THREE.SRGBColorSpace;
    threeTexture.needsUpdate = true;

    const resource = project.getResourcesManager().getResource(resourceName);
    applyThreeTextureSettings(resource, threeTexture);

    return (loadedOrLoadingThreeTextures[resourceName] = Promise.resolve(
      threeTexture
    ));
  }

  /**
   * Return the three.js material associated to the specified resource name.
   * @param project The project
   * @param resourceName The name of the resource
   * @param options Set if the material should be transparent or not.
   * @returns The requested material.
   */
  static async getThreeMaterial(
    project: gdProject,
    resourceName: string,
    {
      useTransparentTexture,
    }: {|
      useTransparentTexture: boolean,
    |}
  ): // $FlowFixMe[value-as-type]
  Promise<THREE.Material> {
    const cacheKey = `${resourceName}|transparent:${useTransparentTexture.toString()}`;
    const loadedOrLoadingPromise = loadedOrLoadingThreeMaterials[cacheKey];
    // $FlowFixMe[constant-condition]
    if (loadedOrLoadingPromise) return loadedOrLoadingPromise;

    return (loadedOrLoadingThreeMaterials[cacheKey] = this.getThreeTexture(
      project,
      resourceName
    ).then(texture => {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: useTransparentTexture ? THREE.DoubleSide : THREE.FrontSide,
        transparent: useTransparentTexture,
        vertexColors: true,
      });

      return material;
    }));
  }

  /**
   * Return the three.js material associated to the specified resource name.
   * @param project The project
   * @param resourceName The name of the resource
   * @param options
   * @returns The requested material.
   */
  static get3DModel(
    project: gdProject,
    resourceName: string
    // $FlowFixMe[value-as-type]
  ): Promise<THREE.THREE_ADDONS.GLTF> {
    const promise = loadedOrLoading3DModelPromises[resourceName];
    // $FlowFixMe[constant-condition]
    if (promise) return promise;

    const loadingPromise = load3DModel(project, resourceName);
    loadedOrLoading3DModelPromises[resourceName] = loadingPromise;
    return loadingPromise;
  }

  /**
   * Return the Pixi spine texture atlas of the specified resource names.
   * @param project The project
   * @param spineTextureAtlasName The name of the atlas texture resource.
   * @returns The requested texture atlas, or null if it could not be loaded.
   */
  static async _getSpineTextureAtlas(
    project: gdProject,
    spineTextureAtlasName: string
  ): Promise<SpineTextureAtlasOrLoadingError> {
    const promise = spineAtlasPromises[spineTextureAtlasName];
    // $FlowFixMe[constant-condition]
    if (promise) return promise;

    if (!spineTextureAtlasName) {
      return {
        textureAtlas: null,
        loadingError: null,
        loadingErrorReason: 'invalid-atlas-resource',
      };
    }

    const resourceManager = project.getResourcesManager();
    if (
      spineTextureAtlasName.length === 0 ||
      !resourceManager.hasResource(spineTextureAtlasName)
    ) {
      return {
        textureAtlas: null,
        loadingError: null,
        loadingErrorReason: 'invalid-atlas-resource',
      };
    }

    const resource = resourceManager.getResource(spineTextureAtlasName);
    if (resource.getKind() !== 'atlas') {
      return {
        textureAtlas: null,
        loadingError: null,
        loadingErrorReason: 'invalid-atlas-resource',
      };
    }

    const embeddedResourcesMapping = readEmbeddedResourcesMapping(resource);
    const textureAtlasMappingEntries = embeddedResourcesMapping
      ? Object.entries(embeddedResourcesMapping)
      : [];
    if (!textureAtlasMappingEntries.length) {
      return {
        textureAtlas: null,
        loadingError: null,
        loadingErrorReason: 'missing-texture-resources',
      };
    }

    const loadingPromise: Promise<SpineTextureAtlasOrLoadingError> = (async () => {
      const textureResourceNames = [];
      textureAtlasMappingEntries.forEach(([, resourceName]) => {
        if (typeof resourceName === 'string') {
          textureResourceNames.push(resourceName);
        }
      });

      await this.loadTextures(project, textureResourceNames);

      const images = textureAtlasMappingEntries.reduce(
        (imagesMapping, [relatedPath, resourceName]) => {
          // flow check
          if (typeof resourceName === 'string') {
            const loadedTexture =
              loadedTextures[resourceName] ||
              this.getPIXITexture(project, resourceName);
            if (!isTextureDestroyed(loadedTexture)) {
              imagesMapping[relatedPath] = loadedTexture.source;
            }
          }

          return imagesMapping;
        },
        {}
      );

      const atlasUrl = ResourcesLoader.getResourceFullUrl(
        project,
        spineTextureAtlasName,
        {
          isResourceForPixi: true,
        }
      );
      PIXI.Assets.setPreferences({
        preferWorkers: false,
        crossOrigin: checkIfCredentialsRequired(atlasUrl)
          ? 'use-credentials'
          : 'anonymous',
      });
      PIXI.Assets.add({
        alias: spineTextureAtlasName,
        src: atlasUrl,
        data: { images },
      });
      try {
        const atlas = await PIXI.Assets.load(spineTextureAtlasName);
        return {
          textureAtlas: atlas,
          loadingError: null,
          loadingErrorReason: null,
        };
      } catch (err) {
        console.error(
          `Error while loading Spine atlas "${spineTextureAtlasName}": ${err}.\nCheck if you selected the correct pair of atlas and image files.`
        );
        return {
          textureAtlas: null,
          loadingError: err,
          loadingErrorReason: 'atlas-resource-loading-error',
        };
      }
    })();

    return (spineAtlasPromises[spineTextureAtlasName] = loadingPromise);
  }

  /**
   * Return the Pixi spine data for the specified resource name.
   * @param project The project
   * @param spineName The name of the spine json resource
   * @returns The requested spine skeleton.
   */
  static async getSpineData(
    project: gdProject,
    spineName: string
  ): Promise<SpineDataOrLoadingError> {
    const promise = spineDataPromises[spineName];
    // $FlowFixMe[constant-condition]
    if (promise) return promise;

    const resourceManager = project.getResourcesManager();
    if (!spineName || !resourceManager.hasResource(spineName)) {
      return {
        skeleton: null,
        loadingError: null,
        loadingErrorReason: 'invalid-spine-resource',
      };
    }

    const resource = resourceManager.getResource(spineName);
    if (resource.getKind() !== 'spine') {
      return {
        skeleton: null,
        loadingError: null,
        loadingErrorReason: 'invalid-spine-resource',
      };
    }

    const embeddedResourcesMapping = readEmbeddedResourcesMapping(resource);
    const spineTextureAtlasName = embeddedResourcesMapping
      ? Object.values(embeddedResourcesMapping)[0]
      : null;
    if (typeof spineTextureAtlasName !== 'string') {
      return {
        skeleton: null,
        loadingError: null,
        loadingErrorReason: 'missing-texture-atlas-name',
      };
    }

    const loadingPromise: Promise<SpineDataOrLoadingError> = (async () => {
      const textureAtlasOrLoadingError = await this._getSpineTextureAtlas(
        project,
        spineTextureAtlasName
      );
      if (!textureAtlasOrLoadingError.textureAtlas) {
        return {
          skeleton: null,
          loadingError: textureAtlasOrLoadingError.loadingError,
          loadingErrorReason: textureAtlasOrLoadingError.loadingErrorReason,
        };
      }

      const spineUrl = ResourcesLoader.getResourceFullUrl(project, spineName, {
        isResourceForPixi: true,
      });
      PIXI.Assets.setPreferences({
        preferWorkers: false,
        crossOrigin: checkIfCredentialsRequired(spineUrl)
          ? 'use-credentials'
          : 'anonymous',
      });
      PIXI.Assets.add({
        alias: spineName,
        src: spineUrl,
      });

      try {
        await PIXI.Assets.load(spineName);
        const spine = PIXI_SPINE.Spine.from({
          skeleton: spineName,
          atlas: spineTextureAtlasName,
        });
        const skeleton = spine.skeleton.data;
        spine.destroy();
        return {
          skeleton,
          loadingError: null,
          loadingErrorReason: null,
        };
      } catch (err) {
        console.error(
          `Error while loading Spine data "${spineName}": ${err}.\nCheck if you selected correct files.`
        );
        return {
          skeleton: null,
          loadingError: err,
          loadingErrorReason: 'spine-resource-loading-error',
        };
      }
    })();

    return (spineDataPromises[spineName] = loadingPromise);
  }

  static getPIXIVideoTexture(project: gdProject, resourceName: string): any {
    if (loadedTextures[resourceName]) {
      // Extra safety: If the texture source was destroyed somehow,
      // evict it from the cache and recreate it below.
      if (isTextureDestroyed(loadedTextures[resourceName])) {
        console.warn(
          `Texture for resource "${resourceName}" was requested but destroyed. Evicting it from the cache and recreating it.`
        );
        delete loadedTextures[resourceName];
        delete loadedFromUrls[resourceName];

        // Then we let the new texture be loaded below.
      } else {
        return loadedTextures[resourceName];
      }
    }

    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    )
      return invalidTexture;

    const resource = project.getResourcesManager().getResource(resourceName);
    if (resource.getKind() !== 'video') return invalidTexture;

    loadedTextures[resourceName] = createLoadingTexture();
    PixiResourcesLoader.loadTextures(project, [resourceName]).catch(error => {
      console.error(
        `Unable to load video texture for resource "${resourceName}":`,
        error
      );
      loadedTextures[resourceName] = updateCachedTexture(
        resourceName,
        invalidTexture
      );
    });

    return loadedTextures[resourceName];
  }

  /**
   * Load the given font from its url/filename.
   * @returns a Promise that resolves with the font-family to be used
   * to render a text with the font.
   */
  static loadFontFamily(
    project: gdProject,
    resourceName: string
  ): Promise<string> {
    // Avoid reloading a font if it's already cached
    // $FlowFixMe[invalid-computed-prop]
    if (loadedFontFamilies[resourceName]) {
      return Promise.resolve(loadedFontFamilies[resourceName]);
    }

    const fontFamily = slugs(resourceName);
    let fullFilename = null;
    if (
      resourceName.length > 0 &&
      project.getResourcesManager().hasResource(resourceName)
    ) {
      const resource = project.getResourcesManager().getResource(resourceName);
      if (resource.getKind() === 'font') {
        fullFilename = ResourcesLoader.getResourceFullUrl(
          project,
          resourceName,
          {
            isResourceForPixi: true,
          }
        );
      }
    } else {
      // Compatibility with GD <= 5.0-beta56
      // Assume resourceName is just the filename to the font
      fullFilename = ResourcesLoader.getFullUrl(project, resourceName, {
        isResourceForPixi: true,
      });
      // end of compatibility code
    }

    if (!fullFilename) {
      // If no resource is found/resource is not a font, default to Arial,
      // as done by the game engine too.
      return Promise.resolve('Arial');
    }

    return loadFontFace(fontFamily, fullFilename).then(loadedFace => {
      // $FlowFixMe[prop-missing]
      loadedFontFamilies[resourceName] = fontFamily;

      return fontFamily;
    });
  }

  /**
   * Get the font family name for the given font resource.
   * The font won't be loaded.
   * @returns The font-family to be used to render a text with the font.
   */
  static getFontFamily(project: gdProject, resourceName: string): any {
    // $FlowFixMe[invalid-computed-prop]
    if (loadedFontFamilies[resourceName]) {
      return loadedFontFamilies[resourceName];
    }

    const fontFamily = slugs(resourceName);
    return fontFamily;
  }

  /**
   * Get the data from a bitmap font file (fnt/xml) resource in the IDE.
   */
  static getBitmapFontData(
    project: gdProject,
    resourceName: string
  ): Promise<any> {
    // $FlowFixMe[invalid-computed-prop]
    if (loadedBitmapFonts[resourceName]) {
      return Promise.resolve(loadedBitmapFonts[resourceName].data);
    }

    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    )
      return Promise.reject(
        new Error(`Can't find resource called ${resourceName}.`)
      );

    const resource = project.getResourcesManager().getResource(resourceName);
    // $FlowFixMe[invalid-compare]
    if (resource.getKind() !== 'bitmapFont')
      return Promise.reject(
        new Error(
          `The resource called ${resourceName} is not a bitmap font file. Require .fnt or .xml format.`
        )
      );

    const fullUrl = ResourcesLoader.getResourceFullUrl(project, resourceName, {
      isResourceForPixi: true,
    });
    if (!fullUrl) {
      return Promise.reject(
        new Error(
          `The resource called ${resourceName} was no found.\nThe default bitmap font will be used.`
        )
      );
    }

    return (
      axios
        // $FlowFixMe[underconstrained-implicit-instantiation]
        .get(fullUrl, {
          withCredentials: checkIfCredentialsRequired(fullUrl),
        })
        .then(response => {
          // $FlowFixMe[prop-missing]
          loadedBitmapFonts[resourceName] = response;
          return response.data;
        })
    );
  }

  static getInvalidPIXITexture(): any {
    return invalidTexture;
  }

  static getLoadingPIXITexture(): any {
    return loadingTexture;
  }

  /**
   * Get the data from a json resource in the IDE.
   */
  static getResourceJsonData(
    project: gdProject,
    resourceName: string
  ): Promise<any> {
    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    )
      return Promise.reject(
        new Error(`Can't find resource called ${resourceName}.`)
      );

    const resource = project.getResourcesManager().getResource(resourceName);
    if (
      resource.getKind() !== 'json' &&
      resource.getKind() !== 'tilemap' &&
      resource.getKind() !== 'tileset'
    )
      return Promise.reject(
        new Error(`The resource called ${resourceName} is not a json file.`)
      );

    const fullUrl = ResourcesLoader.getResourceFullUrl(project, resourceName, {
      isResourceForPixi: true,
    });
    return (
      axios
        // $FlowFixMe[underconstrained-implicit-instantiation]
        .get(fullUrl, {
          withCredentials: checkIfCredentialsRequired(fullUrl),
        })
        .then(response => response.data)
    );
  }
}
