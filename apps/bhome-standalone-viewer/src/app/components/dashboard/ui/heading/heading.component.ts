import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {Size} from '../types/constants';

@Component({
  selector: 'bh-heading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingComponent {
  @Input() size: Size = 'xl';
}
