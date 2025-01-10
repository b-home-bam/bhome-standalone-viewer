import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, InputSignal } from '@angular/core';
import { Easing, Tween, Group as TweenGroup } from '@tweenjs/tween.js';
import {
  AmbientLight,
  AxesHelper,
  Color,
  Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';

import { AdvancedGrid } from './helpers/advanced-grid.helper';
import {
  OrthographicCameraConfig,
  PerspectiveCameraConfig,
  ThreeViewerConfig,
} from './interfaces/three-viewer-config.interface';

@Component({
  selector: 'bh-three-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './three-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeViewerComponent {
  viewerConfig: InputSignal<ThreeViewerConfig | undefined> = input();
  //protected viewer = viewChild(ThreeViewerComponent);
  private viewerInitiated = false;
  private objectsToAdd: Object3D[] = [];
  private tweensToAdd: { id: string; x: number; y: number; z: number }[] = [];
  private scene: Scene | undefined;
  private camera: OrthographicCamera | PerspectiveCamera | undefined;
  private controls: OrbitControls | MapControls | undefined;
  private webGLRenderer: WebGLRenderer | undefined;
  private css2DRenderer: CSS2DRenderer | undefined;
  private css3DRenderer: CSS3DRenderer | undefined;
  private tweenGroup: TweenGroup | undefined;
  private threeViewerRoot: HTMLDivElement | undefined;
  private cameraPropertiesDiv: HTMLDivElement | undefined;
  private webGLCanvas: HTMLCanvasElement | undefined;
  private css2dDiv: HTMLDivElement | undefined;
  private css3dDiv: HTMLDivElement | undefined;
  private minMapZoom: number | undefined;
  private raycaster = new Raycaster();
  private previouslySelectedObject: Object3D | null = null;

  constructor() {
    this.tweenGroup = new TweenGroup();
    effect(() => {
      if (this.viewerConfig()) {
        this.initiateViewer();
      }
    });
  }

  private initiateViewer(): void {
    if (this.viewerInitiated) {
      return;
    }
    const viewerConfig = this.viewerConfig();
    this.threeViewerRoot = document.querySelector('#three-viewer-root') as HTMLDivElement;
    this.webGLCanvas = document.querySelector('#webgl-canvas') as HTMLCanvasElement;
    this.css2dDiv = document.querySelector('#css2d-div') as HTMLDivElement;
    this.css3dDiv = document.querySelector('#css3d-div') as HTMLDivElement;
    this.cameraPropertiesDiv = document.querySelector('#camera-properties-div') as HTMLDivElement;

    if (!viewerConfig) {
      throw new Error('Viewer configuration is required');
    }
    if (!this.threeViewerRoot) {
      throw new Error('Three viewer root is required');
    }
    if (viewerConfig.camera?.displayCameraProperties === true && !this.cameraPropertiesDiv) {
      throw new Error('Camera position div is required');
    }

    // create scene
    this.scene = this.getScene(viewerConfig);

    // add basics to the scene
    this.addLight(viewerConfig);
    this.addGrid(viewerConfig);
    this.addAxesHelper(viewerConfig);
    this.addMapImage(viewerConfig);

    // create renderer, camera and controls
    this.webGLRenderer = this.getWebGlRenderer();
    this.css2DRenderer = this.getCss2DRenderer();
    this.css3DRenderer = this.getCss3DRenderer();
    this.camera = this.getCamera(viewerConfig);
    this.controls = this.getControls(viewerConfig);
    this.setInitialCameraAndControlProperties(viewerConfig);

    this.css3dDiv?.addEventListener('pointerdown', this.onPointerDown.bind(this), false);

    // handle viewer resizing
    const resizeObserver = new ResizeObserver((entries) => this.onViewerResize(entries));
    resizeObserver.observe(this.threeViewerRoot);

    // define the animation loop
    const animate = (time: number) => {
      if (!this.scene || !this.camera || !this.webGLRenderer || !this.css3DRenderer || !this.tweenGroup) {
        throw new Error('viewer not properly initiated');
      }
      // start the animation loop
      window.requestAnimationFrame(animate);

      // update the controls each iteration if there are controls
      if (this.controls) {
        this.controls.update();
      }

      this.tweenGroup.update(time);

      //render the scene
      this.webGLRenderer.render(this.scene, this.camera);
      this.css3DRenderer.render(this.scene, this.camera);

      // Update the camera properties display
      if (this.cameraPropertiesDiv && this.viewerConfig()?.camera?.displayCameraProperties === true) {
        const { x, y, z } = this.camera.position;
        const { x: rx, y: ry, z: rz } = this.camera.rotation;
        this.cameraPropertiesDiv.textContent = `Camera Position: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) | Rotation: (${rx.toFixed(2)}, ${ry.toFixed(2)}, ${rz.toFixed(2)}) | Zoom: ${this.camera.zoom.toFixed(4)}`;
      }
    };

    // animate
    animate(0);
    this.viewerInitiated = true;
    if(this.objectsToAdd.length > 0) {
      this.scene.add(...this.objectsToAdd);
      this.objectsToAdd = [];
    }

    this.tweensToAdd.map((tween) => {
      this.move3DObject(tween.id, tween.x, tween.y, tween.z);
    });
    this.tweensToAdd = [];
    console.log('Viewer initiated');
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.scene || !this.camera || !this.webGLRenderer || !this.webGLCanvas) {
      throw new Error('Viewer not properly initiated');
    }
    //this.updateTarget(event);

    // only handle clicks. ignore dragging
    // Start tracking the pointer position for potential drag detection
    const startX = event.clientX;
    const startY = event.clientY;

    const onPointerUp = (upEvent: PointerEvent) => {
      const endX = upEvent.clientX;
      const endY = upEvent.clientY;

      // Calculate the distance moved during the pointer interaction
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Treat as a click only if the pointer didn't move significantly
      const dragThreshold = 20;
      if (Math.abs(deltaX) < dragThreshold && Math.abs(deltaY) < dragThreshold) {
        this.handlePointerClick(upEvent);
      }

      // Clean up event listeners
      this.css3dDiv?.removeEventListener('pointerup', onPointerUp);
      this.css3dDiv?.removeEventListener('pointermove', onPointerMove);
    };

    const onPointerMove = () => {
      // If the pointer moves, it can be considered a drag
      this.css3dDiv?.removeEventListener('pointerup', onPointerUp);
      this.css3dDiv?.removeEventListener('pointermove', onPointerMove);
    };

    // Attach event listeners for pointerup and pointermove
    this.css3dDiv?.addEventListener('pointerup', onPointerUp);
    this.css3dDiv?.addEventListener('pointermove', onPointerMove);
  }

  // private updateTarget(event: PointerEvent) {
  //   if (!this.webGLCanvas || !this.camera || !this.scene) {
  //     return;
  //   }

  //   // Calculate pointer position in normalized device coordinates
  //   const rect = this.webGLCanvas.getBoundingClientRect();
  //   const pointer: Vector2 = new Vector2();
  //   pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  //   pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  //   // Set up the raycaster
  //   this.raycaster.setFromCamera(pointer, this.camera);

  //   // Check for intersections
  //   const intersects = this.raycaster.intersectObjects(this.scene.children, true);
  //   if (intersects.length > 0) {
  //     // Update controls target to the intersection point
  //     this.controls.target.copy(intersects[0].point);
  //     this.controls.update();
  //   }
  // }

  private handlePointerClick(event: PointerEvent): void {
    if (!this.webGLCanvas || !this.camera || !this.scene) {
      return;
    }
    // Calculate pointer position in normalized device coordinates
    const rect = this.webGLCanvas.getBoundingClientRect();
    const pointer: Vector2 = new Vector2();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Set up the raycaster
    this.raycaster.setFromCamera(pointer, this.camera);

    //unselect the previously selected object
    if (this.previouslySelectedObject) {
      const object = this.previouslySelectedObject;
      if (object instanceof Mesh) {
        const material = object.material;
        if (material instanceof Material) {
          material.transparent = false;
          material.opacity = 1; // Adjust the opacity as needed
          material.needsUpdate = true;
        }
      }
      this.previouslySelectedObject = null;
    }

    // Check for intersections
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (intersectedObject instanceof Mesh) {
        const material = intersectedObject.material;
        if (material instanceof Material) {
          material.transparent = true;
          material.opacity = 0.5; // Adjust the opacity as needed
          material.needsUpdate = true;
          this.previouslySelectedObject = intersectedObject;
        }
      }

      console.log('Clicked on object:', intersectedObject);
      console.log('Intersection details:', intersects[0]);
    } else {
      console.log('No objects intersected');
    }
  }

  private onViewerResize(entries: ResizeObserverEntry[]): void {
    if (!this.scene || !this.camera || !this.webGLRenderer || !this.css2DRenderer || !this.css3DRenderer) {
      throw new Error('viewer not properly initiated');
    }

    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      switch (this.camera.type) {
        case 'OrthographicCamera': {
          (this.camera as OrthographicCamera).left = width / -2;
          (this.camera as OrthographicCamera).right = width / 2;
          (this.camera as OrthographicCamera).top = height / 2;
          (this.camera as OrthographicCamera).bottom = height / -2;
          break;
        }
        case 'PerspectiveCamera': {
          (this.camera as PerspectiveCamera).aspect = width / height;
          break;
        }
        default: {
          break;
        }
      }
      this.camera.updateProjectionMatrix();
      this.webGLRenderer.setSize(width, height);
      this.css2DRenderer.setSize(width, height);
      this.css3DRenderer.setSize(width, height);
      this.webGLRenderer.render(this.scene, this.camera);
      this.css2DRenderer.render(this.scene, this.camera);
      this.css3DRenderer.render(this.scene, this.camera);
    }
  }

  private getScene(viewerConfig: ThreeViewerConfig): Scene {
    const scene = new Scene();
    scene.background = new Color(viewerConfig.scene?.backgroundColor || 'white');
    return scene;
  }

  private addLight(viewerConfig: ThreeViewerConfig): void {
    if (!this.scene) {
      throw new Error('Scene is required');
    }

    if (viewerConfig.light?.ambientLight?.enabled === false) {
      return;
    }

    const ambientLight = new AmbientLight(
      viewerConfig.light?.ambientLight?.color || 'white',
      viewerConfig.light?.ambientLight?.intensity || 1,
    );

    this.scene.add(ambientLight);
  }

  private addGrid(viewerConfig: ThreeViewerConfig): void {
    if (!this.scene) {
      throw new Error('Scene is required');
    }

    if (viewerConfig.grid?.enabled === false) {
      return;
    }
    const advancedGrid = new AdvancedGrid(
      viewerConfig.grid?.size || 100_000,
      viewerConfig.grid?.primaryStepSize || 10_000,
      viewerConfig.grid?.secondaryStepSize || 1000,
      new Color(viewerConfig.grid?.primaryColor || 'black'),
      new Color(viewerConfig.grid?.secondaryColor || '#f3f3f3'),
    );

    // add the grid to the scene
    //this.scene.add(grid);
    this.scene.add(advancedGrid);
  }

  private addAxesHelper(viewerConfig: ThreeViewerConfig): void {
    if (!this.scene) {
      throw new Error('Scene is required');
    }

    if (viewerConfig.axesHelper?.enabled === false) {
      return;
    }

    const axesHelper = new AxesHelper(viewerConfig.axesHelper?.size || 1);
    this.scene.add(axesHelper);
  }

  private addMapImage(viewerConfig: ThreeViewerConfig): void {
    if (!viewerConfig.mapImage) {
      return;
    }

    //TODO LOAD PNG from web

    // Load PNG texture
    const textureLoader = new TextureLoader();
    textureLoader.load(viewerConfig.mapImage.url, (texture) => {
      if (!this.scene) {
        throw new Error('Scene is required');
      }

      if (!viewerConfig.mapImage) {
        return;
      }

      // Create a plane geometry
      const planeGeometry = new PlaneGeometry(viewerConfig.mapImage.size.width, viewerConfig.mapImage?.size.height); // Adjust size as needed
      const planeMaterial = new MeshBasicMaterial({ map: texture });
      const plane = new Mesh(planeGeometry, planeMaterial);

      // Position the plane
      const planeOriginX = viewerConfig.mapImage.position.x + viewerConfig.mapImage.size.width / 2;
      const planeOriginY = viewerConfig.mapImage.position.y + viewerConfig.mapImage.size.height / 2;
      plane.position.set(planeOriginX, viewerConfig.mapImage.position.z, -planeOriginY);
      plane.rotation.x = -Math.PI / 2; // Rotate to lie flat on the X-Z plane

      // Add the plane to the scene
      this.scene.add(plane);
    });
  }

  public add3DObjects(objects: Object3D[]): void {
    if (!this.viewerInitiated) {
      this.objectsToAdd.push(...objects);
      return;
    }
    if (!this.scene) {
      throw new Error('Scene is required');
    }
    this.scene.add(...objects);
  }

  public get3DObject(name: string): Object3D | undefined {
    return this.scene?.getObjectByName(name);
  }

  public move3DObject(object3DId: string, targetX: number, targetY: number, targetZ: number): void {
    if (!this.viewerInitiated) {
      this.tweensToAdd.push({ id: object3DId, x: targetX, y: targetY, z: targetZ });
      return;
    }
    const object3D = this.get3DObject(object3DId);
    if (!object3D) {
      console.log(`Object with id ${object3DId} not found`);
      return;
    }
    const tween = new Tween(object3D.position);
    const startPosition = new Vector3();
    const endPosition = new Vector3(targetX, targetZ, -targetY);
    object3D.getWorldPosition(startPosition);
    if (endPosition.equals(startPosition)) {
      return;
    }
    tween.to(endPosition, 5000).easing(Easing.Sinusoidal.InOut);
    tween.start();
    this.tweenGroup?.add(tween);
  }

  private getWebGlRenderer(): WebGLRenderer {
    if (!this.webGLCanvas) {
      throw new Error('WebGL canvas is required');
    }
    if (!this.threeViewerRoot) {
      throw new Error('Three viewer root is required');
    }
    const renderer = new WebGLRenderer({
      canvas: this.webGLCanvas,
      antialias: true,
    });
    renderer.setSize(this.threeViewerRoot.offsetWidth, this.threeViewerRoot.offsetHeight);
    return renderer;
  }

  private getCss2DRenderer(): CSS2DRenderer {
    const css2dDiv = document.querySelector('#css2d-div') as HTMLDivElement;
    if (!this.threeViewerRoot) {
      throw new Error('Three viewer root is required');
    }
    if (!css2dDiv) {
      throw new Error('CSS2D div is required');
    }
    const renderer = new CSS2DRenderer({ element: css2dDiv });

    renderer.setSize(this.threeViewerRoot.offsetWidth, this.threeViewerRoot.offsetHeight);
    return renderer;
  }

  private getCss3DRenderer(): CSS3DRenderer {
    if (!this.threeViewerRoot) {
      throw new Error('Three viewer root is required');
    }
    if (!this.css3dDiv) {
      throw new Error('CSS3D div is required');
    }
    const renderer = new CSS3DRenderer({ element: this.css3dDiv });

    renderer.setSize(this.threeViewerRoot.offsetWidth, this.threeViewerRoot.offsetHeight);
    return renderer;
  }

  private getCamera(viewerConfig: ThreeViewerConfig): PerspectiveCamera | OrthographicCamera {
    let camera: PerspectiveCamera | OrthographicCamera;
    if (!this.threeViewerRoot) {
      throw new Error('Three viewer root is required');
    }
    switch (viewerConfig.camera?.type) {
      case 'perspective': {
        const cameraSettings = viewerConfig.camera?.cameraSettings as PerspectiveCameraConfig | undefined;
        camera = new PerspectiveCamera(
          cameraSettings?.fov || 45,
          this.threeViewerRoot.offsetWidth / this.threeViewerRoot.offsetHeight,
          cameraSettings?.near || 1,
          cameraSettings?.far || 100_000,
        );
        break;
      }
      case 'orthographic': {
        const orthoCameraSettings = viewerConfig.camera?.cameraSettings as OrthographicCameraConfig | undefined;
        camera = new OrthographicCamera(
          this.threeViewerRoot.offsetWidth / -2,
          this.threeViewerRoot.offsetWidth / 2,
          this.threeViewerRoot.offsetHeight / 2,
          this.threeViewerRoot.offsetHeight / -2,
          orthoCameraSettings?.near || 0,
          orthoCameraSettings?.far || 100_000,
        );
        break;
      }
      default: {
        camera = new OrthographicCamera(
          this.threeViewerRoot.offsetWidth / -2,
          this.threeViewerRoot.offsetWidth / 2,
          this.threeViewerRoot.offsetHeight / 2,
          this.threeViewerRoot.offsetHeight / -2,
          0,
          100_000,
        );
        break;
      }
    }
    camera.updateProjectionMatrix();
    return camera;
  }

  private getControls(viewerConfig: ThreeViewerConfig): OrbitControls | MapControls | undefined {
    let controls: OrbitControls | MapControls;

    if (!viewerConfig.controls) {
      return;
    }
    if (!this.camera) {
      throw new Error('Camera is required');
    }
    if (!this.css3dDiv) {
      throw new Error('CSS3D div is required');
    }

    switch (viewerConfig.controls?.type) {
      case 'map': {
        controls = new MapControls(this.camera, this.css3dDiv);
        controls.enablePan = true;
        controls.enableRotate = false;
        break;
      }
      case 'orbit': {
        controls = new OrbitControls(this.camera, this.css3dDiv);
        controls.maxPolarAngle = Math.PI / 2;
        break;
      }
      default: {
        controls = new OrbitControls(this.camera, this.css3dDiv);
      }
    }

    controls.zoomToCursor = viewerConfig?.controls?.zoomToCursor || true;
    controls.enableDamping = viewerConfig?.controls?.enableDamping || true;
    controls.zoomSpeed = viewerConfig?.controls?.zoomSpeed || 2;
    controls.update();
    return controls;
  }

  private setInitialCameraAndControlProperties(viewerConfig: ThreeViewerConfig): void {
    if (!this.camera) {
      throw new Error('Camera is required');
    }

    // POSITION
    // if an initial position is provided, use this first
    if (viewerConfig.camera?.initialPosition) {
      this.camera.position.set(
        viewerConfig.camera.initialPosition.x,
        viewerConfig.camera.initialPosition.z,
        -viewerConfig.camera.initialPosition.y,
      );
      this.camera.lookAt(viewerConfig.camera.initialPosition.x, 0, -viewerConfig.camera.initialPosition.y);
      if (this.controls) {
        this.controls.target.set(viewerConfig.camera.initialPosition.x, 0, -viewerConfig.camera.initialPosition.y);
      }
      // else, if a map image is provided, center the camera on the map
    } else if (viewerConfig.mapImage) {
      const mapCenterX = viewerConfig.mapImage.position.x + viewerConfig.mapImage.size.width / 2;
      const mapCenterY = viewerConfig.mapImage.position.y + viewerConfig.mapImage.size.height / 2;
      this.camera.position.x = mapCenterX;
      this.camera.position.y = viewerConfig.mapImage.position.z + viewerConfig.mapImage.cameraDistance;
      this.camera.position.z = -mapCenterY;

      this.camera.lookAt(mapCenterX, viewerConfig.mapImage.position.z, -mapCenterY);
      if (this.controls) {
        this.controls?.target.set(mapCenterX, viewerConfig.mapImage.position.z, -mapCenterY);
      }
    } else {
      this.camera.position.set(0, 1, 0);
      this.camera.lookAt(0, 0, 0);
    }

    // ZOOM
    // if it is an orthographic camera, control zoom by setting the camera's zoom property
    if (this.camera instanceof OrthographicCamera) {
      // if the ortho camera has an initial zoom, use this first
      const initialZoom = (viewerConfig.camera?.cameraSettings as OrthographicCameraConfig)?.initialZoom;
      if (initialZoom) {
        this.camera.zoom = initialZoom;
      }
      // else, if there is a map image, calculate the zoom factor to fit it to screen
      else if (viewerConfig.mapImage) {
        const cameraWidth = this.camera.right - this.camera.left;
        const cameraHeight = this.camera.top - this.camera.bottom;
        const zoomX = cameraWidth / (viewerConfig.mapImage.size.width + 2 * viewerConfig.mapImage.offset);
        const zoomY = cameraHeight / (viewerConfig.mapImage.size.height + 2 * viewerConfig.mapImage.offset);
        this.camera.zoom = Math.min(zoomX, zoomY);
        if (viewerConfig.mapImage.applyMapLimits) {
          this.minMapZoom = this.camera.zoom;
        }
      } else {
        this.camera.zoom = 1;
      }
      // else, if it is a perspective camera, control zoom by setting the camera's Y coordinate
    } else if (this.camera instanceof PerspectiveCamera) {
      // if there is map image, and the initial zoom has not been explicitly set, calculate the distance required to fit the content height
      if (viewerConfig.mapImage && !viewerConfig.camera?.initialPosition?.z) {
        const contentAspect =
          (viewerConfig.mapImage.size.width + 2 * viewerConfig.mapImage.offset) /
          (viewerConfig.mapImage.size.height + 2 * viewerConfig.mapImage.offset);
        const screenAspect = this.camera.aspect;

        const fitHeight = contentAspect > screenAspect
          ? (viewerConfig.mapImage.size.width + 2 * viewerConfig.mapImage.offset) / screenAspect
          : viewerConfig.mapImage.size.height + 2 * viewerConfig.mapImage.offset;

        // Calculate the distance required to fit the content height
        const fitDistance = fitHeight / (2 * Math.tan(MathUtils.degToRad(this.camera.fov / 2)));
        this.camera.position.y = viewerConfig.mapImage.position.z + fitDistance;
      }
    } else {
      throw new TypeError('Unsupported camera type');
    }

    this.camera.updateProjectionMatrix();
    if (this.controls) {
      this.controls.update();
    }
  }

  // private applyMapLimits(): void {
  //   if (!this.camera || !this.maxMapZoom) {
  //     return;
  //   }
  //   if (this.camera.zoom > this.maxMapZoom) {
  //     this.camera.zoom = this.maxMapZoom;
  //     this.camera.updateProjectionMatrix
  // }
}
