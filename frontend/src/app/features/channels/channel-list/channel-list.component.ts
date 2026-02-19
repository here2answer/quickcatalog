import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChannelService } from '../services/channel.service';
import { ToastService } from '../../../core/services/toast.service';
import { Channel, ChannelType } from '../../../core/models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, LoadingSkeletonComponent],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Channels</h1>
          <p class="text-sm text-gray-500 mt-1">Manage your sales channels and marketplace connections</p>
        </div>
        <a routerLink="/channels/new"
           class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Channel
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="5"></app-loading-skeleton>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && channels.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-1">No channels yet</h3>
        <p class="text-sm text-gray-500 mb-4">Connect your first sales channel to start publishing products.</p>
        <a routerLink="/channels/new" class="text-emerald-600 hover:text-emerald-500 text-sm font-medium">Add your first channel</a>
      </div>

      <!-- Channel cards -->
      <div *ngIf="!loading && channels.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let channel of channels; trackBy: trackById"
             class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                   [ngClass]="getChannelColor(channel.channelType)">
                {{ getChannelIcon(channel.channelType) }}
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ channel.channelName }}</h3>
                <p class="text-xs text-gray-500">{{ channel.channelType }}</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="channel.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ channel.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Listing counts -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="text-center p-2 bg-green-50 rounded-lg">
              <p class="text-lg font-bold text-green-600">{{ channel.liveListings }}</p>
              <p class="text-xs text-gray-500">Live</p>
            </div>
            <div class="text-center p-2 bg-yellow-50 rounded-lg">
              <p class="text-lg font-bold text-yellow-600">{{ channel.pendingListings }}</p>
              <p class="text-xs text-gray-500">Pending</p>
            </div>
            <div class="text-center p-2 bg-red-50 rounded-lg">
              <p class="text-lg font-bold text-red-600">{{ channel.errorListings }}</p>
              <p class="text-xs text-gray-500">Errors</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button (click)="testConnection(channel)"
                    [disabled]="testingId === channel.id"
                    class="flex-1 text-center text-xs font-medium py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {{ testingId === channel.id ? 'Testing...' : 'Test Connection' }}
            </button>
            <a [routerLink]="['/channels', channel.id, 'edit']"
               class="text-xs font-medium py-1.5 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
              Edit
            </a>
            <button (click)="deleteChannel(channel)"
                    class="text-xs font-medium py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ChannelListComponent implements OnInit {
  private channelService = inject(ChannelService);
  private toast = inject(ToastService);

  channels: Channel[] = [];
  loading = true;
  testingId: string | null = null;

  ngOnInit(): void {
    this.loadChannels();
  }

  trackById(index: number, item: Channel): string {
    return item.id;
  }

  loadChannels(): void {
    this.channelService.getChannels().subscribe({
      next: res => {
        this.channels = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load channels');
        this.loading = false;
      },
    });
  }

  testConnection(channel: Channel): void {
    this.testingId = channel.id;
    this.channelService.testConnection(channel.id).subscribe({
      next: res => {
        if (res.data.success) {
          this.toast.success(res.data.message);
        } else {
          this.toast.error(res.data.message);
        }
        this.testingId = null;
      },
      error: () => {
        this.toast.error('Connection test failed');
        this.testingId = null;
      },
    });
  }

  deleteChannel(channel: Channel): void {
    if (!confirm('Delete channel "' + channel.channelName + '"? This will remove all associated listings.')) return;
    this.channelService.deleteChannel(channel.id).subscribe({
      next: () => {
        this.channels = this.channels.filter(c => c.id !== channel.id);
        this.toast.success('Channel deleted');
      },
      error: () => this.toast.error('Failed to delete channel'),
    });
  }

  getChannelColor(type: ChannelType): string {
    const colors: Record<string, string> = {
      'ONDC': 'bg-blue-600',
      'AMAZON': 'bg-orange-500',
      'FLIPKART': 'bg-yellow-500',
      'MEESHO': 'bg-pink-500',
      'JIOMART': 'bg-blue-500',
      'WEBSITE': 'bg-purple-500',
      'CUSTOM': 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  }

  getChannelIcon(type: ChannelType): string {
    const icons: Record<string, string> = {
      'ONDC': 'ON',
      'AMAZON': 'AZ',
      'FLIPKART': 'FK',
      'MEESHO': 'MS',
      'JIOMART': 'JM',
      'WEBSITE': 'WB',
      'CUSTOM': 'CU',
    };
    return icons[type] || type.substring(0, 2);
  }
}
