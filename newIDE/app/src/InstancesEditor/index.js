// @flow
import React, { Component } from 'react';
import debounce from 'lodash/debounce';
import KeyboardShortcuts, { MID_MOUSE_BUTTON } from '../UI/KeyboardShortcuts';
import InstancesRenderer from './InstancesRenderer';
import ViewPosition from './ViewPosition';
import SelectedInstances from './SelectedInstances';
import HighlightedInstance from './HighlightedInstance';
import SelectionRectangle from './SelectionRectangle';
import InstancesResizer, {
  type ResizeGrabbingLocation,
} from './InstancesResizer';
import InstancesRotator from './InstancesRotator';
import InstancesMover from './InstancesMover';
import Grid from './Grid';
import WindowBorder from './WindowBorder';
import WindowMask from './WindowMask';
import * as THREE from 'three';
import FpsLimiter from './FpsLimiter';
import StatusBar from './StatusBar';
import ProfilerBar from './ProfilerBar';
import CanvasCursor from './CanvasCursor';
import InstancesAdder from './InstancesAdder';
import { makeDropTarget } from '../UI/DragAndDrop/DropTarget';
import { objectWithContextReactDndType } from '../ObjectsList';
import PinchHandler, { shouldBeHandledByPinch } from './PinchHandler';
import { type ScreenType } from '../UI/Responsive/ScreenTypeMeasurer';
import InstancesSelection from './InstancesSelection';
import LongTouchHandler from './LongTouchHandler';
import {
  getRecommendedInitialZoomFactor,
  type InstancesEditorSettings,
} from './InstancesEditorSettings';
import Rectangle from '../Utils/Rectangle';
import {
  clampInstancesEditorZoom,
  getWheelStepZoomFactor,
} from '../Utils/ZoomUtils';
import Background from './Background';
import ClickInterceptor from './ClickInterceptor';
import { ErrorFallbackComponent } from '../UI/ErrorBoundary';
import { Trans } from '@lingui/macro';
import { generateUUID } from 'three/src/math/MathUtils';

type TileMapTileSelection = any;
const gd: libGDevelop = global.gd;
export const instancesEditorId = 'instances-editor-canvas';
const styles = {
  canvasArea: { flex: 1, position: 'absolute', overflow: 'hidden' },
  dropCursor: { cursor: 'copy' },
};

const DropTarget = makeDropTarget<{||}>(objectWithContextReactDndType);

export type EditorViewPosition2D = {|
  viewX: number | null,
  viewY: number | null,
|};

export type InstancesEditorShortcutsCallbacks = {|
  onDelete: () => void,
  onCopy: () => void,
  onCut: () => void,
  onPaste: () => void,
  onDuplicate: () => void,
  onUndo: () => void,
  onRedo: () => void,
  onZoomOut: () => void,
  onZoomIn: () => void,
  onShift1: () => void,
  onShift2: () => void,
  onShift3: () => void,
|};

export type InstancesEditorPropsWithoutSizeAndScroll = {|
  project: gdProject,
  layout: gdLayout | null,
  eventsBasedObject: gdEventsBasedObject | null,
  eventsBasedObjectVariant: gdEventsBasedObjectVariant | null,
  layersContainer: gdLayersContainer,
  globalObjectsContainer: gdObjectsContainer | null,
  objectsContainer: gdObjectsContainer,
  chosenLayer: string,
  initialInstances: gdInitialInstancesContainer,
  instancesEditorSettings: InstancesEditorSettings,
  isInstanceOf3DObject: gdInitialInstance => boolean,
  onInstancesEditorSettingsMutated: (
    instancesEditorSettings: InstancesEditorSettings
  ) => void,
  instancesSelection: InstancesSelection,
  onInstancesAdded: (instances: Array<gdInitialInstance>) => void,
  onInstancesSelected: (instances: Array<gdInitialInstance>) => void,
  onInstanceDoubleClicked: (instance: gdInitialInstance) => void,
  onInstancesMoved: (instances: Array<gdInitialInstance>) => void,
  onInstancesResized: (instances: Array<gdInitialInstance>) => void,
  onInstancesRotated: (instances: Array<gdInitialInstance>) => void,
  selectedObjectNames: Array<string>,
  onContextMenu: (
    x: number,
    y: number,
    ignoreSelectedObjectNamesForContextMenu?: boolean
  ) => void,
  pauseRendering: boolean,
  instancesEditorShortcutsCallbacks: InstancesEditorShortcutsCallbacks,
  tileMapTileSelection: ?TileMapTileSelection,
  onSelectTileMapTile: (?TileMapTileSelection) => void,
  editorViewPosition2D: EditorViewPosition2D,
|};

