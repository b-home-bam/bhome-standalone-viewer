//import { ThreeViewerConfig } from 'libs/shared/angular/ui/v2/three-viewer/src/lib/interfaces/three-viewer-config.interface';
import { ThreeViewerConfig } from '../../three-viewer/interfaces/three-viewer-config.interface';

export interface WorkStationsDashboardConfig {
  id: string;
  workStations: WorkStationsDashboardWorkStation[];
  zones: WorkStationsDashboardZone[];
  viewerConfig?: ThreeViewerConfig;
  uiScale?: number;
  widgetOffset?: number;
}

export interface WorkStationsDashboardWorkStation {
  id: string;
  checkinZoneId: string;
  checkoutZoneId: string;
  showTimer: boolean;
  targetTime: number; // seconds
  length: number; // mm
  width: number; // mm
  height: number; // mm
  position: Position;
  rotation?: number; //radians
}

export interface WorkStationsDashboardZone {
  id: string;
  name: string;
  color: string;
  workStations: string[];
}

export interface Position {
  x: number; // mm
  y: number; // mm
  z: number; // mm
}
