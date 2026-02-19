import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../../categories/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductListItem, Category } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriceDisplayComponent } from '../../../shared/components/price-display/price-display.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    RouterLink,
    StatusBadgeComponent,
    PriceDisplayComponent,
    PaginationComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent,
    IndianCurrencyPipe,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Products
            <span *ngIf="totalElements > 0" class="text-lg font-normal text-gray-500">({{ totalElements }})</span>
          </h1>
        </div>
        <a
          routerLink="/products/new"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors self-start"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Product
        </a>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search products by name, SKU..."
              class="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <!-- View Toggle -->
            <div class="flex rounded-lg border border-gray-300 p-0.5">
              <button
                (click)="viewMode = 'grid'"
                [ngClass]="{'bg-emerald-600 text-white': viewMode === 'grid', 'text-gray-500 hover:text-gray-700': viewMode !== 'grid'}"
                class="p-1.5 rounded-md transition-colors"
                title="Grid view"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
              </button>
              <button
                (click)="viewMode = 'list'"
                [ngClass]="{'bg-emerald-600 text-white': viewMode === 'list', 'text-gray-500 hover:text-gray-700': viewMode !== 'list'}"
                class="p-1.5 rounded-md transition-colors"
                title="List view"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
              </button>
            </div>

            <!-- Category Filter -->
            <select
              [(ngModel)]="selectedCategory"
              (ngModelChange)="onFilterChange()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              <option *ngFor="let cat of categories; trackBy: trackByCategoryId" [value]="cat.id">{{ cat.name }}</option>
            </select>

            <!-- Status Filter -->
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <!-- Sort -->
            <select
              [(ngModel)]="selectedSort"
              (ngModelChange)="onFilterChange()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="createdAt,desc">Newest first</option>
              <option value="createdAt,asc">Oldest first</option>
              <option value="name,asc">Name A-Z</option>
              <option value="name,desc">Name Z-A</option>
              <option value="sellingPrice,asc">Price: Low to High</option>
              <option value="sellingPrice,desc">Price: High to Low</option>
            </select>

            <!-- Export -->
            <button
              (click)="exportProducts()"
              [disabled]="exporting"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="space-y-4">
        <div *ngFor="let i of [1,2,3]; trackBy: trackByIndex" class="bg-white rounded-xl border border-gray-200 p-5">
          <app-loading-skeleton [lines]="3"></app-loading-skeleton>
        </div>
      </div>

      <!-- Grid View -->
      <div *ngIf="!loading && viewMode === 'grid' && products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div
          *ngFor="let product of products; trackBy: trackByProductId"
          class="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
          (click)="navigateToEdit(product.id)"
        >
          <!-- Thumbnail -->
          <div class="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
            <img
              *ngIf="product.thumbnailUrl"
              [src]="product.thumbnailUrl"
              [alt]="product.name"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <svg *ngIf="!product.thumbnailUrl" class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <div class="absolute top-2 right-2">
              <app-status-badge [status]="product.status"></app-status-badge>
            </div>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</h3>
            <p *ngIf="product.sku" class="text-xs text-gray-500 mt-0.5">SKU: {{ product.sku }}</p>
            <div class="mt-2">
              <app-price-display [sellingPrice]="product.sellingPrice" [mrp]="product.mrp"></app-price-display>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span
                *ngIf="product.trackInventory"
                class="text-xs"
                [ngClass]="{
                  'text-red-600 font-medium': isLowStock(product),
                  'text-gray-500': !isLowStock(product)
                }"
              >
                Stock: {{ product.currentStock ?? 0 }}
                <span *ngIf="isLowStock(product)"> (Low)</span>
              </span>
              <span *ngIf="product.categoryName" class="text-xs text-gray-400 truncate ml-2">{{ product.categoryName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div *ngIf="!loading && viewMode === 'list' && products.length > 0" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              *ngFor="let product of products; trackBy: trackByProductId"
              class="hover:bg-gray-50 cursor-pointer"
              (click)="navigateToEdit(product.id)"
            >
              <!-- Product Name + Image -->
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img
                      *ngIf="product.thumbnailUrl"
                      [src]="product.thumbnailUrl"
                      [alt]="product.name"
                      loading="lazy"
                      class="w-full h-full object-cover"
                    />
                    <svg *ngIf="!product.thumbnailUrl" class="w-full h-full p-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
                    <p *ngIf="product.sku" class="text-xs text-gray-500">{{ product.sku }}</p>
                  </div>
                </div>
              </td>
              <!-- Category -->
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                {{ product.categoryName || '-' }}
              </td>
              <!-- Price -->
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ product.sellingPrice | indianCurrency }}</div>
                <div *ngIf="product.mrp && product.mrp > (product.sellingPrice ?? 0)" class="text-xs text-gray-400 line-through">
                  {{ product.mrp | indianCurrency }}
                </div>
              </td>
              <!-- Stock -->
              <td class="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                <span
                  *ngIf="product.trackInventory"
                  class="text-sm"
                  [ngClass]="{
                    'text-red-600 font-medium': isLowStock(product),
                    'text-gray-600': !isLowStock(product)
                  }"
                >
                  {{ product.currentStock ?? 0 }}
                </span>
                <span *ngIf="!product.trackInventory" class="text-sm text-gray-400">-</span>
              </td>
              <!-- Status -->
              <td class="px-4 py-3 whitespace-nowrap">
                <app-status-badge [status]="product.status"></app-status-badge>
              </td>
              <!-- Actions -->
              <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
                <div class="flex items-center justify-end gap-1" (click)="$event.stopPropagation()">
                  <button
                    (click)="navigateToEdit(product.id)"
                    class="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-gray-100"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    (click)="duplicateProduct(product.id)"
                    class="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100"
                    title="Duplicate"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                  <button
                    (click)="confirmDelete(product)"
                    class="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!loading && products.length === 0"
        title="No products found"
        [message]="searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first product.'"
        [actionLabel]="searchQuery ? undefined : 'Add Product'"
        (actionClicked)="router.navigate(['/products/new'])"
      ></app-empty-state>

      <!-- Pagination -->
      <div *ngIf="!loading && products.length > 0" class="mt-6">
        <app-pagination
          [currentPage]="currentPage"
          [totalPages]="totalPages"
          [totalElements]="totalElements"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
        ></app-pagination>
      </div>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [show]="showDeleteDialog"
        title="Delete Product"
        [message]="'Are you sure you want to delete &quot;' + (productToDelete?.name || '') + '&quot;? This action cannot be undone.'"
        confirmLabel="Delete"
        (confirmed)="deleteProduct()"
        (cancelled)="showDeleteDialog = false"
      ></app-confirm-dialog>
    </div>
  `,
})
export class ProductListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);
  router = inject(Router);

  products: ProductListItem[] = [];
  categories: Category[] = [];
  loading = true;
  exporting = false;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedSort = 'createdAt,desc';
  viewMode: 'grid' | 'list' = 'grid';

  // Pagination
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;

  // Delete
  showDeleteDialog = false;
  productToDelete: ProductListItem | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  trackByProductId(index: number, item: any): string {
    return item.id;
  }

  trackByCategoryId(index: number, item: any): string {
    return item.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.searchQuery = query;
        this.currentPage = 0;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  isLowStock(product: ProductListItem): boolean {
    if (!product.trackInventory) return false;
    const threshold = product.lowStockThreshold ?? 10;
    return (product.currentStock ?? 0) <= threshold;
  }

  navigateToEdit(productId: string): void {
    this.router.navigate(['/products', productId, 'edit']);
  }

  duplicateProduct(productId: string): void {
    this.productService.duplicateProduct(productId).subscribe({
      next: (res) => {
        this.toast.success('Product duplicated successfully');
        this.router.navigate(['/products', res.data.id, 'edit']);
      },
      error: () => {
        this.toast.error('Failed to duplicate product');
      },
    });
  }

  confirmDelete(product: ProductListItem): void {
    this.productToDelete = product;
    this.showDeleteDialog = true;
  }

  deleteProduct(): void {
    if (!this.productToDelete) return;
    this.productService.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.showDeleteDialog = false;
        this.productToDelete = null;
        this.loadProducts();
      },
      error: () => {
        this.toast.error('Failed to delete product');
        this.showDeleteDialog = false;
      },
    });
  }

  exportProducts(): void {
    this.exporting = true;
    this.productService.exportProducts().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products-export.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting = false;
        this.toast.success('Products exported successfully');
      },
      error: () => {
        this.exporting = false;
        this.toast.error('Failed to export products');
      },
    });
  }

  private loadProducts(): void {
    this.loading = true;

    if (this.searchQuery) {
      this.productService
        .searchProducts(this.searchQuery, this.currentPage, this.pageSize)
        .subscribe({
          next: (res) => {
            this.products = res.data.content;
            this.totalPages = res.data.totalPages;
            this.totalElements = res.data.totalElements;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
    } else {
      this.productService
        .getProducts({
          categoryId: this.selectedCategory || undefined,
          status: this.selectedStatus || undefined,
          sort: this.selectedSort,
          page: this.currentPage,
          size: this.pageSize,
        })
        .subscribe({
          next: (res) => {
            this.products = res.data.content;
            this.totalPages = res.data.totalPages;
            this.totalElements = res.data.totalElements;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
    }
  }

  private loadCategories(): void {
    this.categoryService.getCategoryTree().subscribe({
      next: (res) => {
        this.categories = this.flattenCategories(res.data);
      },
    });
  }

  private flattenCategories(cats: Category[], prefix = ''): Category[] {
    const result: Category[] = [];
    for (const cat of cats) {
      result.push({ ...cat, name: prefix ? `${prefix} > ${cat.name}` : cat.name });
      if (cat.children?.length) {
        result.push(
          ...this.flattenCategories(
            cat.children,
            prefix ? `${prefix} > ${cat.name}` : cat.name
          )
        );
      }
    }
    return result;
  }
}
