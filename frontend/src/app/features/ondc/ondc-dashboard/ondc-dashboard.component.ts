import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OndcService } from '../services/ondc.service';
import { OndcSubscriber, OndcProductConfig, RegistrationStatus } from '../../../core/models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ondc-dashboard',
  standalone: true,
  imports: [NgIf, NgClass, RouterLink, LoadingSkeletonComponent],
  template: `
    <div class="p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">ONDC Network</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your presence on the Open Network for Digital Commerce</p>
      </div>

      <!-- Setup Status -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <app-loading-skeleton [lines]="3"></app-loading-skeleton>
      </div>

      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                 [ngClass]="subscriberStatus === 'SUBSCRIBED' ? 'bg-emerald-100' : subscriberStatus === 'FAILED' ? 'bg-red-100' : 'bg-gray-100'">
              <svg class="w-6 h-6"
                   [ngClass]="subscriberStatus === 'SUBSCRIBED' ? 'text-emerald-600' : subscriberStatus === 'FAILED' ? 'text-red-600' : 'text-gray-400'"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="subscriberStatus === 'SUBSCRIBED'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path *ngIf="subscriberStatus !== 'SUBSCRIBED'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900">Network Registration</h2>
              <p class="text-sm text-gray-500">
                {{ subscriberStatus === 'NOT_CONFIGURED' ? 'Not configured yet' :
                   subscriberStatus === 'SUBSCRIBED' ? 'Connected to ONDC ' + (subscriber?.environment || '') :
                   subscriberStatus === 'PENDING' ? 'Configuration saved, keys needed' :
                   subscriberStatus === 'INITIATED' ? 'Registration in progress...' :
                   'Registration failed' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-800': subscriberStatus === 'SUBSCRIBED',
                    'bg-yellow-100 text-yellow-800': subscriberStatus === 'PENDING' || subscriberStatus === 'INITIATED',
                    'bg-red-100 text-red-800': subscriberStatus === 'FAILED',
                    'bg-gray-100 text-gray-600': subscriberStatus === 'NOT_CONFIGURED'
                  }">
              {{ subscriberStatus === 'NOT_CONFIGURED' ? 'Not Set Up' : subscriberStatus }}
            </span>
            <a routerLink="/ondc/setup"
               class="text-sm font-medium text-emerald-600 hover:text-emerald-500">
              {{ subscriberStatus === 'NOT_CONFIGURED' ? 'Set Up' : 'Manage' }}
            </a>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Providers</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ providerCount }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Published Products</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ publishedCount }}</p>
            </div>
            <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Orders</p>
              <p class="mt-1 text-3xl font-bold text-gray-900">{{ orderCount }}</p>
            </div>
            <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <a routerLink="/ondc/setup"
           class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <h3 class="text-sm font-semibold text-gray-900">Setup & Configuration</h3>
          </div>
          <p class="text-xs text-gray-500">Subscriber registration, provider profile, and store details</p>
        </a>

        <a routerLink="/ondc/products"
           class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            <h3 class="text-sm font-semibold text-gray-900">Product Listings</h3>
          </div>
          <p class="text-xs text-gray-500">Configure and publish products to the ONDC network</p>
        </a>

        <a routerLink="/ondc/orders"
           class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-5 h-5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <h3 class="text-sm font-semibold text-gray-900">Orders</h3>
          </div>
          <p class="text-xs text-gray-500">View and manage orders received from buyer apps</p>
        </a>
      </div>
    </div>
  `,
})
export class OndcDashboardComponent implements OnInit {
  private ondcService = inject(OndcService);

  loading = true;
  subscriber: OndcSubscriber | null = null;
  subscriberStatus: string = 'NOT_CONFIGURED';
  providerCount = 0;
  publishedCount = 0;
  orderCount = 0;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    let completed = 0;
    const checkDone = () => { if (++completed >= 4) this.loading = false; };

    this.ondcService.getSubscriberStatus().subscribe({
      next: (res) => {
        this.subscriberStatus = res.data || 'NOT_CONFIGURED';
        checkDone();
      },
      error: () => {
        this.subscriberStatus = 'NOT_CONFIGURED';
        checkDone();
      },
    });

    this.ondcService.getSubscriber().subscribe({
      next: (res) => { this.subscriber = res.data; checkDone(); },
      error: () => checkDone(),
    });

    this.ondcService.listProviders().subscribe({
      next: (res) => { this.providerCount = res.data?.length || 0; checkDone(); },
      error: () => checkDone(),
    });

    this.ondcService.listPublishedProducts().subscribe({
      next: (res) => { this.publishedCount = res.data?.length || 0; checkDone(); },
      error: () => checkDone(),
    });

    this.ondcService.listOrders({ page: 0, size: 1 }).subscribe({
      next: (res) => { this.orderCount = res.data?.totalElements || 0; },
      error: () => {},
    });
  }
}
