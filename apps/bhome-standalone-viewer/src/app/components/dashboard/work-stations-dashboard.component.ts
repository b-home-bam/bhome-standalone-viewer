import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';

import { ThreeViewerComponent } from '../three-viewer/three-viewer.component';
import {  ThreeViewerHelper } from '../three-viewer/helpers/three-viewer.helper';

import { workStationDashboardStore } from './data-access/work-stations-dashboard.store';
import {
  WorkStationsDashboardConfig,
  WorkStationsDashboardWorkStation,
} from './interfaces/work-stations-dashboard-config.interface';
import {
  ElementWithStatus,
  OrganizationWorkStationWithStatus,
} from './interfaces/work-stations-dashboard-state.interface';
import { WorkStationDashboardWidgetComponent } from './ui/work-station-dashboard-widget/work-station-dashboard-widget.component';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'rnn-work-stations-dashboard',
  standalone: true,
  imports: [ThreeViewerComponent],
  templateUrl: './work-stations-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  styles: `
    #footer {
      display: none !important;
    }
  `,
})
// replace dashboardId with:   protected readonly dashboardId = input('123');
export class WorkStationsDashboardComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  protected readonly workStationsDashboardStore = inject(workStationDashboardStore);
  protected readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly dashboardId = input('123');
  protected viewer = viewChild(ThreeViewerComponent);
  protected dashboardPopulated = false;
  config = toObservable(this.workStationsDashboardStore.workStationsDashboardConfig);

  constructor() {
    effect(() => {
      this.populateDashboard(this.workStationsDashboardStore.workStationsDashboardConfig());
    });
    effect(() => {
      this.updateWorkStationsInViewer(this.workStationsDashboardStore.workStationsWithStatus());
    });
  }

  public ngOnInit() {
    this.workStationsDashboardStore.loadWorkStationDashboardConfig(this.dashboardId());
    this.config.subscribe((config) => {
      console.log('observed' + config);
    });
  }

  public ngAfterViewInit() {
    if (!this.viewer) {
      return;
    }
  }

  public onBackClick() {
    this.router.navigateByUrl('/manufacturing');
  }

  private populateDashboard(dashboardConfig: WorkStationsDashboardConfig | null) {
    if(this.dashboardPopulated) {
      return;
    }

    if(!dashboardConfig) {
      return;
    }
    const workStationsWithStatus = this.workStationsDashboardStore.workStationsWithStatus();
    const elementsWithStatus = this.workStationsDashboardStore.elementsWithStatus();
    if (!this.viewer) {
      throw new Error('Viewer is not found');
    }
    if (!dashboardConfig) {
      return;
    }

    this.addWorkStationsToViewer(dashboardConfig, workStationsWithStatus);
    this.addElementsToViewer(elementsWithStatus);
    this.dashboardPopulated = true;
  }

  private addWorkStationsToViewer(
    dashboardConfig: WorkStationsDashboardConfig,
    workStationsWithStatus: OrganizationWorkStationWithStatus[],
  ) {
    const workStationsConfigs = dashboardConfig.workStations;
    if (!workStationsConfigs) {
      return;
    }
    for (const workStationConfig of workStationsConfigs) {
      const workStationWithStatus = workStationsWithStatus.find(
        (ws) => ws.organizationWorkStation.id === workStationConfig.id,
      );
      if (!workStationWithStatus) {
        continue;
      }

      this.addWorkStationToViewer(workStationConfig, workStationWithStatus, dashboardConfig);
    }
  }

  private addWorkStationToViewer(
    workStationConfig: WorkStationsDashboardWorkStation,
    workStationWithStatus: OrganizationWorkStationWithStatus,
    dashboardConfig: WorkStationsDashboardConfig,
  ): void {
    // GEOMETRY
    const geometry = ThreeViewerHelper.getBeam(
      workStationConfig.length,
      workStationConfig.width,
      workStationConfig.height,
      this.getWorkStationColor(workStationWithStatus),
      workStationConfig.id,
    );

    // UI
    const uiScale = dashboardConfig.uiScale || 20;
    const widgetOffset = dashboardConfig.widgetOffset || 200;

    // create angular component
    const widgetComponent = this.viewContainerRef.createComponent(WorkStationDashboardWidgetComponent);
    widgetComponent.setInput('workStationWithStatus', workStationWithStatus);
    const widgetWidth = Math.floor(workStationConfig.length / uiScale);
    widgetComponent.setInput('widgetWidth', widgetWidth);

    // wrap angular component in a threejs CSS3DObject
    const widgetComponent3D = ThreeViewerHelper.getCSS3DObject(widgetComponent.location.nativeElement);

    // move the widget to center top of the beam and scale it
    const widgetComponentHeight = (widgetComponent.location.nativeElement as HTMLElement)?.offsetHeight || 40;
    const widgetY = workStationConfig.width + widgetOffset + (widgetComponentHeight / 2) * uiScale;
    ThreeViewerHelper.translate(widgetComponent3D, workStationConfig.length / 2, widgetY, workStationConfig.height);
    widgetComponent3D.rotateX(-Math.PI / 2);
    widgetComponent3D.scale.set(uiScale, uiScale, uiScale);

    // GROUP
    // group the beam and the UI component
    const group = ThreeViewerHelper.group([geometry, widgetComponent3D]);

    // move the group to the correct position
    ThreeViewerHelper.translate(
      group,
      workStationConfig.position.x,
      workStationConfig.position.y,
      workStationConfig.position.z,
    );

    // add the workStationGroup to the viewer
    this.viewer()?.add3DObjects([group]);
  }

  private addElementsToViewer(elementsWithStatus: ElementWithStatus[]) {
    for (const elementWithStatus of elementsWithStatus) {
      if (!elementWithStatus.element.id) {
        continue;
      }
      this.addElementToViewer(elementWithStatus);
    }
  }

  private addElementToViewer(elementWithStatus: ElementWithStatus) {
    const elementId = elementWithStatus.element.id;
    if (!elementId) {
      return;
    }

    const element3DObject = this.viewer()?.get3DObject(elementId);
    if (element3DObject) {
      //element is already added to the viewer
      return;
    }

    const geometry = ThreeViewerHelper.getBeam(
      elementWithStatus.geometry.length,
      elementWithStatus.geometry.width,
      elementWithStatus.geometry.thickness,
      '#c7b02c',
      elementId,
    );

    // GROUP
    // group the beam and the UI component
    const group = ThreeViewerHelper.group([geometry]);
    const groupId = `group-${elementId}`;
    group.name = groupId;

    // move the group to the correct position
    ThreeViewerHelper.translate(
      group,
      elementWithStatus.position.x,
      elementWithStatus.position.y,
      elementWithStatus.position.z,
    );

    // add the workStationGroup to the viewer
    this.viewer()?.add3DObjects([group]);

    this.viewer()?.move3DObject(groupId, 0, 0, 1000);
  }

  private updateWorkStationsInViewer(workStationsWithStatusses: OrganizationWorkStationWithStatus[]) {
    if (!this.dashboardPopulated) {
      return;
    }

    for (const workStationWithStatus of workStationsWithStatusses) {
      if (!workStationWithStatus.organizationWorkStation.id) {
        continue;
      }
      this.updateWorkStationInViewer(workStationWithStatus);
    }
  }

  private updateWorkStationInViewer(workStationWithStatus: OrganizationWorkStationWithStatus) {
    const workStationId = workStationWithStatus.organizationWorkStation.id;
    if (!workStationId) {
      return;
    }
    const workStationConfig = this.workStationsDashboardStore
      .workStationsDashboardConfig()
      ?.workStations.find((ws) => ws.id === workStationId);
    if (!workStationConfig) {
      return;
    }

    const beam = this.viewer()?.get3DObject(workStationId);
    if (!beam) {
      return;
    }

    const color = this.getWorkStationColor(workStationWithStatus);
    ThreeViewerHelper.updateColor(beam, color);
  }

  private getWorkStationColor(workStationWithStatus: OrganizationWorkStationWithStatus): string {
    let color = '#bfbfbf'; // grey
    if (workStationWithStatus.checkedInElement && workStationWithStatus.checkinOverdue) {
      color = '#f7d0d0'; // red
    } else if (workStationWithStatus.checkedInElement && !workStationWithStatus.checkinOverdue) {
      color = '#e6f5d7'; // green
    }
    return color;
  }
}
