import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { ProductService } from '../products/services/product.service';
import {
  DashboardSummary,
  RecentActivity,
  ProductListItem,
  CatalogHealth,
  ChannelStatus,
} from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriceDisplayComponent } from '../../shared/components/price-display/price-display.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { IndianCurrencyPipe } from '../../shared/pipes/indian-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    RouterLink,
    StatusBadgeComponent,
    PriceDisplayComponent,
    LoadingSkeletonComponent,
    IndianCurrencyPipe,
    RelativeTimePipe,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-1 text-sm text-gray-500">Overview of your product catalog</p>
        </div>
        <a
          routerLink="/products/new"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Product
        </a>
      </div>

      <!-- Stats Cards -->
      <div *ngIf="loadingSummary" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div *ngFor="let i of [1,2,3,4]; trackBy: trackByIndex" class="bg-white rounded-xl border border-gray-200 p-5">
          <app-loading-skeleton [lines]="2"></app-loading-skeleton>
        </div>
      </div>

      <div *ngIf="!loadingSummary && summary" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <!-- Total Products -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Products</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ summary.totalProducts }}</p>
            </div>
            <div class="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Active -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Active</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ summary.activeProducts }}</p>
            </div>
            <div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Drafts -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Drafts</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ summary.draftProducts }}</p>
            </div>
            <div class="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Low Stock -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Low Stock</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ summary.lowStockProducts }}</p>
            </div>
            <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div *ngIf="!loadingLowStock && lowStockProducts.length > 0" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Low Stock Alerts
            <span class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              {{ lowStockProducts.length }}
            </span>
          </h2>
        </div>
        <div class="bg-white rounded-xl border border-red-200 divide-y divide-gray-100">
          <div *ngFor="let product of lowStockProducts.slice(0, 5); trackBy: trackByProductId" class="flex items-center justify-between px-5 py-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                <p class="text-xs text-gray-500">SKU: {{ product.sku || '-' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-red-600">{{ product.currentStock ?? 0 }} left</p>
              <p class="text-xs text-gray-400">Threshold: {{ product.lowStockThreshold ?? 10 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Catalog Health & Channel Status -->
      <div *ngIf="!loadingHealth || !loadingChannels" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Catalog Health -->
        <div *ngIf="!loadingHealth && catalogHealth" class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-gray-900">Catalog Health</h2>
            <span class="text-2xl font-bold text-emerald-600">{{ catalogHealth.completenessPercent }}%</span>
          </div>
          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-500">Products with Images</span>
                <span class="font-medium text-gray-700">{{ catalogHealth.productsWithImages }}/{{ catalogHealth.totalProducts }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full"><div class="h-2 bg-emerald-500 rounded-full" [style.width.%]="healthPercent('images')"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-500">With Descriptions</span>
                <span class="font-medium text-gray-700">{{ catalogHealth.productsWithDescriptions }}/{{ catalogHealth.totalProducts }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full"><div class="h-2 bg-blue-500 rounded-full" [style.width.%]="healthPercent('descriptions')"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-500">With SEO</span>
                <span class="font-medium text-gray-700">{{ catalogHealth.productsWithSeo }}/{{ catalogHealth.totalProducts }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full"><div class="h-2 bg-amber-500 rounded-full" [style.width.%]="healthPercent('seo')"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-500">With HSN Code</span>
                <span class="font-medium text-gray-700">{{ catalogHealth.productsWithHsn }}/{{ catalogHealth.totalProducts }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full"><div class="h-2 bg-emerald-500 rounded-full" [style.width.%]="healthPercent('hsn')"></div></div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-500">With Barcode</span>
                <span class="font-medium text-gray-700">{{ catalogHealth.productsWithBarcode }}/{{ catalogHealth.totalProducts }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full"><div class="h-2 bg-violet-500 rounded-full" [style.width.%]="healthPercent('barcode')"></div></div>
            </div>
          </div>
        </div>

        <!-- Channel Status -->
        <div *ngIf="!loadingChannels && channelStatuses.length > 0" class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Channel Status</h2>
          <div class="space-y-3">
            <div *ngFor="let ch of channelStatuses" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ ch.channelName }}</p>
                <p class="text-xs text-gray-500">{{ ch.channelType }}</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-center">
                  <p class="text-sm font-bold text-emerald-600">{{ ch.liveCount }}</p>
                  <p class="text-xs text-gray-400">Live</p>
                </div>
                <div class="text-center">
                  <p class="text-sm font-bold text-yellow-600">{{ ch.pendingCount }}</p>
                  <p class="text-xs text-gray-400">Pending</p>
                </div>
                <div class="text-center">
                  <p class="text-sm font-bold text-red-600">{{ ch.errorCount }}</p>
                  <p class="text-xs text-gray-400">Error</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Products -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Recent Products</h2>
          <a routerLink="/products" class="text-sm font-medium text-emerald-600 hover:text-emerald-500">
            View all
          </a>
        </div>

        <div *ngIf="loadingProducts" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let i of [1,2,3]; trackBy: trackByIndex" class="bg-white rounded-xl border border-gray-200 p-4">
            <app-loading-skeleton [lines]="4"></app-loading-skeleton>
          </div>
        </div>

        <div *ngIf="!loadingProducts" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <a
            *ngFor="let product of recentProducts; trackBy: trackByProductId"
            [routerLink]="['/products', product.id, 'edit']"
            class="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
          >
            <!-- Thumbnail -->
            <div class="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                *ngIf="product.thumbnailUrl"
                [src]="product.thumbnailUrl"
                [alt]="product.name"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <svg *ngIf="!product.thumbnailUrl" class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <!-- Info -->
            <div class="p-4">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</h3>
                <app-status-badge [status]="product.status"></app-status-badge>
              </div>
              <p *ngIf="product.sku" class="text-xs text-gray-500 mt-1">SKU: {{ product.sku }}</p>
              <div class="mt-2">
                <app-price-display
                  [sellingPrice]="product.sellingPrice"
                  [mrp]="product.mrp"
                ></app-price-display>
              </div>
            </div>
          </a>
        </div>

        <div
          *ngIf="!loadingProducts && recentProducts.length === 0"
          class="text-center py-12 bg-white rounded-xl border border-gray-200"
        >
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p class="mt-2 text-sm text-gray-500">No products yet. Create your first product!</p>
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

        <div *ngIf="loadingActivity" class="bg-white rounded-xl border border-gray-200 p-4">
          <app-loading-skeleton [lines]="5"></app-loading-skeleton>
        </div>

        <div *ngIf="!loadingActivity && activities.length > 0" class="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div *ngFor="let activity of activities; trackBy: trackByActivityId" class="flex items-center gap-4 px-5 py-3.5">
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              [ngClass]="{
                'bg-green-100': activity.action === 'CREATED',
                'bg-blue-100': activity.action === 'UPDATED',
                'bg-red-100': activity.action === 'DELETED',
                'bg-yellow-100': activity.action === 'STATUS_CHANGED',
                'bg-gray-100': !['CREATED','UPDATED','DELETED','STATUS_CHANGED'].includes(activity.action)
              }"
            >
              <svg
                class="w-4 h-4"
                [ngClass]="{
                  'text-green-600': activity.action === 'CREATED',
                  'text-blue-600': activity.action === 'UPDATED',
                  'text-red-600': activity.action === 'DELETED',
                  'text-yellow-600': activity.action === 'STATUS_CHANGED',
                  'text-gray-600': !['CREATED','UPDATED','DELETED','STATUS_CHANGED'].includes(activity.action)
                }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path *ngIf="activity.action === 'CREATED'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                <path *ngIf="activity.action === 'UPDATED'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                <path *ngIf="activity.action === 'DELETED'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                <path *ngIf="activity.action === 'STATUS_CHANGED'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                <path *ngIf="!['CREATED','UPDATED','DELETED','STATUS_CHANGED'].includes(activity.action)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">
                <span class="font-medium capitalize">{{ activity.action?.toLowerCase()?.replace('_', ' ') }}</span>
                {{ activity.entityType?.toLowerCase() }}
                <span *ngIf="activity.details" class="text-gray-500">- {{ activity.details }}</span>
              </p>
            </div>
            <span class="text-xs text-gray-500 flex-shrink-0">{{ activity.createdAt | relativeTime }}</span>
          </div>
        </div>

        <div
          *ngIf="!loadingActivity && activities.length === 0"
          class="text-center py-8 bg-white rounded-xl border border-gray-200"
        >
          <p class="text-sm text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private productService = inject(ProductService);

  trackByProductId(index: number, item: any): string {
    return item.id;
  }

  trackByActivityId(index: number, item: any): string {
    return item.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  summary: DashboardSummary | null = null;
  recentProducts: ProductListItem[] = [];
  activities: RecentActivity[] = [];
  catalogHealth: CatalogHealth | null = null;
  channelStatuses: ChannelStatus[] = [];
  lowStockProducts: ProductListItem[] = [];

  loadingSummary = true;
  loadingProducts = true;
  loadingActivity = true;
  loadingHealth = true;
  loadingChannels = true;
  loadingLowStock = true;

  ngOnInit(): void {
    this.loadSummary();
    this.loadRecentProducts();
    this.loadRecentActivity();
    this.loadCatalogHealth();
    this.loadChannelStatus();
    this.loadLowStockProducts();
  }

  healthPercent(type: string): number {
    if (!this.catalogHealth || this.catalogHealth.totalProducts === 0) return 0;
    const total = this.catalogHealth.totalProducts;
    switch (type) {
      case 'images': return Math.round((this.catalogHealth.productsWithImages / total) * 100);
      case 'descriptions': return Math.round((this.catalogHealth.productsWithDescriptions / total) * 100);
      case 'seo': return Math.round((this.catalogHealth.productsWithSeo / total) * 100);
      case 'hsn': return Math.round((this.catalogHealth.productsWithHsn / total) * 100);
      case 'barcode': return Math.round((this.catalogHealth.productsWithBarcode / total) * 100);
      default: return 0;
    }
  }

  private loadSummary(): void {
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.summary = res.data;
        this.loadingSummary = false;
      },
      error: () => {
        this.loadingSummary = false;
      },
    });
  }

  private loadRecentProducts(): void {
    this.productService.getProducts({ page: 0, size: 6, sort: 'createdAt,desc' }).subscribe({
      next: (res) => {
        this.recentProducts = res.data.content;
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      },
    });
  }

  private loadRecentActivity(): void {
    this.dashboardService.getRecentActivity().subscribe({
      next: (res) => {
        this.activities = res.data;
        this.loadingActivity = false;
      },
      error: () => {
        this.loadingActivity = false;
      },
    });
  }

  private loadCatalogHealth(): void {
    this.dashboardService.getCatalogHealth().subscribe({
      next: (res) => {
        this.catalogHealth = res.data;
        this.loadingHealth = false;
      },
      error: () => {
        this.loadingHealth = false;
      },
    });
  }

  private loadChannelStatus(): void {
    this.dashboardService.getChannelStatus().subscribe({
      next: (res) => {
        this.channelStatuses = res.data || [];
        this.loadingChannels = false;
      },
      error: () => {
        this.loadingChannels = false;
      },
    });
  }

  private loadLowStockProducts(): void {
    this.productService.getLowStock().subscribe({
      next: (res) => {
        this.lowStockProducts = res.data || [];
        this.loadingLowStock = false;
      },
      error: () => {
        this.loadingLowStock = false;
      },
    });
  }
}
