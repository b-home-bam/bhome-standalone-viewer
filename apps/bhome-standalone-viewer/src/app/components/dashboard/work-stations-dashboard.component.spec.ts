import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkStationsDashboardComponent } from './work-stations-dashboard.component';

describe('WorkStationsDashboardComponent', () => {
  let component: WorkStationsDashboardComponent;
  let fixture: ComponentFixture<WorkStationsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkStationsDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkStationsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
