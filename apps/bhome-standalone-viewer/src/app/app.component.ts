import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { ThreeViewerComponent } from "./components/three-viewer/three-viewer.component";
import { ThreeViewerConfig } from './components/three-viewer/interfaces/three-viewer-config.interface';
import { WorkStationsDashboardComponent } from "./components/dashboard/work-stations-dashboard.component";

@Component({
  imports: [NxWelcomeComponent, RouterModule, ThreeViewerComponent, WorkStationsDashboardComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected config: ThreeViewerConfig = {
    camera: {
      type: 'perspective',
      cameraSettings: {
        near: 1000,
        far: 1_000_000,
      },
      displayCameraProperties: false,
    },
    scene: {
      backgroundColor: 'white',
    },
    grid: {
      enabled: false,
      size: 100_000,
      primaryStepSize: 10_000,
      secondaryStepSize: 1000,
      primaryColor: '#a8a8a8',
      secondaryColor: '#efefef',
    },
    axesHelper: {
      enabled: false,
      size: 2000,
    },
    controls: {
      type: 'orbit',
    },
    light: {
      ambientLight: {
        enabled: true,
        color: 'white',
        intensity: 10,
      },
    },
    mapImage: {
      position: {
        x: 0,
        y: 0,
        z: -10,
      },
      cameraDistance: 10_000,
      size: {
        width: 100_000,
        height: 30_562,
      },
      offset: 500,
      url: 'assets/factory-layout.png',
    },
  };
  title = 'bhome-standalone-viewer';
}
