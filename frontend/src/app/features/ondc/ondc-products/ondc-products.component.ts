import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OndcService } from '../services/ondc.service';
import { ProductService } from '../../products/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductListItem, OndcProductConfig } from '../../../core/models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';

@Component({
  selector: 'app-ondc-products',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule, RouterLink, LoadingSkeletonComponent, IndianCurrencyPipe],
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
            <h1 class="text-2xl font-bold text-gray-900">ONDC Product Listings</h1>
            <p class="mt-1 text-sm text-gray-500">Configure and publish products to the ONDC network</p>
          </div>
          <span class="text-sm text-gray-500">{{ publishedConfigs.length }} published</span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="8"></app-loading-skeleton>
      </div>

      <!-- Product Table -->
      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ONDC Domain</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let product of products; trackBy: trackById" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                  <p class="text-xs text-gray-500">{{ product.sku || '-' }}</p>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">
                {{ (product.sellingPrice || product.mrp) | indianCurrency }}
              </td>
              <td class="px-6 py-4">
                <span *ngIf="getConfig(product.id) as cfg" class="text-xs text-gray-700">{{ cfg.ondcDomain }}</span>
                <span *ngIf="!getConfig(product.id)" class="text-xs text-gray-400">Not configured</span>
              </td>
              <td class="px-6 py-4">
                <span *ngIf="getConfig(product.id)?.publishedToOndc"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Published
                </span>
                <span *ngIf="getConfig(product.id) && !getConfig(product.id)!.publishedToOndc"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Configured
                </span>
                <span *ngIf="!getConfig(product.id)"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  Needs Config
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button (click)="openConfigModal(product)"
                          class="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                    Configure
                  </button>
                  <button *ngIf="getConfig(product.id) && !getConfig(product.id)!.publishedToOndc"
                          (click)="publish(product.id)" [disabled]="actionId === product.id"
                          class="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-medium disabled:opacity-50">
                    Publish
                  </button>
                  <button *ngIf="getConfig(product.id)?.publishedToOndc"
                          (click)="unpublish(product.id)" [disabled]="actionId === product.id"
                          class="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium disabled:opacity-50">
                    Unpublish
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="products.length === 0" class="text-center py-12">
          <p class="text-sm text-gray-500">No active products found. <a routerLink="/products/new" class="text-emerald-600 hover:text-emerald-500">Create a product</a> first.</p>
        </div>
      </div>

      <!-- Config Modal -->
      <div *ngIf="configModalProduct" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">ONDC Configuration</h3>
          <p class="text-sm text-gray-500 mb-5">{{ configModalProduct.name }}</p>

          <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700">ONDC Domain</label>
                <select formControlName="ondcDomain"
                        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="ONDC:RET10">Grocery (RET10)</option>
                  <option value="ONDC:RET12">Fashion (RET12)</option>
                  <option value="ONDC:RET13">BPC (RET13)</option>
                  <option value="ONDC:RET14">Electronics (RET14)</option>
                  <option value="ONDC:RET16">F&B (RET16)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Category ID</label>
                <input formControlName="ondcCategoryId" type="text" placeholder="Optional"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Country of Origin</label>
                <input formControlName="countryOfOrigin" type="text"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Time to Ship</label>
                <select formControlName="timeToShip"
                        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="">Use provider default</option>
                  <option value="PT1H">1 Hour</option>
                  <option value="PT4H">4 Hours</option>
                  <option value="PT12H">12 Hours</option>
                  <option value="PT24H">24 Hours</option>
                  <option value="PT48H">48 Hours</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Max Order Qty</label>
                <input formControlName="maxOrderQuantity" type="number" min="1"
                       class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Return Window</label>
                <select formControlName="returnWindow"
                        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="">Use provider default</option>
                  <option value="P0D">No Returns</option>
                  <option value="P3D">3 Days</option>
                  <option value="P7D">7 Days</option>
                  <option value="P14D">14 Days</option>
                </select>
              </div>
            </div>

            <div class="flex flex-wrap gap-5 pt-2">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="returnable" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Returnable
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="cancellable" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Cancellable
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="codAvailable" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                COD
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="sellerPickupReturn" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Seller Pickup Return
              </label>
            </div>

            <div class="flex flex-wrap gap-5 pt-2">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="isVeg" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Veg
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="isNonVeg" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Non-Veg
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input formControlName="isEgg" type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Egg
              </label>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" (click)="configModalProduct = null"
                      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" [disabled]="configForm.invalid || saving"
                      class="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                {{ saving ? 'Saving...' : 'Save Configuration' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class OndcProductsComponent implements OnInit {
  private ondcService = inject(OndcService);
  private productService = inject(ProductService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  actionId: string | null = null;
  products: ProductListItem[] = [];
  configMap = new Map<string, OndcProductConfig>();
  publishedConfigs: OndcProductConfig[] = [];
  configModalProduct: ProductListItem | null = null;

  configForm = this.fb.group({
    ondcDomain: ['ONDC:RET10', Validators.required],
    ondcCategoryId: [''],
    timeToShip: [''],
    returnable: [true],
    cancellable: [true],
    returnWindow: [''],
    sellerPickupReturn: [false],
    codAvailable: [false],
    maxOrderQuantity: [100],
    countryOfOrigin: ['IND'],
    isVeg: [false],
    isNonVeg: [false],
    isEgg: [false],
  });

  trackById(index: number, item: any): string { return item.id; }

  ngOnInit(): void {
    this.loadProducts();
    this.loadPublished();
  }

  getConfig(productId: string): OndcProductConfig | undefined {
    return this.configMap.get(productId);
  }

  private loadProducts(): void {
    this.productService.getProducts({ page: 0, size: 200, sort: 'name,asc' }).subscribe({
      next: (res) => {
        this.products = res.data.content.filter(p => p.status === 'ACTIVE');
        this.loading = false;
        this.products.forEach(p => this.loadConfig(p.id));
      },
      error: () => this.loading = false,
    });
  }

  private loadPublished(): void {
    this.ondcService.listPublishedProducts().subscribe({
      next: (res) => this.publishedConfigs = res.data || [],
    });
  }

  private loadConfig(productId: string): void {
    this.ondcService.getProductConfig(productId).subscribe({
      next: (res) => { if (res.data) this.configMap.set(productId, res.data); },
    });
  }

  openConfigModal(product: ProductListItem): void {
    this.configModalProduct = product;
    const existing = this.configMap.get(product.id);
    if (existing) {
      this.configForm.patchValue({
        ondcDomain: existing.ondcDomain,
        ondcCategoryId: existing.ondcCategoryId || '',
        timeToShip: existing.timeToShip || '',
        returnable: existing.returnable ?? true,
        cancellable: existing.cancellable ?? true,
        returnWindow: existing.returnWindow || '',
        sellerPickupReturn: existing.sellerPickupReturn ?? false,
        codAvailable: existing.codAvailable ?? false,
        maxOrderQuantity: existing.maxOrderQuantity ?? 100,
        countryOfOrigin: existing.countryOfOrigin || 'IND',
        isVeg: existing.isVeg ?? false,
        isNonVeg: existing.isNonVeg ?? false,
        isEgg: existing.isEgg ?? false,
      });
    } else {
      this.configForm.reset({
        ondcDomain: 'ONDC:RET10',
        returnable: true,
        cancellable: true,
        maxOrderQuantity: 100,
        countryOfOrigin: 'IND',
      });
    }
  }

  saveConfig(): void {
    if (!this.configModalProduct || this.configForm.invalid) return;
    this.saving = true;
    const productId = this.configModalProduct.id;
    const val = this.configForm.getRawValue();

    this.ondcService.saveProductConfig(productId, {
      ondcDomain: val.ondcDomain!,
      ondcCategoryId: val.ondcCategoryId || undefined,
      timeToShip: val.timeToShip || undefined,
      returnable: val.returnable ?? undefined,
      cancellable: val.cancellable ?? undefined,
      returnWindow: val.returnWindow || undefined,
      sellerPickupReturn: val.sellerPickupReturn ?? undefined,
      codAvailable: val.codAvailable ?? undefined,
      maxOrderQuantity: val.maxOrderQuantity ?? undefined,
      countryOfOrigin: val.countryOfOrigin || undefined,
      isVeg: val.isVeg ?? undefined,
      isNonVeg: val.isNonVeg ?? undefined,
      isEgg: val.isEgg ?? undefined,
    }).subscribe({
      next: (res) => {
        this.configMap.set(productId, res.data);
        this.saving = false;
        this.configModalProduct = null;
        this.toast.success('ONDC configuration saved');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to save configuration');
      },
    });
  }

  publish(productId: string): void {
    this.actionId = productId;
    this.ondcService.publishProduct(productId).subscribe({
      next: (res) => {
        this.configMap.set(productId, res.data);
        this.actionId = null;
        this.loadPublished();
        this.toast.success('Product published to ONDC');
      },
      error: () => {
        this.actionId = null;
        this.toast.error('Failed to publish');
      },
    });
  }

  unpublish(productId: string): void {
    this.actionId = productId;
    this.ondcService.unpublishProduct(productId).subscribe({
      next: (res) => {
        this.configMap.set(productId, res.data);
        this.actionId = null;
        this.loadPublished();
        this.toast.success('Product unpublished from ONDC');
      },
      error: () => {
        this.actionId = null;
        this.toast.error('Failed to unpublish');
      },
    });
  }
}
