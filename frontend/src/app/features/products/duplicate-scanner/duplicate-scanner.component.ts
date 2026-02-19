import { Component, inject } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { DuplicateGroup } from '../../../core/models';

@Component({
  selector: 'app-duplicate-scanner',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe, RouterLink],
  template: `
    <div class="p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <a routerLink="/products" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </a>
          <h1 class="text-2xl font-bold text-gray-900">Duplicate Detection</h1>
        </div>
        <button (click)="scan()" [disabled]="scanning"
                class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          {{ scanning ? 'Scanning...' : 'Scan Catalog' }}
        </button>
      </div>

      <!-- Results -->
      <div *ngIf="scanned && groups.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-lg font-medium text-gray-900">No duplicates found</p>
        <p class="text-sm text-gray-500 mt-1">Your catalog is clean!</p>
      </div>

      <div *ngIf="groups.length > 0" class="space-y-4">
        <p class="text-sm text-gray-500">Found {{ groups.length }} potential duplicate group(s)</p>

        <div *ngFor="let group of groups" class="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <!-- Source product -->
          <div class="bg-amber-50 px-5 py-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ group.productName }}</p>
              <p class="text-xs text-gray-500">SKU: {{ group.productSku || '-' }}</p>
            </div>
            <span class="text-xs font-medium text-amber-700">{{ group.matches.length }} match(es)</span>
          </div>

          <!-- Matches -->
          <div class="divide-y divide-gray-100">
            <div *ngFor="let match of group.matches" class="flex items-center justify-between px-5 py-3">
              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                      [class]="match.matchType === 'SKU_EXACT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'">
                  {{ match.matchType === 'SKU_EXACT' ? 'SKU Match' : 'Name Similar' }}
                </span>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ match.name }}</p>
                  <p class="text-xs text-gray-500">SKU: {{ match.sku || '-' }} &middot; {{ match.status }}</p>
                </div>
              </div>
              <a [routerLink]="['/products', match.id]"
                 class="text-sm text-emerald-600 hover:text-emerald-500 font-medium">
                View
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Not scanned yet -->
      <div *ngIf="!scanned && !scanning" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <p class="text-lg font-medium text-gray-700">Click "Scan Catalog" to find potential duplicates</p>
        <p class="text-sm text-gray-500 mt-1">Uses name similarity and SKU matching to detect duplicates</p>
      </div>
    </div>
  `,
})
export class DuplicateScannerComponent {
  private productService = inject(ProductService);
  private toast = inject(ToastService);

  groups: DuplicateGroup[] = [];
  scanning = false;
  scanned = false;

  scan(): void {
    this.scanning = true;
    this.productService.scanDuplicates().subscribe({
      next: (res) => {
        this.groups = res.data || [];
        this.scanning = false;
        this.scanned = true;
      },
      error: () => {
        this.scanning = false;
        this.toast.error('Scan failed');
      },
    });
  }
}
