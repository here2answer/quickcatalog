import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, JsonPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OndcService } from '../services/ondc.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { OndcOrderDetail } from '../../../core/models';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ondc-order-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, RouterLink, IndianCurrencyPipe, RelativeTimePipe, LoadingSkeletonComponent],
  template: `
    <div class="p-6 lg:p-8 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <a routerLink="/ondc/orders" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Orders
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="10"></app-loading-skeleton>
      </div>

      <div *ngIf="!loading && order">
        <!-- Order Header -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-xl font-bold text-gray-900">Order</h1>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="stateClass(order.state)">
                  {{ order.state }}
                </span>
              </div>
              <p class="text-sm font-mono text-gray-500">{{ order.becknOrderId }}</p>
              <p class="text-xs text-gray-400 mt-1">Created {{ order.createdAt | relativeTime }}</p>
            </div>
            <button *ngIf="order.state === 'CREATED' && isAdmin" (click)="acceptOrder()" [disabled]="accepting"
                    class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors">
              {{ accepting ? 'Accepting...' : 'Accept Order' }}
            </button>
          </div>
        </div>

        <!-- Billing Info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Billing Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-gray-500">Name</p>
              <p class="text-sm font-medium text-gray-900">{{ order.billingName || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Phone</p>
              <p class="text-sm text-gray-900">{{ order.billingPhone || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Email</p>
              <p class="text-sm text-gray-900">{{ order.billingEmail || '-' }}</p>
            </div>
          </div>
          <div *ngIf="order.billingAddress" class="mt-3">
            <p class="text-xs text-gray-500">Address</p>
            <p class="text-sm text-gray-900">
              {{ formatAddress(order.billingAddress) }}
            </p>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Order Items</h2>
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th class="text-left pb-2 text-xs font-medium text-gray-500">Product</th>
                <th class="text-right pb-2 text-xs font-medium text-gray-500">Qty</th>
                <th class="text-right pb-2 text-xs font-medium text-gray-500">Unit Price</th>
                <th class="text-right pb-2 text-xs font-medium text-gray-500">Tax</th>
                <th class="text-right pb-2 text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let item of order.items">
                <td class="py-2.5">
                  <p class="text-sm font-medium text-gray-900">{{ item.productName || item.productId }}</p>
                </td>
                <td class="py-2.5 text-right text-gray-700">{{ item.quantity }}</td>
                <td class="py-2.5 text-right text-gray-700">{{ item.unitPrice | indianCurrency }}</td>
                <td class="py-2.5 text-right text-gray-500">{{ item.taxAmount | indianCurrency }}</td>
                <td class="py-2.5 text-right font-medium text-gray-900">{{ item.totalAmount | indianCurrency }}</td>
              </tr>
            </tbody>
            <tfoot class="border-t border-gray-200">
              <tr>
                <td colspan="4" class="pt-3 text-right text-sm font-medium text-gray-700">Grand Total</td>
                <td class="pt-3 text-right text-base font-bold text-gray-900">{{ grandTotal | indianCurrency }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Fulfillment & Payment side by side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Fulfillment -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Fulfillment</h2>
            <div *ngIf="order.fulfillment; else noFulfillment" class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Type</span>
                <span class="text-sm font-medium text-gray-900">{{ order.fulfillment.type === 'SELF_PICKUP' ? 'Self Pickup' : 'Delivery' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">State</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="fulfillmentStateClass(order.fulfillment.state)">
                  {{ order.fulfillment.state }}
                </span>
              </div>
              <div *ngIf="order.fulfillment.agentName" class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Agent</span>
                <span class="text-sm text-gray-900">{{ order.fulfillment.agentName }} ({{ order.fulfillment.agentPhone }})</span>
              </div>
              <div *ngIf="order.fulfillment.trackingUrl" class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Tracking</span>
                <a [href]="order.fulfillment.trackingUrl" target="_blank" class="text-sm text-emerald-600 hover:text-emerald-500">Track Shipment</a>
              </div>
              <div *ngIf="order.fulfillment.deliveryAddress" class="pt-2 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-1">Delivery Address</p>
                <p class="text-sm text-gray-900">{{ formatAddress(order.fulfillment.deliveryAddress) }}</p>
              </div>
            </div>
            <ng-template #noFulfillment>
              <p class="text-sm text-gray-500">No fulfillment data available</p>
            </ng-template>
          </div>

          <!-- Payment -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Payment</h2>
            <div *ngIf="order.payment; else noPayment" class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Type</span>
                <span class="text-sm font-medium text-gray-900">{{ order.payment.type === 'PRE_PAID' ? 'Pre-paid' : order.payment.type === 'ON_DELIVERY' ? 'COD' : 'Post-fulfillment' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Collected By</span>
                <span class="text-sm text-gray-900">{{ order.payment.collectedBy || '-' }}</span>
              </div>
              <div *ngIf="order.payment.transactionId" class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Transaction ID</span>
                <span class="text-xs font-mono text-gray-700">{{ order.payment.transactionId }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Settlement</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="order.payment.settlementStatus === 'SETTLED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                  {{ order.payment.settlementStatus }}
                </span>
              </div>
              <div *ngIf="order.payment.buyerAppFinderFeeAmount" class="flex items-center justify-between">
                <span class="text-xs text-gray-500">BAP Finder Fee</span>
                <span class="text-sm text-gray-700">{{ order.payment.buyerAppFinderFeeAmount | indianCurrency }}</span>
              </div>
            </div>
            <ng-template #noPayment>
              <p class="text-sm text-gray-500">No payment data available</p>
            </ng-template>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !order" class="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p class="text-sm text-gray-500">Order not found</p>
      </div>
    </div>
  `,
})
export class OndcOrderDetailComponent implements OnInit {
  private ondcService = inject(OndcService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = true;
  accepting = false;
  order: OndcOrderDetail | null = null;

  get isAdmin(): boolean {
    return this.authService.hasMinRole('ADMIN');
  }

  get grandTotal(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ondcService.getOrder(id).subscribe({
        next: (res) => {
          this.order = res.data;
          this.loading = false;
        },
        error: () => this.loading = false,
      });
    } else {
      this.loading = false;
    }
  }

  acceptOrder(): void {
    if (!this.order) return;
    this.accepting = true;
    this.ondcService.acceptOrder(this.order.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.order = res.data;
          this.toast.success('Order accepted');
        } else {
          this.toast.error(res.message || 'Cannot accept this order');
        }
        this.accepting = false;
      },
      error: () => {
        this.accepting = false;
        this.toast.error('Failed to accept order');
      },
    });
  }

  formatAddress(addr: any): string {
    if (!addr) return '-';
    if (typeof addr === 'string') {
      try { addr = JSON.parse(addr); } catch { return addr; }
    }
    const parts = [addr.door, addr.building, addr.street, addr.locality, addr.city, addr.state, addr.area_code, addr.country].filter(Boolean);
    return parts.join(', ') || JSON.stringify(addr);
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

  fulfillmentStateClass(state: string): string {
    switch (state) {
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'PACKED': return 'bg-blue-100 text-blue-800';
      case 'AGENT_ASSIGNED':
      case 'PICKED_UP': return 'bg-yellow-100 text-yellow-800';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800';
      case 'ORDER_DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'RTO_INITIATED':
      case 'RTO_DELIVERED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
