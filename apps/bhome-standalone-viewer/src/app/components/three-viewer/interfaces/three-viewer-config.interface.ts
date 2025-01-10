export interface ThreeViewerConfig {
  scene?: {
    backgroundColor?: string;
  };
  light?: {
    ambientLight?: {
      enabled?: boolean;
      color?: string;
      intensity?: number;
    };
  };
  grid?: {
    enabled?: boolean;
    size?: number;
    primaryStepSize?: number;
    secondaryStepSize?: number;
    primaryColor?: string;
    secondaryColor?: string;
  };
  axesHelper?: {
    enabled?: boolean;
    size?: number;
  };
  camera?: {
    type: 'perspective' | 'orthographic';
    initialPosition?: {
      x: number;
      y: number;
      z: number;
    };
    cameraSettings?: OrthographicCameraConfig | PerspectiveCameraConfig;
    displayCameraProperties?: boolean;
  };
  controls?: {
    type: 'orbit' | 'map';
    orbitControlSettings?: OrbitControlsSettings;
    zoomSpeed?: number;
    zoomToCursor?: boolean;
    enableDamping?: boolean;
  };
  mapImage?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    size: {
      width: number;
      height: number;
    };
    cameraDistance: number;
    offset: number;
    url: string;
    applyMapLimits?: boolean;
  };
}

export interface OrthographicCameraConfig {
  near?: number;
  far?: number;
  initialZoom?: number;
}
export interface PerspectiveCameraConfig {
  fov?: number;
  near?: number;
  far?: number;
}

export interface OrbitControlsSettings {
  enablePan?: boolean;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}
