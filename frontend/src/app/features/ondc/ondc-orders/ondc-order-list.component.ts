import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OndcService } from '../services/ondc.service';
import { OndcOrderListItem, PagedResponse } from '../../../core/models';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ondc-order-list',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, FormsModule, IndianCurrencyPipe, RelativeTimePipe, LoadingSkeletonComponent],
  template: `
    <div class="p-6 lg:p-8 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <a routerLink="/ondc" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to ONDC
        </a>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">ONDC Orders</h1>
            <p class="mt-1 text-sm text-gray-500">Orders received from buyer apps on the ONDC network</p>
          </div>
          <select [(ngModel)]="stateFilter" (ngModelChange)="loadOrders()"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="">All States</option>
            <option value="CREATED">Created</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="8"></app-loading-skeleton>
      </div>

      <!-- Orders Table -->
      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table *ngIf="orders.length > 0" class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let order of orders; trackBy: trackById"
                class="hover:bg-gray-50 cursor-pointer"
                [routerLink]="['/ondc/orders', order.id]">
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900 font-mono">{{ order.becknOrderId | slice:0:12 }}...</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-gray-900">{{ order.buyerName || '-' }}</p>
                <p class="text-xs text-gray-500">{{ order.buyerPhone || '' }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ order.itemCount }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                {{ order.totalAmount ? (order.totalAmount | indianCurrency) : '-' }}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="stateClass(order.state)">
                  {{ order.state }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-gray-500">{{ order.createdAt | relativeTime }}</td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="orders.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="mt-2 text-sm text-gray-500">No orders{{ stateFilter ? ' with state "' + stateFilter + '"' : '' }} yet</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p class="text-xs text-gray-500">
            Page {{ currentPage + 1 }} of {{ totalPages }} ({{ totalElements }} orders)
          </p>
          <div class="flex gap-2">
            <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0"
                    class="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50">
              Previous
            </button>
            <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= totalPages - 1"
                    class="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OndcOrderListComponent implements OnInit {
  private ondcService = inject(OndcService);

  loading = true;
  orders: OndcOrderListItem[] = [];
  stateFilter = '';
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  trackById(index: number, item: any): string { return item.id; }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.ondcService.listOrders({
      state: this.stateFilter || undefined,
      page: this.currentPage,
      size: 20,
    }).subscribe({
      next: (res) => {
        this.orders = res.data.content;
        this.totalPages = res.data.totalPages;
        this.totalElements = res.data.totalElements;
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      },
    });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  stateClass(state: string): string {
    switch (state) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'RETURNED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