type Props = {|
  ...InstancesEditorPropsWithoutSizeAndScroll,
  width: number,
  height: number,
  onViewPositionChanged?: ViewPosition => void,
  onMouseMove?: MouseEvent => void,
  onMouseLeave?: MouseEvent => void,
  screenType: ScreenType,
  showObjectInstancesIn3D: boolean,
  showBasicProfilingCounters: boolean,
|};

type State = {|
  renderingError: null | {|
    error: Error,
    uniqueErrorId: string,
  |},
|};

export default class InstancesEditor extends Component<Props, State> {
  lastContextMenuX = 0;
  lastContextMenuY = 0;
  lastCursorX: number | null = null;
  lastCursorY: number | null = null;
  fpsLimiter: FpsLimiter = new FpsLimiter({ maxFps: 60, idleFps: 10 });
  canvasArea: ?HTMLDivElement;
  renderer: THREE.WebGLRenderer | null = null;
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  mouse: THREE.Vector2 = new THREE.Vector2();
  keyboardShortcuts: KeyboardShortcuts;
  pinchHandler: PinchHandler;
  canvasCursor: CanvasCursor;
  _instancesAdder: InstancesAdder;
  selectionRectangle: SelectionRectangle;
  selectedInstances: SelectedInstances;
  clickInterceptor: ClickInterceptor;
  highlightedInstance: HighlightedInstance;
  instancesResizer: InstancesResizer;
  instancesRotator: InstancesRotator;
  instancesMover: InstancesMover;
  windowBorder: WindowBorder;
  windowMask: WindowMask;
  statusBar: StatusBar;
  profilerBar: ProfilerBar;
  uiGroup: THREE.Group = new THREE.Group();
  backgroundGroup: THREE.Group = new THREE.Group();
  backgroundHitArea: THREE.Group = new THREE.Group();
  instancesRenderer: InstancesRenderer;
  viewPosition: ViewPosition;
  longTouchHandler: LongTouchHandler;
  grid: Grid;
  background: Background;
  _unmounted = false;
  _renderingPausedReasons: Set<string> = new Set();
  nextFrame: AnimationFrameID;
  contextMenuLongTouchTimeoutID: TimeoutID;
  hasCursorMovedSinceItIsDown = false;
  _showObjectInstancesIn3D: boolean = false;
  state = {
    renderingError: null,
  };

  componentDidMount() {
    if (this.canvasArea && !this.renderer) {
      this._initializeCanvasAndRenderer();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.canvasArea && !this.renderer) {
      this._initializeCanvasAndRenderer();
      return;
    }

    if (!this.renderer) return;

    if (
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      this.renderer.setSize(this.props.width || 1, this.props.height || 1);
      if (this.viewPosition) {
        this.viewPosition.resize(this.props.width, this.props.height);
      }
      this._mountEditorComponents(this.props);
    }

    if (
      prevProps.instancesEditorSettings !== this.props.instancesEditorSettings
    ) {
      if (this.viewPosition) {
        this.viewPosition.setInstancesEditorSettings(
          this.props.instancesEditorSettings
        );
      }
      if (this.grid) {
        this.grid.setInstancesEditorSettings(
          this.props.instancesEditorSettings
        );
      }
      if (this.windowMask) {
        this.windowMask.setInstancesEditorSettings(
          this.props.instancesEditorSettings
        );
      }
      if (this.instancesMover) {
        this.instancesMover.setInstancesEditorSettings(
          this.props.instancesEditorSettings
        );
      }
      if (this.instancesResizer) {
        this.instancesResizer.setInstancesEditorSettings(
          this.props.instancesEditorSettings
        );
      }
    }

    if (
      prevProps.screenType !== this.props.screenType &&
      this.selectedInstances
    ) {
      this.selectedInstances.setScreenType(this.props.screenType);
    }

    if (
      prevProps.showObjectInstancesIn3D !==
        this.props.showObjectInstancesIn3D ||
      prevProps.layout !== this.props.layout ||
      prevProps.layersContainer !== this.props.layersContainer ||
      prevProps.globalObjectsContainer !== this.props.globalObjectsContainer ||
      prevProps.objectsContainer !== this.props.objectsContainer ||
      prevProps.initialInstances !== this.props.initialInstances
    ) {
      this._showObjectInstancesIn3D = this.props.showObjectInstancesIn3D;
      this._mountEditorComponents(this.props);
    }
  }

  shouldDisplayClickableHandles = (): boolean =>
    !this.keyboardShortcuts || !this.keyboardShortcuts.shouldMoveView();

  getSelectedInstancesObjectFillColor = (isLocked: boolean) => ({
    color: isLocked ? 0x999999 : 0x4da3ff,
    alpha: isLocked ? 0.25 : 0.35,
  });

  getTileMapTileSelection = (): ?TileMapTileSelection =>
    this.props.tileMapTileSelection;

