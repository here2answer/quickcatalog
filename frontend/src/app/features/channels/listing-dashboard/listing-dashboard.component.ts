import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChannelService } from '../services/channel.service';
import { ToastService } from '../../../core/services/toast.service';
import { Channel } from '../../../core/models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-listing-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink, LoadingSkeletonComponent],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Listings Overview</h1>
          <p class="text-sm text-gray-500 mt-1">Overview of all product listings across channels</p>
        </div>
        <a routerLink="/channels" class="text-sm text-emerald-600 hover:text-emerald-500 font-medium">Manage Channels</a>
      </div>

      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="5"></app-loading-skeleton>
      </div>

      <!-- Summary cards -->
      <div *ngIf="!loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-500 uppercase mb-1">Total Channels</p>
          <p class="text-2xl font-bold text-gray-900">{{ channels.length }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-500 uppercase mb-1">Total Live</p>
          <p class="text-2xl font-bold text-green-600">{{ totalLive }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-500 uppercase mb-1">Total Pending</p>
          <p class="text-2xl font-bold text-yellow-600">{{ totalPending }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-500 uppercase mb-1">Total Errors</p>
          <p class="text-2xl font-bold text-red-600">{{ totalErrors }}</p>
        </div>
      </div>

      <!-- Per-channel breakdown -->
      <div *ngIf="!loading && channels.length > 0" class="bg-white rounded-xl border border-gray-200">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Live</th>
              <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th class="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Errors</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Last Synced</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ch of channels" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 font-medium text-gray-900">{{ ch.channelName }}</td>
              <td class="py-3 px-4 text-gray-500">{{ ch.channelType }}</td>
              <td class="py-3 px-4 text-center text-green-600 font-medium">{{ ch.liveListings }}</td>
              <td class="py-3 px-4 text-center text-yellow-600 font-medium">{{ ch.pendingListings }}</td>
              <td class="py-3 px-4 text-center text-red-600 font-medium">{{ ch.errorListings }}</td>
              <td class="py-3 px-4 text-gray-500 text-xs">{{ ch.lastSyncedAt ? (ch.lastSyncedAt | date:'medium') : 'Never' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ListingDashboardComponent implements OnInit {
  private channelService = inject(ChannelService);
  private toast = inject(ToastService);

  channels: Channel[] = [];
  loading = true;
  totalLive = 0;
  totalPending = 0;
  totalErrors = 0;

  ngOnInit(): void {
    this.channelService.getChannels().subscribe({
      next: res => {
        this.channels = res.data || [];
        this.totalLive = this.channels.reduce((sum, c) => sum + c.liveListings, 0);
        this.totalPending = this.channels.reduce((sum, c) => sum + c.pendingListings, 0);
        this.totalErrors = this.channels.reduce((sum, c) => sum + c.errorListings, 0);
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load channels');
        this.loading = false;
      },
    });
  }
}
