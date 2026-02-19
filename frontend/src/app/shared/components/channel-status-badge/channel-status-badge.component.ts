import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { ListingStatus } from '../../../core/models';

@Component({
  selector: 'app-channel-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          [ngClass]="badgeClass">
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ label }}
    </span>
  `,
})
export class ChannelStatusBadgeComponent {
  @Input() status: ListingStatus = 'NOT_LISTED';

  get label(): string {
    const labels: Record<string, string> = {
      'NOT_LISTED': 'Not Listed',
      'PENDING': 'Pending',
      'LIVE': 'Live',
      'SUPPRESSED': 'Suppressed',
      'ERROR': 'Error',
    };
    return labels[this.status] || this.status;
  }

  get badgeClass(): string {
    const classes: Record<string, string> = {
      'NOT_LISTED': 'bg-gray-100 text-gray-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'LIVE': 'bg-green-100 text-green-700',
      'SUPPRESSED': 'bg-gray-100 text-gray-500',
      'ERROR': 'bg-red-100 text-red-700',
    };
    return classes[this.status] || 'bg-gray-100 text-gray-700';
  }

  get dotClass(): string {
    const classes: Record<string, string> = {
      'NOT_LISTED': 'bg-gray-400',
      'PENDING': 'bg-yellow-500',
      'LIVE': 'bg-green-500',
      'SUPPRESSED': 'bg-gray-400',
      'ERROR': 'bg-red-500',
    };
    return classes[this.status] || 'bg-gray-400';
  }
}