  _initializeCanvasAndRenderer() {
    const { canvasArea } = this;
    if (!canvasArea) return;

    const { onMouseMove, onMouseLeave } = this.props;

    this.keyboardShortcuts = new KeyboardShortcuts({
      shortcutCallbacks: {
        onMove: this.moveSelection,
        onEscape: this.onPressEscape,
        ...this.props.instancesEditorShortcutsCallbacks,
      },
    });

    this._showObjectInstancesIn3D = this.props.showObjectInstancesIn3D;
    const initialWidth = this.props.width || 1;
    const initialHeight = this.props.height || 1;

    const gameCanvas = document.createElement('canvas');
    const threeRenderer = new THREE.WebGLRenderer({
      canvas: gameCanvas,
      antialias: true,
    });
    threeRenderer.autoClear = false;
    threeRenderer.setSize(initialWidth, initialHeight);
    this.renderer = threeRenderer;

    canvasArea.appendChild(gameCanvas);
    this.renderer.domElement.style.outline = 'none';

    this.longTouchHandler = new LongTouchHandler({
      canvas: this.renderer.domElement,
      onLongTouch: event =>
        this.props.onContextMenu(event.clientX, event.clientY),
    });

    this.renderer.domElement.onwheel = (event: WheelEvent) => {
      this.fpsLimiter.notifyInteractionHappened();
      const zoomFactor = this.getZoomFactor();
      if (this.keyboardShortcuts.shouldZoom(event)) {
        this.zoomOnCursorBy(getWheelStepZoomFactor(-event.deltaY));
      } else if (this.keyboardShortcuts.shouldScrollHorizontally()) {
        const deltaX = event.deltaY / (5 * zoomFactor);
        this.scrollBy(-deltaX, 0);
      } else {
        const deltaX = event.deltaX / (5 * zoomFactor);
        const deltaY = event.deltaY / (5 * zoomFactor);
        this.scrollBy(deltaX, deltaY);
      }
      event.preventDefault();
    };

    this.renderer.domElement.setAttribute('tabIndex', -1);
    this.renderer.domElement.addEventListener(
      'keydown',
      this.keyboardShortcuts.onKeyDown
    );
    this.renderer.domElement.addEventListener(
      'keyup',
      this.keyboardShortcuts.onKeyUp
    );
    this.renderer.domElement.addEventListener(
      'mousedown',
      this.keyboardShortcuts.onMouseDown
    );
    this.renderer.domElement.addEventListener(
      'mouseup',
      this.keyboardShortcuts.onMouseUp
    );

    this.renderer.domElement.addEventListener('mousemove', event => {
      this._onMouseMove(event.clientX, event.clientY);
      if (onMouseMove) onMouseMove(event);
    });
    if (onMouseLeave)
      this.renderer.domElement.addEventListener('mouseout', onMouseLeave);

    this.renderer.domElement.addEventListener('mousedown', event =>
      this._onDownBackground(event.clientX, event.clientY, event)
    );
    this.renderer.domElement.addEventListener('mouseup', event =>
      this._onUpBackground(event.clientX, event.clientY, event)
    );
    this.renderer.domElement.addEventListener('touchstart', event => {
      if (shouldBeHandledByPinch(event)) return;
      this._onDownBackground(event.clientX, event.clientY);
    });
    this.renderer.domElement.addEventListener('touchend', event => {
      if (shouldBeHandledByPinch(event)) return;
      this._onUpBackground(event.clientX, event.clientY);
    });

    // UI Interaction Layer
    this.uiGroup = new THREE.Group();
    this.backgroundGroup = new THREE.Group();
    this.uiGroup.add(this.backgroundHitArea);

    const areaRectangle = this._getAreaRectangle();
    this.viewPosition = new ViewPosition({
      initialViewX:
        this.props.editorViewPosition2D.viewX === null
          ? areaRectangle.centerX()
          : this.props.editorViewPosition2D.viewX,
      initialViewY:
        this.props.editorViewPosition2D.viewY === null
          ? areaRectangle.centerY()
          : this.props.editorViewPosition2D.viewY,
      width: this.props.width,
      height: this.props.height,
      instancesEditorSettings: this.props.instancesEditorSettings,
    });

    this.grid = new Grid({
      viewPosition: this.viewPosition,
      instancesEditorSettings: this.props.instancesEditorSettings,
    });
    this.uiGroup.add(this.grid.getThreeObject());

    this.pinchHandler = new PinchHandler({
      canvas: this.renderer.domElement,
      setZoomFactor: this.setZoomFactor,
      getZoomFactor: this.getZoomFactor,
      viewPosition: this.viewPosition,
    });

    this.canvasCursor = new CanvasCursor({
      canvas: canvasArea,
      shouldMoveView: () => this.keyboardShortcuts.shouldMoveView(),
    });

    this._instancesAdder = new InstancesAdder({
      project: this.props.project,
      instances: this.props.initialInstances,
      instancesEditorSettings: this.props.instancesEditorSettings,
    });

    this._mountEditorComponents(this.props);
    this._renderScene();
    if (this.props.onViewPositionChanged) {
      this.props.onViewPositionChanged(this.viewPosition);
    }
  }

