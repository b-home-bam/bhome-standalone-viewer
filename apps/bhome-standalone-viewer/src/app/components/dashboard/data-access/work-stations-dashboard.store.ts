import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { lastValueFrom } from 'rxjs';

import { WorkStationDashboardState } from '../interfaces/work-stations-dashboard-state.interface';

import { WorkStationsDashboardApiService } from './work-stations-dashboard-api.service';

const initialState: WorkStationDashboardState = {
  workStationsDashboardConfig: null,
  isLoading: false,
  workStationsWithStatus: [],
  elementsWithStatus: [],
};

export const workStationDashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, workStationsDashboardApiService = inject(WorkStationsDashboardApiService)) => ({
    async loadWorkStationDashboardConfig(dashboardId: string): Promise<void> {
      // start loading
      patchState(store, { isLoading: true });

      // get config
      const config = workStationsDashboardApiService.getWorkStationsDashboardConfig(dashboardId);
      if (!config) {
        patchState(store, { isLoading: false });
        return;
      }

      // get workstations with status
      const workStationsAndElements = workStationsDashboardApiService.getWorkStationsAndElementsWithStatus(config.workStations.map((ws) => ws.id));

      //patch the state
      patchState(store, {
        workStationsDashboardConfig: config,
        isLoading: false,
        workStationsWithStatus: workStationsAndElements.workStations,
        elementsWithStatus: workStationsAndElements.elements,
      });

      //work in progress
      for (const workStationWithStatus of store.workStationsWithStatus()) {
        if (
          workStationWithStatus.checkedInElement &&
          workStationWithStatus.checkinTime &&
          !workStationWithStatus.checkinOverdue
        ) {
          const workStationConfig = store
            .workStationsDashboardConfig()
            ?.workStations.find((ws) => ws.id === workStationWithStatus.organizationWorkStation.id);
          if (!workStationConfig) {
            continue;
          }
          const overdueInterval = calculateOverdueInterval(
            workStationWithStatus.checkinTime,
            workStationConfig.targetTime,
          );

          if (overdueInterval > 0) {
            setTimeout(() => {
              patchState(store, {
                workStationsWithStatus: store.workStationsWithStatus().map((ws) => {
                  if (ws.organizationWorkStation.id === workStationWithStatus.organizationWorkStation.id) {
                    return {
                      ...ws,
                      checkinOverdue: true,
                    };
                  }
                  return ws;
                }),
              });
            }, overdueInterval);
          }
        }
      }
    },
  })),
);

function calculateOverdueInterval(checkinTime: Date, targetTime: number): number {
  // Calculate the target time by adding targetTime (in seconds) to checkinTime
  const targetDate = new Date(checkinTime.getTime() + targetTime * 1000);

  // Get the current time
  const now = Date.now();

  // Calculate the difference in milliseconds
  const difference = targetDate.getTime() - now;

  return difference < 0 ? 0 : difference;
}
