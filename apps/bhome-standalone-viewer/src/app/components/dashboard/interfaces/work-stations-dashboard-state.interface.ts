import { WorkStationsDashboardConfig } from './work-stations-dashboard-config.interface';
import { WorkstationType } from '../ui/types/constants';

export interface OrganizationWorkStation {
  id?: string;
  guid: string;
  name: string;
  description: string;
  workStationType: string;
  organizationProductionLineId: string;
  organizationId: string;
  type: WorkstationType;
  organizationProductionLine?: {
    name: string;
    id: string;
  };
  organization?: {
    name: string;
    id: string;
  };
}

export interface ElementDetailsDto {
  elementType: string;
  id: string;
  readableId: string;
  locations?: { id: string; constructionNumber: string }[];
  rfid?: string;
  companySharedElementId?: string;
  projectId: string;
  project: { name: string; number: string };
  assemblyOrderIndex?: number;
  created: Date;
  firstCheckIn?: Date;
}

export interface WorkStationDashboardState {
  workStationsDashboardConfig: WorkStationsDashboardConfig | null;
  isLoading: boolean;
  workStationsWithStatus: OrganizationWorkStationWithStatus[];
  elementsWithStatus: ElementWithStatus[];
}
export interface OrganizationWorkStationWithStatus {
  organizationWorkStation: OrganizationWorkStation;
  failureMode: boolean;
  checkedInElement: ElementDetailsDto | null;
  checkinTime: Date | null;
  checkinOverdue: boolean;
}

export interface ElementWithStatus {
  element: ElementDetailsDto;
  geometry: {
    length: number;
    width: number;
    thickness: number;
  };
  zoneId?: string;
  position: { x: number; y: number; z: number };
  workStationId: string | null;
  checkedIn: boolean;
  checkinTime: Date | null;
  checkinOverdue: boolean;
}