  _mountEditorComponents(props: Props) {
    if (this.instancesRenderer) {
      this.instancesRenderer.delete();
    }
    if (this.selectionRectangle) {
      this.selectionRectangle.delete();
    }

    this.uiGroup.clear(); // Clean Three.js group
    this.backgroundGroup.clear();

    this.instancesRenderer = new InstancesRenderer({
      project: props.project,
      layout: props.layout || null,
      layersContainer: props.layersContainer,
      globalObjectsContainer: props.globalObjectsContainer,
      objectsContainer: props.objectsContainer,
      instances: props.initialInstances,
      viewPosition: this.viewPosition,
      onOverInstance: this._onOverInstance,
      onMoveInstance: this._onMoveInstance,
      onMoveInstanceEnd: this._onMoveInstanceEnd,
      onDownInstance: this._onDownInstance,
      onUpInstance: this._onUpInstance,
      onOutInstance: this._onOutInstance,
      onInstanceClicked: this._onInstanceClicked,
      onInstanceRightClicked: this._onInstanceRightClicked,
      onInstanceDoubleClicked: this._onInstanceDoubleClicked,
      showObjectInstancesIn3D: this._showObjectInstancesIn3D,
    });

    this.selectionRectangle = new SelectionRectangle({
      instances: props.initialInstances,
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      toSceneCoordinates: this.viewPosition.toSceneCoordinates,
    });

    this.selectedInstances = new SelectedInstances({
      instancesSelection: this.props.instancesSelection,
      shouldDisplayHandles: this.shouldDisplayClickableHandles,
      onResize: this._onResize,
      onResizeEnd: this._onResizeEnd,
      onRotate: this._onRotate,
      onRotateEnd: this._onRotateEnd,
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      toCanvasCoordinates: this.viewPosition.toCanvasCoordinates,
      getFillColor: this.getSelectedInstancesObjectFillColor,
      screenType: this.props.screenType,
      keyboardShortcuts: this.keyboardShortcuts,
      onPanMove: this._onPanMove,
      onPanEnd: this._onPanEnd,
    });

    this.clickInterceptor = new ClickInterceptor({
      getTileMapTileSelection: this.getTileMapTileSelection,
      viewPosition: this.viewPosition,
      onClick: this._onInterceptClick,
      onPanMove: this._onPanMove,
      onInterceptPointerMove: () => this.fpsLimiter.notifyInteractionHappened(),
    });

    this.highlightedInstance = new HighlightedInstance({
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      toCanvasCoordinates: this.viewPosition.toCanvasCoordinates,
      isInstanceOf3DObject: this.props.isInstanceOf3DObject,
    });

    this.instancesResizer = new InstancesResizer({
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      instancesEditorSettings: this.props.instancesEditorSettings,
    });

    this.instancesRotator = new InstancesRotator(
      this.instancesRenderer.getInstanceMeasurer()
    );

    this.instancesMover = new InstancesMover({
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      instancesEditorSettings: this.props.instancesEditorSettings,
    });

    this.windowBorder = new WindowBorder({
      project: props.project,
      layout: props.layout,
      eventsBasedObjectVariant: props.eventsBasedObjectVariant,
      toCanvasCoordinates: this.viewPosition.toCanvasCoordinates,
    });

    this.windowMask = new WindowMask({
      project: props.project,
      viewPosition: this.viewPosition,
      instancesEditorSettings: this.props.instancesEditorSettings,
    });

    this.statusBar = new StatusBar({
      width: this.props.width,
      height: this.props.height,
      getLastCursorSceneCoordinates: this.getLastCursorSceneCoordinates,
    });

    this.profilerBar = new ProfilerBar();

    this.uiGroup.add(this.selectionRectangle.getThreeObject());
    this.uiGroup.add(this.instancesRenderer.getThreeGroup());
    this.uiGroup.add(this.windowBorder.getThreeObject());
    this.uiGroup.add(this.windowMask.getThreeObject());
    this.uiGroup.add(this.selectedInstances.getThreeGroup());
    this.uiGroup.add(this.highlightedInstance.getThreeObject());
    this.uiGroup.add(this.clickInterceptor.getThreeObject());
    this.uiGroup.add(this.statusBar.getThreeObject());
    this.uiGroup.add(this.profilerBar.getThreeObject());
    this.uiGroup.add(this.grid.getThreeObject());

    this.background = new Background({
      width: this.props.width,
      height: this.props.height,
      layout: props.layout || null,
    });
    this.backgroundGroup.add(this.background.getThreeObject());
  }

