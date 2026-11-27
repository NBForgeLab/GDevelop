/* eslint-env worker */
// IMPORTANT: this file is compiled as a worker entry point (by Vite / worker-loader).
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

type DracoDecoderFiles = {
  dracoWasmWrapperJs: ArrayBuffer;
  dracoDecoderWasm: ArrayBuffer;
};

type MaterialWithMetalness = THREE.Material & {
  metalness?: number;
};

// Copied from PixiResourcesLoader.js
const removeMetalness = (material: MaterialWithMetalness) => {
  if (material.metalness) {
    material.metalness = 0;
  }
};

// Copied from PixiResourcesLoader.js
const removeMetalnessFromMesh = (node: THREE.Object3D) => {
  const mesh = node as THREE.Mesh;
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

const disposeModel = (model: THREE.Object3D) => {
  model.traverse((node: THREE.Object3D) => {
    const mesh = node as THREE.Mesh & { skeleton?: THREE.Skeleton };
    if (mesh.geometry) mesh.geometry.dispose();
    // The bones of skinned meshes are stored in a texture.
    if (mesh.skeleton) mesh.skeleton.dispose();
    if (!mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    materials.forEach((material: THREE.Material) => {
      const materialRecord = material as unknown as Record<string, any>;
      Object.keys(materialRecord).forEach((key) => {
        const value = materialRecord[key];
        if (!value || !value.isTexture) return;
        // GLTFLoader decodes textures as ImageBitmaps, which are not freed by
        // the garbage collector: close them explicitly.
        if (value.image && typeof value.image.close === 'function') {
          value.image.close();
        }
        value.dispose();
      });
      material.dispose();
    });
  });
};

// Worker message types
const MESSAGE_TYPES = {
  RENDER_MODEL: 'RENDER_MODEL',
  RENDER_COMPLETE: 'RENDER_COMPLETE',
  RENDER_ERROR: 'RENDER_ERROR',
  INIT: 'INIT',
} as const;

type WorkerInMessage =
  | {
      type: typeof MESSAGE_TYPES.INIT;
      dracoDecoderFiles?: DracoDecoderFiles | null;
      resourceUrl?: string;
    }
  | {
      type: typeof MESSAGE_TYPES.RENDER_MODEL;
      resourceUrl: string;
      resourceData: ArrayBuffer;
      basePath: string;
    };

let renderer: THREE.WebGLRenderer | null = null;
let width = 128;
let height = 128;
const previewTextureSize = 128;
let offscreenCanvas: OffscreenCanvas | null = null;
let dracoLoader: DRACOLoader | null = null;
// The scene, its light and the camera are reused for every model: only the
// model is added, then removed and freed once rendered.
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;

/**
 * Create the loader for the Draco compressed 3D models.
 *
 * The decoder files are read by the main thread and passed to this worker
 * (see `DracoDecoderFiles` in `Utils/DracoDecoder.ts`), because a worker can't
 * read them by itself in the desktop app (`file://` URLs can't be fetched by
 * workers). They are exposed as blob URLs so that the DRACOLoader can read
 * them like any other file.
 */
const createDracoLoader = (
  dracoDecoderFiles: DracoDecoderFiles
): DRACOLoader => {
  const decoderFileUrls: Record<string, string> = {
    'draco_wasm_wrapper.js': URL.createObjectURL(
      new Blob([dracoDecoderFiles.dracoWasmWrapperJs], {
        type: 'text/javascript',
      })
    ),
    'draco_decoder.wasm': URL.createObjectURL(
      new Blob([dracoDecoderFiles.dracoDecoderWasm], {
        type: 'application/wasm',
      })
    ),
  };

  const loadingManager = new THREE.LoadingManager();
  loadingManager.setURLModifier((url: string) => decoderFileUrls[url] || url);

  // No decoder path is set: the decoder files are found thanks to the
  // loading manager.
  const loader = new DRACOLoader(loadingManager);
  // The models are rendered one after the other: a single worker is enough.
  loader.setWorkerLimit(1);

  return loader;
};

// Set up the renderer when worker is initialized
const initRenderer = (
  dracoDecoderFiles: DracoDecoderFiles | null | undefined
): boolean => {
  offscreenCanvas = new OffscreenCanvas(width, height);

  // Create renderer with offscreen canvas
  renderer = new THREE.WebGLRenderer({
    canvas: offscreenCanvas,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(width, height, false);

  scene = new THREE.Scene();
  const light = new THREE.HemisphereLight();
  light.intensity = Math.PI;
  light.color = new THREE.Color(1, 1, 1);
  light.groundColor = new THREE.Color(0.25, 0.25, 0.25);
  light.position.set(0, 0, 1);
  const lightGroup = new THREE.Group();
  lightGroup.rotation.order = 'ZYX';
  lightGroup.rotation.x = Math.PI / 4;
  lightGroup.add(light);
  scene.add(lightGroup);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);

  if (dracoDecoderFiles) {
    try {
      dracoLoader = createDracoLoader(dracoDecoderFiles);
    } catch (error) {
      // Without the Draco loader, only the models that are not compressed
      // with Draco can be rendered.
      console.error('Unable to create the Draco loader:', error);
    }
  }

  return true;
};

// Render a 3D model to the offscreen canvas and return the data URL.
// resourceData is an ArrayBuffer fetched by the main thread (workers cannot
// fetch file:// URLs in Electron due to network service sandboxing).
const renderModel = async (
  resourceUrl: string,
  resourceData: ArrayBuffer,
  basePath: string
): Promise<string> => {
  if (!renderer || !scene || !camera) {
    throw new Error('Renderer not initialized');
  }

  // Parse the pre-fetched model data instead of fetching the URL,
  // so the worker never needs to make any network/file requests.
  return new Promise<string>((resolve, reject) => {
    const loader = new GLTFLoader();
    if (dracoLoader) {
      loader.setDRACOLoader(dracoLoader);
    }
    // Textures are decoded at the preview size: full size textures would only
    // use memory for a few pixels.
    loader.register((parser: any) => {
      if (parser.textureLoader.isImageBitmapLoader) {
        parser.textureLoader.setOptions({
          ...parser.textureLoader.options,
          resizeWidth: previewTextureSize,
          resizeHeight: previewTextureSize,
          resizeQuality: 'low',
        });
      }
      return { name: 'GDEVELOP_preview_texture_size' };
    });

    loader.parse(
      resourceData,
      basePath,
      (gltf: GLTF) => {
        if (!renderer || !scene || !camera) {
          throw new Error('Renderer not initialized');
        }

        if (!offscreenCanvas) {
          throw new Error('Offscreen canvas not initialized');
        }

        const model = gltf.scene;
        model.traverse(removeMetalnessFromMesh);

        // We can't just rely on model.boundingBox because it doesn't take into account
        // the model's scale and position.
        // So we need to compute the bounding box from the meshes in the model.
        const box = new THREE.Box3();
        const meshes: Array<THREE.Mesh> = [];
        model.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            meshes.push(child as THREE.Mesh);
          }
        });
        meshes.forEach((mesh) => {
          mesh.geometry.computeBoundingBox();
          if (mesh.geometry.boundingBox) {
            const geometryBox = mesh.geometry.boundingBox.clone();
            geometryBox.applyMatrix4(mesh.matrixWorld);
            box.union(geometryBox);
          }
        });

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (!(maxDim > 0)) {
          disposeModel(model);
          reject(new Error('The 3D model has no visible mesh.'));
          return;
        }
        const scale = 1 / maxDim;
        model.scale.set(scale, scale, scale);

        // Center horizontally
        model.position.x -= center.x * scale;
        model.position.z -= center.z * scale;

        // Slight upward shift so base isn't too low
        model.position.y -= (center.y - size.y / 2) * scale;

        const scaledSize = size.clone().multiplyScalar(scale);
        const target = new THREE.Vector3(0, scaledSize.y / 2, 0);
        const viewDirection = new THREE.Vector3(-1, 1, 2).normalize();
        camera.position.copy(target).add(viewDirection);
        camera.lookAt(target);

        // Move the camera back until every corner of the AABB is in the frame.
        const tanHalfVerticalFov = Math.tan(
          THREE.MathUtils.degToRad(camera.fov / 2)
        );
        const tanHalfHorizontalFov = tanHalfVerticalFov * camera.aspect;
        const inverseCameraRotation = camera.quaternion.clone().invert();
        let cameraDistance = 0;
        for (const cornerX of [-scaledSize.x / 2, scaledSize.x / 2]) {
          for (const cornerY of [-scaledSize.y / 2, scaledSize.y / 2]) {
            for (const cornerZ of [-scaledSize.z / 2, scaledSize.z / 2]) {
              const corner = new THREE.Vector3(
                cornerX,
                cornerY,
                cornerZ
              ).applyQuaternion(inverseCameraRotation);
              cameraDistance = Math.max(
                cameraDistance,
                corner.z + Math.abs(corner.x) / tanHalfHorizontalFov,
                corner.z + Math.abs(corner.y) / tanHalfVerticalFov
              );
            }
          }
        }
        const frameMargin = 1.1;
        camera.position
          .copy(target)
          .addScaledVector(viewDirection, cameraDistance * frameMargin);

        // Render the scene and get the screenshot. The scene is reused: the
        // model must be removed from it even if the rendering fails.
        let screenshot: Promise<string>;
        scene.add(model);
        try {
          renderer.render(scene, camera);
          screenshot = offscreenCanvas.convertToBlob
            ? offscreenCanvas.convertToBlob().then((blob: Blob) => {
                return URL.createObjectURL(blob);
              })
            : Promise.resolve(renderer.domElement.toDataURL());
        } catch (error) {
          screenshot = Promise.reject(error);
        } finally {
          scene.remove(model);
        }

        // The renderer is reused: free the GPU memory of the model.
        const dispose = () => disposeModel(model);
        screenshot.then(dispose, dispose);
        resolve(screenshot);
      },
      // Unlike `load`, `parse` has no progress callback.
      (error: unknown) => {
        reject(error);
      }
    );
  });
};

