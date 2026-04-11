// @flow
import slugs from 'slugs';
import axios from 'axios';

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader';
import ResourcesLoader from '../ResourcesLoader';
import { loadFontFace } from '../Utils/FontFaceLoader';
import { checkIfCredentialsRequired } from '../Utils/CrossOrigin';
import { type ResourceKind } from '../ResourcesList/ResourceSource';
const gd: libGDevelop = global.gd;

type ResourcePromise<T> = { [resourceName: string]: Promise<T> };
type LoadedVideoResource = {
  texture: THREE.VideoTexture,
  video: HTMLVideoElement,
};

let loadedBitmapFonts = {};
let loadedFontFamilies = {};
let loadedTextures: { [string]: any } = {};
const invalidTexture = {
  valid: false,
  width: 32,
  height: 32,
  baseTexture: { valid: false },
};
const loadingTexture = {
  valid: false,
  width: 32,
  height: 32,
  baseTexture: { valid: false },
};

// $FlowFixMe[value-as-type]
const invalidThreeTexture = new THREE.TextureLoader().load(
  'res/invalid_texture.png'
);
invalidThreeTexture.magFilter = THREE.NearestFilter;
invalidThreeTexture.minFilter = THREE.NearestFilter;
invalidThreeTexture.colorSpace = THREE.SRGBColorSpace;

const loadingThreeImage = new Image();
loadingThreeImage.src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAAA1BMVEXX19f5cgrAAAAAAXRSTlMz/za5cAAAAApJREFUCNdjQAMAABAAAbSqgB8AAAAASUVORK5CYII=';
// $FlowFixMe[value-as-type]
const loadingThreeTexture = new THREE.Texture(loadingThreeImage);
loadingThreeTexture.magFilter = THREE.NearestFilter;
loadingThreeTexture.minFilter = THREE.NearestFilter;
loadingThreeTexture.needsUpdate = true;

// $FlowFixMe[value-as-type]
let loadedOrLoadingThreeTextures: ResourcePromise<THREE.Texture> = {};
// $FlowFixMe[value-as-type]
let loadedOrLoadingThreeMaterials: ResourcePromise<THREE.Material> = {};
// $FlowFixMe[value-as-type]
let loadedOrLoading3DModelPromises: ResourcePromise<THREE.THREE_ADDONS.GLTF> = {};
// $FlowFixMe[value-as-type]
let loadedOrLoadingThreeVideoTextures: ResourcePromise<LoadedVideoResource> = {};

/** Promise to serialize reloads of resources, to avoid race conditions. */
let ongoingResourceReloads: Promise<void> | null = null;

/**
 * Ensure only one reload of a resource is being done at a time.
 * Avoid race conditions when multiple SceneEditors are open.
 */
let pendingResourceReloadPromises: {
  [resourceName: string]: Promise<void>,
} = {};

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

  const url = ResourcesLoader.getResourceFullUrl(project, resourceName, {});

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

  // For other resources, use "anonymous" as done by default by threeJS. Note that using `false`
  // to not having `crossorigin` at all would NOT work because the browser would taint the
  // loaded resource so that it can't be read/used in a canvas (it's only working for display `<img>` on screen).
  return 'anonymous';
};

