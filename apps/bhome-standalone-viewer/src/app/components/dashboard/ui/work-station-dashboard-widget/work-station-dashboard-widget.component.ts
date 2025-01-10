import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, effect, input, untracked, ViewChild } from '@angular/core';

import { HeadingComponent } from '../heading/heading.component';
import { TimerComponent } from '../timer/timer.component';

import { OrganizationWorkStationWithStatus } from '../../interfaces/work-stations-dashboard-state.interface';

@Component({
  selector: 'rnn-work-station-dashboard-widget',
  host: { '[style.width]': `widgetWidth() +"px"` },
  standalone: true,
  imports: [
    CommonModule,
    HeadingComponent,
    TimerComponent,
  ],
  templateUrl: './work-station-dashboard-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkStationDashboardWidgetComponent implements AfterViewInit {
  readonly workStationWithStatus = input<OrganizationWorkStationWithStatus>();
  readonly widgetWidth = input<number>(300);
  @ViewChild('timer') timerComponent!: TimerComponent;

  constructor() {
    effect(() => {
      untracked(() => {
        const status = this.workStationWithStatus();
        if (this.timerComponent && status?.checkedInElement && status?.checkinTime) {
          this.timerComponent.reset(this.calculateElapsedSeconds(status.checkinTime));
          this.timerComponent.start();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    const status = this.workStationWithStatus();
    if (status?.checkinTime && status?.checkedInElement) {
      this.timerComponent.reset(this.calculateElapsedSeconds(status.checkinTime));
      this.timerComponent.start();
    }
  }

  protected onClick(): void {
    console.log('Clicked');
  }

  private calculateElapsedSeconds(inputTime: Date): number {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
    const inputTimeInseconds = Math.floor(inputTime.getTime() / 1000);
    return currentTimeInSeconds - inputTimeInseconds; // Elapsed time in seconds
  }
}