  componentWillUnmount() {
    this._unmounted = true;
    if (this.selectionRectangle) this.selectionRectangle.delete();
    if (this.instancesRenderer) this.instancesRenderer.delete();
    if (this._instancesAdder) this._instancesAdder.unmount();
    if (this.pinchHandler) this.pinchHandler.unmount();
    if (this.longTouchHandler) this.longTouchHandler.unmount();
    if (this.nextFrame) cancelAnimationFrame(this.nextFrame);

    // Clear Three.js groups
    if (this.uiGroup) this.uiGroup.clear();
    if (this.backgroundGroup) this.backgroundGroup.clear();
    if (this.renderer) this.renderer.dispose();
  }

  _renderScene = () => {
    if (this._unmounted) return;
    this.nextFrame = requestAnimationFrame(this._renderScene);
    if (this.props.pauseRendering || this._renderingPausedReasons.size > 0)
      return;
    if (!this.fpsLimiter.shouldUpdate()) return;

    try {
      if (this.renderer && this.instancesRenderer) {
        this.grid.render();
        this.selectionRectangle.render();
        this.selectedInstances.render();
        this.highlightedInstance.render();
        this.statusBar.render();
        this.profilerBar.render({
          basicProfilingCounters: this.instancesRenderer.getBasicProfilingCounters(),
          display: this.props.showBasicProfilingCounters,
        });
        this.windowBorder.render();
        this.windowMask.render();
        this.background.render();

        this.instancesRenderer.render(
          this.renderer,
          this.viewPosition,
          this.uiGroup,
          this.backgroundGroup
        );
      }
    } catch (error) {
      console.error('Exception caught while doing the rendering:', error);
      this.setState({
        renderingError: { error, uniqueErrorId: generateUUID() },
      });
    }
  };

  _onDownBackground = (x: number, y: number, event?: PointerEvent) => {
    this.fpsLimiter.notifyInteractionHappened();
    if (!this.renderer) return;
    this.renderer.domElement.focus();
    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const canvasX = x - canvasRect.left;
    const canvasY = y - canvasRect.top;

    // 1. Check UI objects (Handles, etc.)
    if (this.instancesRenderer && this.instancesRenderer._uiCamera) {
      this.mouse.set(
        (canvasX / canvasRect.width) * 2 - 1,
        -(canvasY / canvasRect.height) * 2 + 1
      );
      this.raycaster.setFromCamera(
        this.mouse,
        this.instancesRenderer._uiCamera
      );
      const uiIntersects = this.raycaster.intersectObjects(
        this.uiGroup.children,
        true
      );
      if (uiIntersects.length > 0) {
        const hit = uiIntersects[0];
        if (hit.object.userData.isHandle) {
          const scenePoint = this.viewPosition.toSceneCoordinates(
            canvasX,
            canvasY
          );
          this.props.instancesSelection.selectInstance({
            instance: hit.object.userData.instance,
            multiSelect: this.keyboardShortcuts.shouldMultiSelect(),
            layersLocks: {},
          });
          this.props.onInstancesSelected(
            this.props.instancesSelection.getSelectedInstances()
          );
          this._activeResizeHandle = hit.object.userData.location;
          this._lastPointerSceneX = scenePoint[0];
          this._lastPointerSceneY = scenePoint[1];
          return;
        }
      }
    }

    // 2. Check scene instances
    const instancesUnderCursor = this.instancesRenderer.getInstancesAt(
      canvasX,
      canvasY,
      this.renderer,
      this.raycaster
    );
    if (instancesUnderCursor.length > 0) {
      const scenePoint = this.viewPosition.toSceneCoordinates(canvasX, canvasY);
      this._onDownInstance(
        instancesUnderCursor[0],
        scenePoint[0],
        scenePoint[1]
      );
      return;
    }

    this.hasCursorMovedSinceItIsDown = false;
    const shouldMoveView =
      this.keyboardShortcuts.shouldMoveView() ||
      (event ? event.button === 1 : false);
    if (this.props.tileMapTileSelection) {
      this.clickInterceptor.startPointerInterception(canvasX, canvasY);
      return;
    }
    if (!shouldMoveView) {
      this.selectionRectangle.startSelectionRectangle(canvasX, canvasY);
    }
    if (
      !this.keyboardShortcuts.shouldMultiSelect() &&
      !shouldMoveView &&
      this.props.instancesSelection.hasSelectedInstances()
    ) {
      this.props.instancesSelection.clearSelection();
      this.props.onInstancesSelected([]);
    }
  };