const applythreeTextureSettings = (resource: gdResource, texture: any) => {
  if (resource.getKind() !== 'image') return;
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
 * Expose functions to load three textures or fonts, given the names of
 * resources and a gd.Project.
 *
 * This internally uses ResourcesLoader to get the URL of the resources.
 */
export default class ThreeResourcesLoader {
  static burstCache() {
    loadedBitmapFonts = {};
    loadedFontFamilies = {};
    loadedTextures = {};
    loadedOrLoadingThreeTextures = {};
    loadedOrLoadingThreeMaterials = {};
    loadedOrLoading3DModelPromises = {};
    loadedOrLoadingThreeVideoTextures = {};
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
    if (loadedTexture) {
      delete loadedTextures[resourceName];
      if (
        loadedTexture !== invalidTexture &&
        loadedTexture !== loadingTexture &&
        loadedTexture.dispose
      ) {
        loadedTexture.dispose();
      }

      // Also reload any resource embedding this resource:
      await this._reloadEmbedderResources(project, resourceName, 'atlas');
    }

    await ThreeResourcesLoader.loadTextures(project, [resourceName]);

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
    if (loadedOrLoadingThreeVideoTextures[resourceName]) {
      const loadedVideoResource = await loadedOrLoadingThreeVideoTextures[
        resourceName
      ];
      loadedVideoResource.video.pause();
      loadedVideoResource.video.removeAttribute('src');
      loadedVideoResource.video.load();
      loadedVideoResource.texture.dispose();
      delete loadedOrLoadingThreeVideoTextures[resourceName];
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
    // If a reload for this specific resource is already pending, wait for it
    // instead of queuing a duplicate. This prevents a race condition when
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
      delete pendingResourceReloadPromises[resourceName];
      console.log(`Finished reload of resource "${resourceName}".`);
      if (ongoingResourceReloads === currentReload) {
        ongoingResourceReloads = null;
        console.log(`No more reload are queued.`);
      }
    }
  }
  /**
   * (Re)load the three texture represented by the given resources.
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
        return resource.getKind() === 'image' ? resource : null;
      })
      .filter(Boolean);

    const videoResources = resourceNames
      .map(resourceName => {
        if (!resourcesManager.hasResource(resourceName)) {
          return null;
        }
        const resource = resourcesManager.getResource(resourceName);
        return resource.getKind() === 'video' ? resource : null;
      })
      .filter(Boolean);

    await Promise.all([
      ...imageResources.map(resource =>
        this.getThreeTexture(project, resource.getName()).then(() => undefined)
      ),
      ...videoResources.map(resource =>
        this.getThreeVideoTexture(project, resource.getName()).then(
          () => undefined
        )
      ),
    ]);
  }

  /**
   * Return the three texture represented by the given resource.
   * If not loaded, it will load it.
   * @returns The three.Texture to be used. It can be loading, so you
   * should listen to three.Texture `update` event, and refresh your object
   * if this event is triggered.
   */
  static getLegacyThreeTexture(project: gdProject, resourceName: string): any {
    const loadedTexture = loadedTextures[resourceName];
    if (loadedTexture) {
      return loadedTexture;
    }

    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    ) {
      return invalidTexture;
    }

    const resource = project.getResourcesManager().getResource(resourceName);
    if (resource.getKind() !== 'image') return invalidTexture;

    const pendingTexturePromise = loadedOrLoadingThreeTextures[resourceName];
    if (pendingTexturePromise) {
      return loadingTexture;
    }

    this.getThreeTexture(project, resourceName).catch(error => {
      console.error(
        `Unable to asynchronously warm the texture "${resourceName}" for synchronous access:`,
        error
      );
    });
    return loadingTexture;
  }

  static async getThreeTexture(
    project: gdProject,
    resourceName: string
  ): Promise<THREE.Texture> {
    const loadedOrLoadingPromise = loadedOrLoadingThreeTextures[resourceName];
    if (loadedOrLoadingPromise) return loadedOrLoadingPromise;

    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    ) {
      return Promise.resolve(ThreeResourcesLoader.getInvalidThreeTexture());
    }

    const resource = project.getResourcesManager().getResource(resourceName);
    const url = ResourcesLoader.getResourceFullUrl(project, resourceName, {});

    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin(determineCrossOrigin(url));
      textureLoader.load(
        url,
        texture => {
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearFilter;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          applyThreeTextureSettings(resource, texture);
          loadedTextures[resourceName] = {
            valid: true,
            width:
              texture.image && texture.image.width ? texture.image.width : 0,
            height:
              texture.image && texture.image.height ? texture.image.height : 0,
            baseTexture: { valid: true },
            texture,
          };
          resolve(texture);
        },
        undefined,
        error => {
          console.error(
            `Can't load three texture for resource "${resourceName}":`,
            error
          );
          loadedTextures[resourceName] = invalidTexture;
          resolve(ThreeResourcesLoader.getInvalidThreeTexture());
        }
      );
    });

    loadedOrLoadingThreeTextures[resourceName] = promise;
    return promise;
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

  static getLegacyThreeVideoTexture(
    project: gdProject,
    resourceName: string
  ): any {
    return { valid: true, width: 32, height: 32, baseTexture: { valid: true } };
  }

  static async getThreeVideoTexture(
    project: gdProject,
    resourceName: string
  ): Promise<LoadedVideoResource> {
    const loadedOrLoadingPromise =
      loadedOrLoadingThreeVideoTextures[resourceName];
    if (loadedOrLoadingPromise) return loadedOrLoadingPromise;

    if (
      resourceName.length === 0 ||
      !project.getResourcesManager().hasResource(resourceName)
    ) {
      const invalidVideo = document.createElement('video');
      invalidVideo.preload = 'auto';
      return Promise.resolve({
        video: invalidVideo,
        texture: new THREE.VideoTexture(invalidVideo),
      });
    }

    const url = ResourcesLoader.getResourceFullUrl(project, resourceName, {});
    const crossOrigin = determineCrossOrigin(url);

    const promise = new Promise<LoadedVideoResource>(resolve => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.playsInline = true;
      video.crossOrigin = crossOrigin;
      video.src = url;

      const finishLoading = () => {
        video.removeEventListener('loadedmetadata', finishLoading);
        video.removeEventListener('error', onError);

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        resolve({ video, texture });
      };

      const onError = () => {
        video.removeEventListener('loadedmetadata', finishLoading);
        video.removeEventListener('error', onError);

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = false;
        resolve({ video, texture });
      };

      video.addEventListener('loadedmetadata', finishLoading, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.load();
    });

    loadedOrLoadingThreeVideoTextures[resourceName] = promise;
    return promise;
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
          {}
        );
      }
    } else {
      // Compatibility with GD <= 5.0-beta56
      // Assume resourceName is just the filename to the font
      fullFilename = ResourcesLoader.getFullUrl(project, resourceName, {});
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

    const fullUrl = ResourcesLoader.getResourceFullUrl(
      project,
      resourceName,
      {}
    );
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

  static getLegacyInvalidThreeTexture(): any {
    return invalidTexture;
  }

  static getLegacyLoadingThreeTexture(): any {
    return loadingTexture;
  }

  static getInvalidThreeTexture(): any {
    return invalidThreeTexture;
  }

  static getLoadingThreeTexture(): any {
    return loadingThreeTexture;
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
    if (resource.getKind() !== 'json' && resource.getKind() !== 'tileset')
      return Promise.reject(
        new Error(`The resource called ${resourceName} is not a json file.`)
      );

    const fullUrl = ResourcesLoader.getResourceFullUrl(
      project,
      resourceName,
      {}
    );
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
