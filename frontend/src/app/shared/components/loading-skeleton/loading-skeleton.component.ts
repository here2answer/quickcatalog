import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [NgFor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-pulse space-y-3">
      <div
        *ngFor="let line of linesArray; let i = index; trackBy: trackByIndex"
        class="h-4 bg-gray-200 rounded"
        [style.width]="getWidth(i)"
      ></div>
    </div>
  `,
})
export class LoadingSkeletonComponent {
  @Input() lines: number = 3;
  @Input() type: 'lines' | 'card' | 'table' = 'lines';

  get linesArray(): number[] {
    return Array.from({ length: this.lines }, (_, i) => i);
  }

  trackByIndex(index: number): number {
    return index;
  }

  getWidth(index: number): string {
    const widths = ['100%', '85%', '70%', '90%', '60%', '75%', '95%', '80%'];
    return widths[index % widths.length];
  }
}