  _onUpBackground = (x: number, y: number, event?: PointerEvent) => {
    if (!this.renderer) return;
    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const canvasX = x - canvasRect.left;
    const canvasY = y - canvasRect.top;
    if (this.clickInterceptor && this.clickInterceptor.isIntercepting()) {
      this.clickInterceptor.endPointerInterception();
      return;
    }
    const instancesUnderCursor = this.instancesRenderer.getInstancesAt(
      canvasX,
      canvasY,
      this.renderer,
      this.raycaster
    );
    if (instancesUnderCursor.length > 0) {
      const scenePoint = this.viewPosition.toSceneCoordinates(canvasX, canvasY);
      this._onUpInstance(instancesUnderCursor[0], scenePoint[0], scenePoint[1]);
    }
    if (this.selectionRectangle.hasStartedSelectionRectangle()) {
      this._selectInstanceInsideSelectionRectangle();
    }
  };

  _onMouseMove = (x: number, y: number) => {
    this.fpsLimiter.notifyInteractionHappened();
    if (!this.renderer) return;
    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const canvasX = x - canvasRect.left;
    const canvasY = y - canvasRect.top;
    this.lastCursorX = canvasX;
    this.lastCursorY = canvasY;
    if (this.clickInterceptor && this.clickInterceptor.isIntercepting()) {
      this.clickInterceptor.interceptPointerMove(canvasX, canvasY);
      return;
    }
    const instancesUnderCursor = this.instancesRenderer.getInstancesAt(
      canvasX,
      canvasY,
      this.renderer,
      this.raycaster
    );
    if (instancesUnderCursor.length > 0) {
      this._onOverInstance(instancesUnderCursor[0]);
    } else {
      this.highlightedInstance.setInstance(null);
    }
  };

