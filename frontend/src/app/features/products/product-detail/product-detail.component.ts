import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, ProductImage, AttributeDefinition } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriceDisplayComponent } from '../../../shared/components/price-display/price-display.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProductChannelsComponent } from '../product-channels/product-channels.component';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    RouterLink,
    StatusBadgeComponent,
    PriceDisplayComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent,
    ProductChannelsComponent,
    IndianCurrencyPipe,
    RelativeTimePipe,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <a routerLink="/products" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </a>
          <h1 class="text-2xl font-bold text-gray-900">Product Detail</h1>
        </div>
        <div *ngIf="product" class="flex items-center gap-2">
          <!-- Status Toggle -->
          <button
            (click)="toggleStatus()"
            class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            [ngClass]="product.status === 'ACTIVE'
              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              : 'border-green-300 text-green-700 hover:bg-green-50'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
            </svg>
            {{ product.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
          </button>
          <!-- Duplicate -->
          <button
            (click)="duplicateProduct()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Duplicate
          </button>
          <!-- Delete -->
          <button
            (click)="showDeleteDialog = true"
            class="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Delete
          </button>
          <!-- Edit -->
          <a
            [routerLink]="['/products', product.id, 'edit']"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Edit Product
          </a>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="8"></app-loading-skeleton>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && product" class="flex flex-col lg:flex-row gap-6">
        <!-- Left: Image Gallery -->
        <div class="lg:w-2/5">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <!-- Main Image -->
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
              <img
                *ngIf="selectedImage"
                [src]="selectedImage.largeUrl || selectedImage.originalUrl"
                [alt]="selectedImage.altText || product.name"
                loading="lazy"
                class="w-full h-full object-contain"
              />
              <svg *ngIf="!selectedImage" class="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>

            <!-- Thumbnails -->
            <div *ngIf="product.images && product.images.length > 1" class="flex gap-2 overflow-x-auto">
              <button
                *ngFor="let img of product.images; trackBy: trackByImageId"
                (click)="selectedImage = img"
                class="w-16 h-16 flex-shrink-0 rounded-lg border-2 overflow-hidden"
                [ngClass]="selectedImage?.id === img.id ? 'border-emerald-500' : 'border-gray-200 hover:border-gray-300'"
              >
                <img
                  [src]="img.thumbnailUrl || img.originalUrl"
                  [alt]="img.altText || ''"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Product Info -->
        <div class="lg:w-3/5 space-y-6">
          <!-- Basic Info -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h2 class="text-xl font-bold text-gray-900">{{ product.name }}</h2>
                <p *ngIf="product.brand" class="text-sm text-gray-500 mt-1">{{ product.brand }}</p>
              </div>
              <app-status-badge [status]="product.status"></app-status-badge>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
              <div *ngIf="product.sku">
                <p class="text-xs text-gray-500 uppercase">SKU</p>
                <p class="text-sm font-medium text-gray-900">{{ product.sku }}</p>
              </div>
              <div *ngIf="product.categoryName">
                <p class="text-xs text-gray-500 uppercase">Category</p>
                <p class="text-sm font-medium text-gray-900">{{ product.categoryName }}</p>
              </div>
              <div *ngIf="product.hsnCode">
                <p class="text-xs text-gray-500 uppercase">HSN Code</p>
                <p class="text-sm font-medium text-gray-900">{{ product.hsnCode }}</p>
              </div>
              <div *ngIf="product.gstRate">
                <p class="text-xs text-gray-500 uppercase">GST Rate</p>
                <p class="text-sm font-medium text-gray-900">{{ product.gstRate }}</p>
              </div>
              <div *ngIf="product.unit">
                <p class="text-xs text-gray-500 uppercase">Unit</p>
                <p class="text-sm font-medium text-gray-900">{{ product.unit }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase">Featured</p>
                <p class="text-sm font-medium text-gray-900">{{ product.featured ? 'Yes' : 'No' }}</p>
              </div>
            </div>
          </div>

          <!-- Pricing -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-3">Pricing</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <p class="text-xs text-gray-500 uppercase">MRP</p>
                <p class="text-lg font-semibold text-gray-900">{{ product.mrp | indianCurrency }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase">Selling Price</p>
                <p class="text-lg font-semibold text-emerald-600">{{ product.sellingPrice | indianCurrency }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase">Cost Price</p>
                <p class="text-lg font-semibold text-gray-900">{{ product.costPrice | indianCurrency }}</p>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div *ngIf="product.tags && product.tags.length > 0" class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-3">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let tag of product.tags"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div *ngIf="product.shortDescription || product.longDescription" class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-3">Description</h3>
            <p *ngIf="product.shortDescription" class="text-sm text-gray-700 mb-3">{{ product.shortDescription }}</p>
            <div *ngIf="product.longDescription" class="text-sm text-gray-600 prose prose-sm max-w-none" [innerHTML]="product.longDescription"></div>
          </div>

          <!-- Barcode -->
          <div *ngIf="product.barcodeValue" class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-3">Barcode</h3>
            <div class="flex items-center gap-4">
              <div>
                <p class="text-xs text-gray-500 uppercase">Type</p>
                <p class="text-sm font-medium text-gray-900">{{ product.barcodeType || 'EAN_13' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase">Value</p>
                <p class="text-sm font-mono font-medium text-gray-900">{{ product.barcodeValue }}</p>
              </div>
              <img *ngIf="barcodeImageUrl"
                   [src]="barcodeImageUrl"
                   alt="Barcode"
                   class="h-16 ml-auto" />
            </div>
          </div>

          <!-- SEO -->
          <div *ngIf="product.seoTitle || product.seoDescription || (product.seoKeywords && product.seoKeywords.length > 0)"
               class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button (click)="seoExpanded = !seoExpanded"
                    class="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors">
              <h3 class="text-base font-semibold text-gray-900">SEO</h3>
              <svg class="w-5 h-5 text-gray-400 transition-transform" [ngClass]="{'rotate-180': seoExpanded}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="seoExpanded" class="px-6 pb-6 space-y-3">
              <div *ngIf="product.seoTitle">
                <p class="text-xs text-gray-500 uppercase">Title</p>
                <p class="text-sm font-medium text-gray-900">{{ product.seoTitle }}</p>
              </div>
              <div *ngIf="product.seoDescription">
                <p class="text-xs text-gray-500 uppercase">Description</p>
                <p class="text-sm text-gray-700">{{ product.seoDescription }}</p>
              </div>
              <div *ngIf="product.slug">
                <p class="text-xs text-gray-500 uppercase">Slug</p>
                <p class="text-sm font-mono text-gray-600">{{ product.slug }}</p>
              </div>
              <div *ngIf="product.seoKeywords && product.seoKeywords.length > 0">
                <p class="text-xs text-gray-500 uppercase mb-1">Keywords</p>
                <div class="flex flex-wrap gap-1.5">
                  <span *ngFor="let kw of product.seoKeywords"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {{ kw }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom Attributes -->
          <div *ngIf="customAttributes && customAttributes.length > 0" class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-3">Attributes</h3>
            <div class="divide-y divide-gray-100">
              <div *ngFor="let attr of customAttributes; trackBy: trackByAttrKey" class="flex items-center justify-between py-2.5">
                <span class="text-sm text-gray-500">{{ attr.key }}</span>
                <span class="text-sm font-medium text-gray-900">{{ attr.value }}</span>
              </div>
            </div>
          </div>

          <!-- Inventory & Dimensions -->
          <div *ngIf="product.trackInventory || product.weightGrams || product.lengthCm" class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-3">Inventory & Dimensions</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div *ngIf="product.trackInventory">
                <p class="text-xs text-gray-500 uppercase">Current Stock</p>
                <p class="text-lg font-semibold"
                  [ngClass]="isLowStock ? 'text-red-600' : 'text-gray-900'">
                  {{ product.currentStock ?? 0 }}
                </p>
              </div>
              <div *ngIf="product.trackInventory">
                <p class="text-xs text-gray-500 uppercase">Low Stock Threshold</p>
                <p class="text-sm font-medium text-gray-900">{{ product.lowStockThreshold ?? 10 }}</p>
              </div>
              <div *ngIf="product.weightGrams">
                <p class="text-xs text-gray-500 uppercase">Weight</p>
                <p class="text-sm font-medium text-gray-900">{{ product.weightGrams }}g</p>
              </div>
              <div *ngIf="product.lengthCm">
                <p class="text-xs text-gray-500 uppercase">Length</p>
                <p class="text-sm font-medium text-gray-900">{{ product.lengthCm }} cm</p>
              </div>
              <div *ngIf="product.widthCm">
                <p class="text-xs text-gray-500 uppercase">Width</p>
                <p class="text-sm font-medium text-gray-900">{{ product.widthCm }} cm</p>
              </div>
              <div *ngIf="product.heightCm">
                <p class="text-xs text-gray-500 uppercase">Height</p>
                <p class="text-sm font-medium text-gray-900">{{ product.heightCm }} cm</p>
              </div>
            </div>
          </div>

          <!-- Channel Listings -->
          <app-product-channels [productId]="product.id"></app-product-channels>

          <!-- Meta -->
          <div class="text-xs text-gray-400 flex items-center gap-4">
            <span *ngIf="product.createdAt">Created: {{ product.createdAt | relativeTime }}</span>
            <span *ngIf="product.updatedAt">Updated: {{ product.updatedAt | relativeTime }}</span>
          </div>
        </div>
      </div>

      <!-- Not found -->
      <div *ngIf="!loading && !product" class="text-center py-12">
        <p class="text-gray-500">Product not found.</p>
        <a routerLink="/products" class="text-emerald-600 hover:text-emerald-500 text-sm font-medium mt-2 inline-block">
          Back to products
        </a>
      </div>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [show]="showDeleteDialog"
        title="Delete Product"
        [message]="'Are you sure you want to delete &quot;' + (product?.name || '') + '&quot;? This action cannot be undone.'"
        confirmLabel="Delete"
        (confirmed)="deleteProduct()"
        (cancelled)="showDeleteDialog = false"
      ></app-confirm-dialog>
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private toast = inject(ToastService);

  trackByImageId(index: number, item: any): string {
    return item.id;
  }

  trackByAttrKey(index: number, item: any): string {
    return item.key;
  }

  product: Product | null = null;
  selectedImage: ProductImage | null = null;
  loading = true;
  customAttributes: { key: string; value: any }[] = [];
  showDeleteDialog = false;
  seoExpanded = false;
  barcodeImageUrl: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.loading = false;
    }
  }

  get isLowStock(): boolean {
    if (!this.product?.trackInventory) return false;
    return (this.product.currentStock ?? 0) <= (this.product.lowStockThreshold ?? 10);
  }

  toggleStatus(): void {
    if (!this.product) return;
    const newStatus = this.product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.productService.changeStatus(this.product.id, newStatus).subscribe({
      next: () => {
        this.product!.status = newStatus;
        this.toast.success(`Product ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Failed to change status'),
    });
  }

  duplicateProduct(): void {
    if (!this.product) return;
    this.productService.duplicateProduct(this.product.id).subscribe({
      next: (res) => {
        this.toast.success('Product duplicated');
        this.router.navigate(['/products', res.data.id, 'edit']);
      },
      error: () => this.toast.error('Failed to duplicate product'),
    });
  }

  deleteProduct(): void {
    if (!this.product) return;
    this.productService.deleteProduct(this.product.id).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.showDeleteDialog = false;
        this.router.navigate(['/products']);
      },
      error: () => {
        this.toast.error('Failed to delete product');
        this.showDeleteDialog = false;
      },
    });
  }

  private loadProduct(id: string): void {
    this.productService.getProduct(id).subscribe({
      next: (res) => {
        this.product = res.data;
        this.loading = false;

        // Set primary image as selected
        if (this.product.images?.length) {
          this.selectedImage =
            this.product.images.find((img) => img.primary) || this.product.images[0];
        }

        // Parse custom attributes
        if (this.product.customAttributes) {
          try {
            const attrs = JSON.parse(this.product.customAttributes);
            this.customAttributes = Object.entries(attrs).map(([key, value]) => ({
              key,
              value: Array.isArray(value) ? (value as string[]).join(', ') : String(value),
            }));
          } catch {
            this.customAttributes = [];
          }
        }

        // Load barcode image
        if (this.product.barcodeValue) {
          this.productService.getBarcodeImage(this.product.id, this.product.barcodeValue).subscribe({
            next: (blob) => {
              this.barcodeImageUrl = URL.createObjectURL(blob);
            },
          });
        }
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load product');
      },
    });
  }
}
