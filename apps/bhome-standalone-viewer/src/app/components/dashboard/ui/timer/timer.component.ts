import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, interval, map, Subscription } from 'rxjs';

@Component({
  selector: 'bh-timer',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  templateUrl: './timer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerComponent implements OnInit {
  readonly countDown = input(false);
  readonly startTime = input(0);
  readonly startOnInit = input(true);
  readonly appearance = input<'light' | 'dark' | 'danger'>('dark');

  private readonly destroyRef = inject(DestroyRef);

  private elapsedTimeSubject = new BehaviorSubject<number>(0);
  private timerSubscription!: Subscription;
  private isRunning = false;

  readonly elapsedTime: Signal<number> = toSignal(this.elapsedTimeSubject.asObservable(), {
    initialValue: 0,
  });

  readonly formattedTime$ = this.elapsedTimeSubject.asObservable().pipe(map((time) => this.formatTime(time)));

  ngOnInit(): void {
    this.elapsedTimeSubject.next(this.startTime());
    if (this.startOnInit()) {
      this.start();
    }
  }

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.timerSubscription = interval(1000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const currentTime = this.elapsedTimeSubject.value;
          const updatedTime = this.countDown() ? currentTime - 1 : currentTime + 1;
          if (this.countDown() && updatedTime < 0) {
            this.reset(0); // Stop timer when it reaches 0
          } else {
            this.elapsedTimeSubject.next(updatedTime);
          }
        });
    }
  }

  public pause(): void {
    this.stop();
  }

  public reset(startTime: number = this.startTime()): void {
    this.stop();
    this.elapsedTimeSubject.next(startTime);
  }

  private stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
    }
  }

  private formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}