  // ... (keeping other helper methods simplified for the audit fix)
  _getAreaRectangle = () =>
    new Rectangle(0, 0, this.props.width, this.props.height);
  getZoomFactor = () => this.props.instancesEditorSettings.zoomFactor;
  setZoomFactor = (zoomFactor: number) => {
    this.props.instancesEditorSettings.zoomFactor = clampInstancesEditorZoom(
      zoomFactor
    );
    this.props.onInstancesEditorSettingsMutated(
      this.props.instancesEditorSettings
    );
  };
  zoomBy = (zoomFactor: number) => {
    this.setZoomFactor(this.getZoomFactor() * zoomFactor);
  };
  zoomOnCursorBy = (zoomDelta: number) => {
    this.zoomBy(zoomDelta);
  };
  scrollBy = (x, y) => {
    this.viewPosition.scrollBy(x, y);
    this.props.onViewPositionChanged &&
      this.props.onViewPositionChanged(this.viewPosition);
  };
  scrollTo = (x, y) => {
    this.viewPosition.scrollTo(x, y);
    this.props.onViewPositionChanged &&
      this.props.onViewPositionChanged(this.viewPosition);
  };
  fitViewToRectangle = (
    rectangle: Rectangle,
    { adaptZoom }: {| adaptZoom: boolean |}
  ) => {
    const idealZoom = this.viewPosition.fitToRectangle(rectangle);
    if (adaptZoom) this.setZoomFactor(idealZoom);
    this.props.onViewPositionChanged &&
      this.props.onViewPositionChanged(this.viewPosition);
  };
  _activeResizeHandle: ResizeGrabbingLocation | null = null;
  _lastPointerSceneX: number = 0;
  _lastPointerSceneY: number = 0;
  _onResize = (dx, dy, loc) => {
    this.instancesResizer.resizeBy(
      this.props.instancesSelection.getSelectedInstances(),
      dx,
      dy,
      loc,
      this.keyboardShortcuts.shouldResizeProportionally(),
      this.keyboardShortcuts.shouldNotSnapToGrid()
    );
    this.props.onInstancesResized(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  _onRotate = (x, y) => {
    this.instancesRotator.rotateBy(
      this.props.instancesSelection.getSelectedInstances(),
      x,
      y,
      this.keyboardShortcuts.shouldResizeProportionally()
    );
    this.props.onInstancesRotated(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  _onResizeEnd = () => {
    this.instancesResizer.endResize();
    this._activeResizeHandle = null;
    this.props.onInstancesResized(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  _onRotateEnd = () => {
    this.instancesRotator.endRotate();
    this.props.onInstancesRotated(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  _onDownInstance = (instance, x, y) => {
    this._activeResizeHandle = null;
    this._lastPointerSceneX = x;
    this._lastPointerSceneY = y;
    this.props.instancesSelection.selectInstance({
      instance,
      multiSelect: this.keyboardShortcuts.shouldMultiSelect(),
      layersLocks: {},
    });
    this.props.onInstancesSelected(
      this.props.instancesSelection.getSelectedInstances()
    );
    this.instancesMover.startMove(x, y);
  };
  _onUpInstance = (instance, x, y) => {
    if (this._activeResizeHandle) {
      this._onResizeEnd();
      return;
    }
    this.instancesMover.endMove();
  };
  _onOutInstance = instance => {
    if (
      this.highlightedInstance &&
      this.highlightedInstance.getInstance() === instance
    ) {
      this.highlightedInstance.setInstance(null);
    }
  };
  _onOverInstance = instance => {
    this.highlightedInstance.setInstance(instance);
  };
  _onInstanceClicked = instance => {
    this.props.instancesSelection.selectInstance({
      instance,
      multiSelect: this.keyboardShortcuts.shouldMultiSelect(),
      layersLocks: {},
    });
    this.props.onInstancesSelected(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  _onInstanceRightClicked = ({ offsetX, offsetY }) => {
    this.lastContextMenuX = offsetX;
    this.lastContextMenuY = offsetY;
    this.props.onContextMenu(offsetX, offsetY);
  };
  _onInstanceDoubleClicked = instance => {
    this.props.onInstanceDoubleClicked(instance);
  };
  _onMoveInstance = (instance, x, y) => {
    const deltaX = x - this._lastPointerSceneX;
    const deltaY = y - this._lastPointerSceneY;
    this._lastPointerSceneX = x;
    this._lastPointerSceneY = y;

    if (this._activeResizeHandle) {
      this.instancesResizer.resizeBy(
        this.props.instancesSelection.getSelectedInstances(),
        deltaX,
        deltaY,
        this._activeResizeHandle,
        this.keyboardShortcuts.shouldResizeProportionally(),
        this.keyboardShortcuts.shouldNotSnapToGrid()
      );
      this.props.onInstancesResized(
        this.props.instancesSelection.getSelectedInstances()
      );
      return;
    }

    this.instancesMover.moveBy(
      this.props.instancesSelection.getSelectedInstances(),
      deltaX,
      deltaY,
      this.keyboardShortcuts.shouldFollowAxis(),
      this.keyboardShortcuts.shouldNotSnapToGrid()
    );
  };
  _onMoveInstanceEnd = () => {
    if (this._activeResizeHandle) {
      this._onResizeEnd();
      return;
    }
    this.instancesMover.endMove();
    this.props.onInstancesMoved(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  _onPanMove = (deltaX, deltaY) => {
    this.scrollBy(
      -deltaX / this.getZoomFactor(),
      -deltaY / this.getZoomFactor()
    );
  };
  _onPanEnd = () => {};
  clearHighlightedInstance = () => {
    this.highlightedInstance.setInstance(null);
  };
  onInstancesMovedDebounced = (debounce(this.props.onInstancesMoved, 50, {
    trailing: true,
  }): any);
  moveSelection = (x: number, y: number) => {
    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    const unlockedSelectedInstances = selectedInstances.filter(
      instance => !instance.isLocked()
    );
    unlockedSelectedInstances.forEach(instance => {
      instance.setX(instance.getX() + x);
      instance.setY(instance.getY() + y);
    });
    this.onInstancesMovedDebounced(unlockedSelectedInstances);
  };
  onPressEscape = () => {
    if (this.clickInterceptor && this.clickInterceptor.isIntercepting()) {
      this.clickInterceptor.cancelClickInterception();
    }
  };
  _onInterceptClick = () => {};
  _selectInstanceInsideSelectionRectangle = () => {
    const selected = this.selectionRectangle.endSelectionRectangle();
    this.props.instancesSelection.selectInstances({
      instances: selected,
      multiSelect: this.keyboardShortcuts.shouldMultiSelect(),
      layersLocks: {},
    });
    this.props.onInstancesSelected(
      this.props.instancesSelection.getSelectedInstances()
    );
  };
  getBoundingClientRect = (): any => {
    if (!this.canvasArea) return { left: 0, top: 0, right: 0, bottom: 0 };
    return this.canvasArea.getBoundingClientRect();
  };
  getContentAABB = (): Rectangle | null => {
    const { initialInstances } = this.props;
    if (!this.instancesRenderer || initialInstances.getInstancesCount() === 0)
      return null;

    const instanceMeasurer = this.instancesRenderer.getInstanceMeasurer();
    let contentAABB: Rectangle | null = null;
    const getInstanceRectangle = new gd.InitialInstanceJSFunctor();
    getInstanceRectangle.invoke = instancePtr => {
      const instance: gdInitialInstance = gd.wrapPointer(
        instancePtr,
        gd.InitialInstance
      );
      if (!contentAABB) {
        contentAABB = instanceMeasurer.getInstanceAABB(
          instance,
          new Rectangle()
        );
      } else {
        contentAABB.union(
          instanceMeasurer.getInstanceAABB(instance, new Rectangle())
        );
      }
    };
    initialInstances.iterateOverInstances(getInstanceRectangle);
    getInstanceRectangle.delete();
    return contentAABB;
  };
  zoomToFitContent = () => {
    const contentAABB = this.getContentAABB();
    if (contentAABB) this.fitViewToRectangle(contentAABB, { adaptZoom: true });
  };
  zoomToInitialPosition = () => {
    const areaRectangle = this._getAreaRectangle();
    this.setZoomFactor(
      getRecommendedInitialZoomFactor(
        Math.max(areaRectangle.width(), areaRectangle.height())
      )
    );
    this.scrollTo(areaRectangle.centerX(), areaRectangle.centerY());
  };
  zoomToFitSelection = () => {
    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    if (!selectedInstances.length || !this.instancesRenderer) return;
    let selectionRectangle = this.instancesRenderer
      .getInstanceMeasurer()
      .getInstanceAABB(selectedInstances[0], new Rectangle());
    for (let i = 1; i < selectedInstances.length; i++) {
      selectionRectangle.union(
        this.instancesRenderer
          .getInstanceMeasurer()
          .getInstanceAABB(selectedInstances[i], new Rectangle())
      );
    }
    if (selectionRectangle.width() > 0 && selectionRectangle.height() > 0) {
      this.fitViewToRectangle(selectionRectangle, { adaptZoom: true });
    }
  };
  centerViewOnLastInstance = (
    instances: Array<gdInitialInstance>,
    offset?: ?[number, number]
  ) => {
    if (!instances.length || !this.instancesRenderer) return;
    const lastInstanceRectangle = this.instancesRenderer
      .getInstanceMeasurer()
      .getInstanceAABB(instances[instances.length - 1], new Rectangle());
    this.fitViewToRectangle(lastInstanceRectangle, { adaptZoom: false });
    if (offset) this.scrollBy(offset[0], offset[1]);
  };
  getLastContextMenuSceneCoordinates = (): any =>
    this.viewPosition.toSceneCoordinates(
      this.lastContextMenuX,
      this.lastContextMenuY
    );
  getLastCursorSceneCoordinates = () =>
    this.lastCursorX !== null
      ? this.viewPosition.toSceneCoordinates(this.lastCursorX, this.lastCursorY)
      : null;
  getViewPosition = (): ?ViewPosition => this.viewPosition;
  getInstanceSize = (
    initialInstance: gdInitialInstance
  ): [number, number, number] =>
    this.instancesRenderer
      .getInstanceMeasurer()
      .getUnrotatedInstanceSize(initialInstance);
  pauseSceneRendering = reason => this._renderingPausedReasons.add(reason);
  resumeSceneRendering = reason => this._renderingPausedReasons.delete(reason);

  render(): any {
    if (!this.props.project) return null;

    if (this.state.renderingError) {
      return (
        <ErrorFallbackComponent
          error={this.state.renderingError.error}
          componentTitle={<Trans>Instances editor rendering</Trans>}
          componentStack="[InstancesEditor rendering]"
          uniqueErrorId={this.state.renderingError.uniqueErrorId}
        />
      );
    }

    return (
      <DropTarget
        canDrop={() => true}
        hover={monitor => {
          const { _instancesAdder, viewPosition, canvasArea } = this;
          if (!_instancesAdder || !canvasArea || !viewPosition) return;

          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;

          const canvasRect = canvasArea.getBoundingClientRect();
          const pos = viewPosition.toSceneCoordinates(
            clientOffset.x - canvasRect.left,
            clientOffset.y - canvasRect.top
          );
          _instancesAdder.createOrUpdateTemporaryInstancesFromObjectNames(
            pos,
            this.props.selectedObjectNames,
            this.props.chosenLayer
          );
        }}
        drop={monitor => {
          const { _instancesAdder, viewPosition, canvasArea } = this;
          if (!_instancesAdder || !canvasArea || !viewPosition) return;
          if (monitor.didDrop()) {
            _instancesAdder.deleteTemporaryInstances();
            return;
          }

          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;

          const canvasRect = canvasArea.getBoundingClientRect();
          const pos = viewPosition.toSceneCoordinates(
            clientOffset.x - canvasRect.left,
            clientOffset.y - canvasRect.top
          );
          const instances = _instancesAdder.updateTemporaryInstancePositions(
            pos
          );
          _instancesAdder.commitTemporaryInstances();
          this.props.onInstancesAdded(instances);
        }}
      >
        {({ connectDropTarget, isOver }) => {
          if (this._instancesAdder && !isOver) {
            this._instancesAdder.deleteTemporaryInstances();
          }

          return connectDropTarget(
            <div
              ref={canvasArea => (this.canvasArea = canvasArea)}
              style={
                isOver
                  ? { ...styles.canvasArea, ...styles.dropCursor }
                  : styles.canvasArea
              }
              id={instancesEditorId}
            />
          );
        }}
      </DropTarget>
    );
  }
}
