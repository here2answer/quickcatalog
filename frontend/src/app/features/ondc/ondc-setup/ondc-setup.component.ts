import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OndcService } from '../services/ondc.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { OndcSubscriber, OndcProvider } from '../../../core/models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ondc-setup',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule, RouterLink, LoadingSkeletonComponent],
  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <a routerLink="/ondc" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to ONDC
        </a>
        <h1 class="text-2xl font-bold text-gray-900">ONDC Setup</h1>
        <p class="mt-1 text-sm text-gray-500">Configure your subscriber identity and provider profile</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="6"></app-loading-skeleton>
      </div>

      <!-- Section 1: Subscriber Registration -->
      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Subscriber Registration</h2>
        <p class="text-sm text-gray-500 mb-5">Register with the ONDC network to receive buyer traffic</p>

        <!-- Steps indicator -->
        <div class="flex items-center gap-2 mb-6">
          <div *ngFor="let s of [1,2,3]; let i = index" class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                 [ngClass]="subscriberStep > s ? 'bg-emerald-600 text-white' :
                            subscriberStep === s ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600' :
                            'bg-gray-100 text-gray-400'">
              <svg *ngIf="subscriberStep > s" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span *ngIf="subscriberStep <= s">{{ s }}</span>
            </div>
            <span class="text-xs font-medium" [ngClass]="subscriberStep >= s ? 'text-gray-900' : 'text-gray-400'">
              {{ s === 1 ? 'Configure' : s === 2 ? 'Generate Keys' : 'Register' }}
            </span>
            <div *ngIf="i < 2" class="w-8 h-px bg-gray-300"></div>
          </div>
        </div>

        <!-- Step 1: Configure -->
        <form *ngIf="subscriberStep === 1" [formGroup]="subscriberForm" (ngSubmit)="saveSubscriber()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Subscriber ID</label>
            <input formControlName="subscriberId" type="text" placeholder="e.g. quickcatalog.example.com"
                   class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Subscriber URL</label>
            <input formControlName="subscriberUrl" type="url" placeholder="https://quickcatalog.example.com/ondc"
                   class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Environment</label>
              <select formControlName="environment"
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="STAGING">Staging</option>
                <option value="PRE_PROD">Pre-Production</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Domain</label>
              <select formControlName="domain"
                      class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="ONDC:RET10">Grocery (RET10)</option>
                <option value="ONDC:RET12">Fashion (RET12)</option>
                <option value="ONDC:RET13">BPC (RET13)</option>
                <option value="ONDC:RET14">Electronics (RET14)</option>
                <option value="ONDC:RET16">F&B (RET16)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">City Codes (comma-separated)</label>
            <input formControlName="cityCodes" type="text" placeholder="std:080, std:022"
                   class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div class="flex justify-end pt-2">
            <button type="submit" [disabled]="subscriberForm.invalid || saving"
                    class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors">
              {{ saving ? 'Saving...' : 'Save & Continue' }}
            </button>
          </div>
        </form>

        <!-- Step 2: Generate Keys -->
        <div *ngIf="subscriberStep === 2" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800">
              Generate Ed25519 signing and X25519 encryption key pairs. These are used to authenticate API calls on the ONDC network.
            </p>
          </div>
          <div *ngIf="subscriber?.signingPublicKey" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Signing Public Key</label>
              <div class="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 break-all">{{ subscriber.signingPublicKey }}</div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Encryption Public Key</label>
              <div class="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 break-all">{{ subscriber.encryptionPublicKey }}</div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Unique Key ID</label>
              <div class="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700">{{ subscriber.uniqueKeyId }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2">
            <button (click)="subscriberStep = 1" class="text-sm text-gray-600 hover:text-gray-800">Back</button>
            <div class="flex gap-3">
              <button *ngIf="!subscriber?.signingPublicKey" (click)="generateKeys()" [disabled]="saving"
                      class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                {{ saving ? 'Generating...' : 'Generate Keys' }}
              </button>
              <button *ngIf="subscriber?.signingPublicKey" (click)="subscriberStep = 3"
                      class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors">
                Continue
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Register -->
        <div *ngIf="subscriberStep === 3" class="space-y-4">
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p class="text-sm text-amber-800">
              Submit your subscriber details to the ONDC registry. Once approved, buyer apps will be able to discover your catalog.
            </p>
          </div>
          <div class="text-center py-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-800': subscriber?.registrationStatus === 'SUBSCRIBED',
                    'bg-yellow-100 text-yellow-800': subscriber?.registrationStatus === 'INITIATED',
                    'bg-red-100 text-red-800': subscriber?.registrationStatus === 'FAILED',
                    'bg-gray-100 text-gray-600': !subscriber?.registrationStatus || subscriber?.registrationStatus === 'PENDING'
                  }">
              Status: {{ subscriber?.registrationStatus || 'PENDING' }}
            </span>
          </div>
          <div class="flex items-center justify-between pt-2">
            <button (click)="subscriberStep = 2" class="text-sm text-gray-600 hover:text-gray-800">Back</button>
            <button *ngIf="subscriber?.registrationStatus !== 'SUBSCRIBED'" (click)="registerSubscriber()" [disabled]="saving"
                    class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors">
              {{ saving ? 'Registering...' : subscriber?.registrationStatus === 'FAILED' ? 'Retry Registration' : 'Register with ONDC' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Section 2: Provider Profile -->
      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Provider Profile</h2>
            <p class="text-sm text-gray-500">Your store details as shown to buyers on the ONDC network</p>
          </div>
          <button *ngIf="!showProviderForm && isAdmin" (click)="startProviderCreate()"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Provider
          </button>
        </div>

        <!-- Provider List -->
        <div *ngIf="!showProviderForm && providers.length > 0" class="space-y-3">
          <div *ngFor="let p of providers" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ p.name }}</p>
              <p class="text-xs text-gray-500">{{ p.providerId }} &middot; {{ p.addressCity }}, {{ p.addressState }}</p>
              <p class="text-xs text-gray-400">{{ p.contactPhone }} &middot; {{ p.contactEmail }}</p>
            </div>
            <div *ngIf="isAdmin" class="flex items-center gap-2">
              <button (click)="startProviderEdit(p)" class="text-sm text-emerald-600 hover:text-emerald-500">Edit</button>
              <button (click)="deleteProvider(p)" class="text-sm text-red-600 hover:text-red-500">Delete</button>
            </div>
          </div>
        </div>

        <div *ngIf="!showProviderForm && providers.length === 0" class="text-center py-8">
          <p class="text-sm text-gray-500">No providers configured yet</p>
        </div>

        <!-- Provider Form -->
        <form *ngIf="showProviderForm" [formGroup]="providerForm" (ngSubmit)="saveProvider()" class="space-y-4">
          <h3 class="text-base font-medium text-gray-900">{{ editingProviderId ? 'Edit Provider' : 'New Provider' }}</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Store Name</label>
              <input formControlName="name" type="text"
                     class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Short Description</label>
              <input formControlName="shortDesc" type="text"
                     class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Address</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Street</label>
                <input formControlName="addressStreet" type="text"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">City</label>
                <input formControlName="addressCity" type="text"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">State</label>
                <input formControlName="addressState" type="text"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">PIN Code</label>
                <input formControlName="addressAreaCode" type="text"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">GPS Coordinates</label>
                <input formControlName="gpsCoordinates" type="text" placeholder="12.9716,77.5946"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Contact</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone</label>
                <input formControlName="contactPhone" type="tel"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input formControlName="contactEmail" type="email"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">FSSAI License (F&B only)</label>
                <input formControlName="fssaiLicenseNo" type="text"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Store Timings</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Opens At</label>
                <input formControlName="storeTimingStart" type="time"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Closes At</label>
                <input formControlName="storeTimingEnd" type="time"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Working Days</label>
                <input formControlName="storeDays" type="text" placeholder="1,2,3,4,5,6,7"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Logistics Defaults</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Time to Ship</label>
                <select formControlName="defaultTimeToShip"
                        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="PT1H">1 Hour</option>
                  <option value="PT4H">4 Hours</option>
                  <option value="PT12H">12 Hours</option>
                  <option value="PT24H">24 Hours</option>
                  <option value="PT48H">48 Hours</option>
                  <option value="P3D">3 Days</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Return Window</label>
                <select formControlName="defaultReturnWindow"
                        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="P0D">No Returns</option>
                  <option value="P3D">3 Days</option>
                  <option value="P7D">7 Days</option>
                  <option value="P14D">14 Days</option>
                  <option value="P30D">30 Days</option>
                </select>
              </div>
            </div>
            <div class="flex flex-wrap gap-6 mt-4">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="defaultReturnable" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Returnable
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="defaultCancellable" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Cancellable
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="defaultCodAvailable" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                COD Available
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <button type="button" (click)="cancelProviderForm()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" [disabled]="providerForm.invalid || saving"
                    class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors">
              {{ saving ? 'Saving...' : editingProviderId ? 'Update Provider' : 'Create Provider' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class OndcSetupComponent implements OnInit {
  private ondcService = inject(OndcService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  subscriber: OndcSubscriber | null = null;
  providers: OndcProvider[] = [];
  subscriberStep = 1;
  showProviderForm = false;
  editingProviderId: string | null = null;

  get isAdmin(): boolean {
    return this.authService.hasMinRole('ADMIN');
  }

  subscriberForm = this.fb.group({
    subscriberId: ['', Validators.required],
    subscriberUrl: ['', Validators.required],
    environment: ['STAGING'],
    domain: ['ONDC:RET10'],
    cityCodes: [''],
  });

  providerForm = this.fb.group({
    name: ['', Validators.required],
    shortDesc: [''],
    gpsCoordinates: ['', Validators.required],
    addressStreet: ['', Validators.required],
    addressCity: ['', Validators.required],
    addressState: ['', Validators.required],
    addressAreaCode: ['', Validators.required],
    contactPhone: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    fssaiLicenseNo: [''],
    storeTimingStart: ['09:00'],
    storeTimingEnd: ['21:00'],
    storeDays: ['1,2,3,4,5,6,7'],
    defaultTimeToShip: ['PT24H'],
    defaultReturnable: [true],
    defaultCancellable: [true],
    defaultReturnWindow: ['P7D'],
    defaultCodAvailable: [false],
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    let completed = 0;
    const checkDone = () => { if (++completed >= 2) this.loading = false; };

    this.ondcService.getSubscriber().subscribe({
      next: (res) => {
        this.subscriber = res.data;
        if (this.subscriber) {
          this.subscriberForm.patchValue({
            subscriberId: this.subscriber.subscriberId,
            subscriberUrl: this.subscriber.subscriberUrl,
            environment: this.subscriber.environment,
            domain: this.subscriber.domain || 'ONDC:RET10',
            cityCodes: this.subscriber.cityCodes?.join(', ') || '',
          });
          if (this.subscriber.signingPublicKey) {
            this.subscriberStep = this.subscriber.registrationStatus === 'PENDING' ? 3 :
                                  this.subscriber.registrationStatus === 'SUBSCRIBED' ? 3 :
                                  this.subscriber.registrationStatus === 'FAILED' ? 3 : 2;
          } else {
            this.subscriberStep = 2;
          }
        }
        checkDone();
      },
      error: () => checkDone(),
    });

    this.ondcService.listProviders().subscribe({
      next: (res) => { this.providers = res.data || []; checkDone(); },
      error: () => checkDone(),
    });
  }

  saveSubscriber(): void {
    if (this.subscriberForm.invalid) return;
    this.saving = true;
    const val = this.subscriberForm.getRawValue();
    this.ondcService.saveSubscriber({
      subscriberId: val.subscriberId!,
      subscriberUrl: val.subscriberUrl!,
      environment: val.environment as any,
      domain: val.domain || undefined,
      cityCodes: val.cityCodes ? val.cityCodes.split(',').map(c => c.trim()).filter(Boolean) : undefined,
    }).subscribe({
      next: (res) => {
        this.subscriber = res.data;
        this.saving = false;
        this.subscriberStep = 2;
        this.toast.success('Subscriber configuration saved');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to save subscriber configuration');
      },
    });
  }

  generateKeys(): void {
    this.saving = true;
    this.ondcService.generateKeys().subscribe({
      next: (res) => {
        this.subscriber = res.data;
        this.saving = false;
        this.toast.success('Cryptographic keys generated');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to generate keys');
      },
    });
  }

  registerSubscriber(): void {
    this.saving = true;
    this.ondcService.register().subscribe({
      next: (res) => {
        this.subscriber = res.data;
        this.saving = false;
        this.toast.success('Registration submitted to ONDC');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Registration failed');
      },
    });
  }

  startProviderCreate(): void {
    this.editingProviderId = null;
    this.providerForm.reset({
      storeTimingStart: '09:00',
      storeTimingEnd: '21:00',
      storeDays: '1,2,3,4,5,6,7',
      defaultTimeToShip: 'PT24H',
      defaultReturnable: true,
      defaultCancellable: true,
      defaultReturnWindow: 'P7D',
      defaultCodAvailable: false,
    });
    this.showProviderForm = true;
  }

  startProviderEdit(p: OndcProvider): void {
    this.editingProviderId = p.id;
    this.providerForm.patchValue({
      name: p.name,
      shortDesc: p.shortDesc || '',
      gpsCoordinates: p.gpsCoordinates,
      addressStreet: p.addressStreet,
      addressCity: p.addressCity,
      addressState: p.addressState,
      addressAreaCode: p.addressAreaCode,
      contactPhone: p.contactPhone,
      contactEmail: p.contactEmail,
      fssaiLicenseNo: p.fssaiLicenseNo || '',
      storeTimingStart: p.storeTimingStart || '09:00',
      storeTimingEnd: p.storeTimingEnd || '21:00',
      storeDays: p.storeDays || '1,2,3,4,5,6,7',
      defaultTimeToShip: p.defaultTimeToShip || 'PT24H',
      defaultReturnable: p.defaultReturnable ?? true,
      defaultCancellable: p.defaultCancellable ?? true,
      defaultReturnWindow: p.defaultReturnWindow || 'P7D',
      defaultCodAvailable: p.defaultCodAvailable ?? false,
    });
    this.showProviderForm = true;
  }

  cancelProviderForm(): void {
    this.showProviderForm = false;
    this.editingProviderId = null;
  }

  saveProvider(): void {
    if (this.providerForm.invalid) return;
    this.saving = true;
    const val = this.providerForm.getRawValue();
    const request: any = { ...val };

    const obs = this.editingProviderId
      ? this.ondcService.updateProvider(this.editingProviderId, request)
      : this.ondcService.createProvider(request);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showProviderForm = false;
        this.editingProviderId = null;
        this.toast.success(this.editingProviderId ? 'Provider updated' : 'Provider created');
        this.ondcService.listProviders().subscribe(res => this.providers = res.data || []);
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to save provider');
      },
    });
  }

  deleteProvider(p: OndcProvider): void {
    if (!confirm(`Delete provider "${p.name}"?`)) return;
    this.ondcService.deleteProvider(p.id).subscribe({
      next: () => {
        this.providers = this.providers.filter(x => x.id !== p.id);
        this.toast.success('Provider deleted');
      },
      error: () => this.toast.error('Failed to delete provider'),
    });
  }
}