// Handle messages from the main thread
// eslint-disable-next-line no-restricted-globals
self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;
  const { type, resourceUrl } = data;

  try {
    switch (data.type) {
      case MESSAGE_TYPES.INIT: {
        // Always answer to the main thread, even in case of failure, so that it
        // never waits for the worker to be initialized.
        let success = false;
        try {
          success = initRenderer(data.dracoDecoderFiles);
        } catch (error) {
          console.error("Can't initialize the 3D model renderer:", error);
        }
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({ type: MESSAGE_TYPES.INIT, success });
        break;
      }

      case MESSAGE_TYPES.RENDER_MODEL: {
        if (!renderer) {
          throw new Error('Renderer not initialized');
        }

        const { resourceData, basePath } = data;
        const screenshot = await renderModel(
          data.resourceUrl,
          resourceData,
          basePath
        );
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({
          type: MESSAGE_TYPES.RENDER_COMPLETE,
          resourceUrl: data.resourceUrl,
          screenshot,
        });
        break;
      }

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: MESSAGE_TYPES.RENDER_ERROR,
      resourceUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      originalEvent: JSON.stringify(event.data),
    });
  }
};

const Resource3DPreviewWorkerConstructor = {} as unknown as {
  new (): Worker;
};
export default Resource3DPreviewWorkerConstructor;
