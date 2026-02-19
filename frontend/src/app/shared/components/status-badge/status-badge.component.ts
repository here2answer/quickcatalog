import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      [ngClass]="badgeClasses"
    >
      {{ displayLabel }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  get badgeClasses(): string {
    switch (this.status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  get displayLabel(): string {
    if (!this.status) return '';
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
}
