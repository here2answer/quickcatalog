import { Component, Input, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublishingService } from '../../channels/services/publishing.service';
import { ChannelService } from '../../channels/services/channel.service';
import { ToastService } from '../../../core/services/toast.service';
import { Channel, ChannelListing } from '../../../core/models';
import { ChannelStatusBadgeComponent } from '../../../shared/components/channel-status-badge/channel-status-badge.component';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';

@Component({
  selector: 'app-product-channels',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe, DatePipe, FormsModule, ChannelStatusBadgeComponent, IndianCurrencyPipe],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900">Channel Listings</h3>
        <button *ngIf="!showPublish && availableChannels.length > 0"
                (click)="showPublish = true"
                class="text-sm font-medium text-emerald-600 hover:text-emerald-500">
          + Publish to Channel
        </button>
      </div>

      <!-- Publish panel -->
      <div *ngIf="showPublish" class="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <p class="text-sm font-medium text-gray-700 mb-2">Select channel to publish to:</p>
        <div class="flex flex-wrap gap-2 mb-3">
          <button *ngFor="let ch of availableChannels"
                  (click)="isComingSoon(ch) ? null : selectedChannel = ch"
                  [disabled]="isComingSoon(ch)"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium border transition relative"
                  [class.bg-emerald-600]="selectedChannel?.id === ch.id"
                  [class.text-white]="selectedChannel?.id === ch.id"
                  [class.border-emerald-600]="selectedChannel?.id === ch.id"
                  [class.border-gray-200]="selectedChannel?.id !== ch.id"
                  [class.text-gray-700]="selectedChannel?.id !== ch.id"
                  [class.hover:bg-gray-50]="selectedChannel?.id !== ch.id && !isComingSoon(ch)"
                  [class.opacity-60]="isComingSoon(ch)"
                  [class.cursor-not-allowed]="isComingSoon(ch)"
                  [title]="isComingSoon(ch) ? ch.channelType + ' integration is not yet available' : ''">
            {{ ch.channelName }}
            <span *ngIf="isComingSoon(ch)"
                  class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
              Coming Soon
            </span>
          </button>
        </div>
        <div *ngIf="selectedChannel" class="flex items-center gap-3">
          <div class="flex-1">
            <label class="text-xs text-gray-500">Channel Price (optional)</label>
            <input type="number" [(ngModel)]="publishPrice" step="0.01"
                   class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm mt-0.5">
          </div>
          <button (click)="publish()" [disabled]="publishing"
                  class="mt-4 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50">
            {{ publishing ? 'Publishing...' : 'Publish' }}
          </button>
          <button (click)="showPublish = false; selectedChannel = null"
                  class="mt-4 text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>
      </div>

      <!-- Listings table -->
      <div *ngIf="listings.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-2 text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th class="text-left py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="text-right py-2 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th class="text-left py-2 text-xs font-medium text-gray-500 uppercase">Last Synced</th>
              <th class="text-right py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let listing of listings; trackBy: trackById" class="border-b border-gray-50">
              <td class="py-2.5">
                <span class="font-medium text-gray-900">{{ listing.channelName }}</span>
                <span class="text-xs text-gray-400 ml-1">{{ listing.channelType }}</span>
              </td>
              <td class="py-2.5">
                <app-channel-status-badge [status]="listing.listingStatus"></app-channel-status-badge>
                <p *ngIf="listing.syncError" class="text-xs text-red-500 mt-0.5">{{ listing.syncError }}</p>
              </td>
              <td class="py-2.5 text-right">
                <span *ngIf="listing.channelPrice" class="text-gray-900">{{ listing.channelPrice | indianCurrency }}</span>
                <span *ngIf="!listing.channelPrice" class="text-gray-400">-</span>
              </td>
              <td class="py-2.5 text-gray-500 text-xs">
                {{ listing.lastSyncedAt ? (listing.lastSyncedAt | date:'short') : 'Never' }}
              </td>
              <td class="py-2.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button *ngIf="listing.listingStatus === 'LIVE'"
                          (click)="unpublish(listing)"
                          class="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Unpublish
                  </button>
                  <button *ngIf="listing.listingStatus !== 'LIVE' && listing.listingStatus !== 'PENDING'"
                          (click)="republish(listing)"
                          class="text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                    Publish
                  </button>
                  <button (click)="sync(listing)"
                          class="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Sync
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div *ngIf="listings.length === 0 && !showPublish" class="text-center py-6 text-sm text-gray-400">
        Not published to any channel yet.
      </div>
    </div>
  `,
})
export class ProductChannelsComponent implements OnInit {
  @Input() productId!: string;

  private publishingService = inject(PublishingService);
  private channelService = inject(ChannelService);
  private toast = inject(ToastService);

  listings: ChannelListing[] = [];
  allChannels: Channel[] = [];
  availableChannels: Channel[] = [];
  showPublish = false;
  selectedChannel: Channel | null = null;
  publishPrice: number | null = null;
  publishing = false;

  ngOnInit(): void {
    this.loadData();
  }

  trackById(index: number, item: ChannelListing): string {
    return item.id;
  }

  loadData(): void {
    this.channelService.getChannels().subscribe({
      next: res => {
        this.allChannels = (res.data || []).filter(c => c.active);
        this.refreshListings();
      },
    });
  }

  refreshListings(): void {
    this.publishingService.getListings(this.productId).subscribe({
      next: res => {
        this.listings = res.data || [];
        const listedChannelIds = new Set(this.listings.map(l => l.channelId));
        this.availableChannels = this.allChannels.filter(c => !listedChannelIds.has(c.id));
      },
    });
  }

  publish(): void {
    if (!this.selectedChannel) return;
    this.publishing = true;
    const data = this.publishPrice ? { channelPrice: this.publishPrice } : {};
    this.publishingService.publishProduct(this.productId, this.selectedChannel.id, data).subscribe({
      next: res => {
        this.toast.success('Published to ' + this.selectedChannel!.channelName);
        this.showPublish = false;
        this.selectedChannel = null;
        this.publishPrice = null;
        this.publishing = false;
        this.refreshListings();
      },
      error: () => {
        this.toast.error('Publish failed');
        this.publishing = false;
      },
    });
  }

  unpublish(listing: ChannelListing): void {
    this.publishingService.unpublishProduct(this.productId, listing.channelId).subscribe({
      next: () => {
        this.toast.success('Unpublished from ' + listing.channelName);
        this.refreshListings();
      },
      error: () => this.toast.error('Unpublish failed'),
    });
  }

  republish(listing: ChannelListing): void {
    this.publishingService.publishProduct(this.productId, listing.channelId, {}).subscribe({
      next: () => {
        this.toast.success('Re-published to ' + listing.channelName);
        this.refreshListings();
      },
      error: () => this.toast.error('Publish failed'),
    });
  }

  sync(listing: ChannelListing): void {
    this.publishingService.syncListing(this.productId, listing.id).subscribe({
      next: () => {
        this.toast.success('Synced');
        this.refreshListings();
      },
      error: () => this.toast.error('Sync failed'),
    });
  }

  private readonly COMING_SOON_TYPES = new Set(['AMAZON', 'FLIPKART', 'MEESHO', 'JIOMART']);

  isComingSoon(channel: Channel): boolean {
    return this.COMING_SOON_TYPES.has(channel.channelType);
  }
}
