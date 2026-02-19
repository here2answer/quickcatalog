import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  HostListener,
} from '@angular/core';
import { NgFor, NgIf, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ProductService } from '../services/product.service';
import { ProductImageService } from '../services/product-image.service';
import { CategoryService } from '../../categories/services/category.service';
import { LookupService } from '../../../core/services/lookup.service';
import { AiService } from '../../../core/services/ai.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Product,
  Category,
  AttributeDefinition,
  HsnCode,
  UnitOption,
  GstRateOption,
  ProductImage,
  AiGenerationResult,
  AiSeoResult,
} from '../../../core/models';
import { TagInputComponent } from '../../../shared/components/tag-input/tag-input.component';
import { CategoryTreeSelectComponent } from '../../../shared/components/category-tree-select/category-tree-select.component';
import { HsnSearchComponent } from '../../../shared/components/hsn-search/hsn-search.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AiGenerateButtonComponent } from '../../../shared/components/ai-generate-button/ai-generate-button.component';
import { VariantManagerComponent } from '../variant-manager/variant-manager.component';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    TagInputComponent,
    CategoryTreeSelectComponent,
    HsnSearchComponent,
    ImageUploaderComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent,
    AiGenerateButtonComponent,
    VariantManagerComponent,
    IndianCurrencyPipe,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto pb-24">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/products" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Edit Product' : 'New Product' }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ isEditMode ? 'Update product details' : 'Fill in the details to create a new product' }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <app-loading-skeleton [lines]="8"></app-loading-skeleton>
        </div>
      </div>

      <!-- Form -->
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSave('ACTIVE')" class="flex flex-col lg:flex-row gap-6">
        <!-- LEFT COLUMN -->
        <div class="flex-1 lg:w-3/5 space-y-6">
          <!-- Basic Info -->
          <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Basic Information</h2>

            <!-- Product Name -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                formControlName="name"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base font-medium shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Enter product name"
              />
              <p *ngIf="form.get('name')?.touched && form.get('name')?.hasError('required')" class="mt-1 text-xs text-red-600">
                Product name is required
              </p>
            </div>

            <!-- Category -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <app-category-tree-select
                formControlName="categoryId"
                (categorySelected)="onCategorySelected($event)"
              ></app-category-tree-select>
              <p *ngIf="form.get('categoryId')?.touched && form.get('categoryId')?.hasError('required')" class="mt-1 text-xs text-red-600">
                Category is required
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Brand -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  formControlName="brand"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Brand name"
                />
              </div>
              <!-- SKU -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  formControlName="sku"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Stock Keeping Unit"
                />
              </div>
            </div>

            <!-- Tags -->
            <div class="mt-4">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-gray-700">Tags</label>
                <app-ai-generate-button
                  label="AI Suggest"
                  [loading]="aiTagsLoading"
                  [preview]="aiTagsPreview"
                  [error]="aiTagsError"
                  [disabled]="!form.get('name')?.value"
                  (generate)="generateTags()"
                  (accept)="acceptTags()"
                  (reject)="aiTagsPreview = null; aiTagsError = null"
                ></app-ai-generate-button>
              </div>
              <app-tag-input formControlName="tags" placeholder="Add tags..."></app-tag-input>
            </div>
          </section>

          <!-- Pricing & Tax -->
          <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Pricing & Tax</h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <!-- MRP -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#8377;</span>
                  <input
                    type="number"
                    formControlName="mrp"
                    class="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <!-- Selling Price -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#8377;</span>
                  <input
                    type="number"
                    formControlName="sellingPrice"
                    class="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <!-- Cost Price -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#8377;</span>
                  <input
                    type="number"
                    formControlName="costPrice"
                    class="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <!-- Margin calculation -->
            <div *ngIf="marginPercent !== null" class="mb-4 p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-4 text-sm">
                <span class="text-gray-600">Margin:</span>
                <span
                  class="font-semibold"
                  [ngClass]="marginPercent >= 0 ? 'text-emerald-600' : 'text-red-600'"
                >
                  {{ marginPercent >= 0 ? '+' : '' }}{{ marginPercent.toFixed(1) }}%
                  ({{ marginAmount | indianCurrency }})
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- GST Rate -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">GST Rate</label>
                <select
                  formControlName="gstRate"
                  class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select GST Rate</option>
                  <option *ngFor="let rate of gstRates; trackBy: trackByValue" [value]="rate.value">{{ rate.displayName }}</option>
                </select>
              </div>
              <!-- HSN Code -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                <app-hsn-search
                  formControlName="hsnCode"
                  (hsnSelected)="onHsnSelected($event)"
                ></app-hsn-search>
              </div>
              <!-- Unit -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  formControlName="unit"
                  class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select Unit</option>
                  <option *ngFor="let u of units; trackBy: trackByValue" [value]="u.value">{{ u.displayName }}</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Description -->
          <section class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-900">Description</h2>
              <app-ai-generate-button
                label="AI Generate"
                [loading]="aiDescLoading"
                [preview]="aiDescPreview"
                [error]="aiDescError"
                [disabled]="!form.get('name')?.value"
                (generate)="generateDescription()"
                (accept)="acceptDescription()"
                (reject)="aiDescPreview = null; aiDescError = null"
              ></app-ai-generate-button>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                formControlName="shortDescription"
                rows="2"
                maxlength="200"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                placeholder="Brief description of the product (max 200 characters)"
              ></textarea>
              <p class="mt-1 text-xs text-gray-400 text-right">
                {{ (form.get('shortDescription')?.value?.length || 0) }}/200
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
              <textarea
                formControlName="longDescription"
                rows="6"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                placeholder="Detailed product description..."
              ></textarea>
            </div>
          </section>

          <!-- Dynamic Attributes -->
          <section *ngIf="dynamicAttributes.length > 0" class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Category Attributes</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div *ngFor="let attr of dynamicAttributes; trackBy: trackByAttrName">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ attr.name }}
                  <span *ngIf="attr.required" class="text-red-500">*</span>
                </label>

                <ng-container [ngSwitch]="attr.type">
                  <!-- Text input -->
                  <input
                    *ngSwitchCase="'text'"
                    type="text"
                    [value]="getDynamicAttrValue(attr.name)"
                    (input)="setDynamicAttrValue(attr.name, $any($event.target).value)"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    [placeholder]="'Enter ' + attr.name"
                  />

                  <!-- Number input -->
                  <div *ngSwitchCase="'number'" class="relative">
                    <input
                      type="number"
                      [value]="getDynamicAttrValue(attr.name)"
                      (input)="setDynamicAttrValue(attr.name, $any($event.target).value)"
                      class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      [placeholder]="'Enter ' + attr.name"
                    />
                    <span *ngIf="attr.unit" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{{ attr.unit }}</span>
                  </div>

                  <!-- Select -->
                  <select
                    *ngSwitchCase="'select'"
                    [value]="getDynamicAttrValue(attr.name)"
                    (change)="setDynamicAttrValue(attr.name, $any($event.target).value)"
                    class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select {{ attr.name }}</option>
                    <option *ngFor="let opt of attr.options; trackBy: trackByIndex" [value]="opt">{{ opt }}</option>
                  </select>

                  <!-- Multi-select (checkboxes) -->
                  <div *ngSwitchCase="'multi-select'" class="space-y-2 pt-1">
                    <label *ngFor="let opt of attr.options; trackBy: trackByIndex" class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="isMultiSelectChecked(attr.name, opt)"
                        (change)="toggleMultiSelect(attr.name, opt)"
                        class="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span class="text-sm text-gray-700">{{ opt }}</span>
                    </label>
                  </div>

                  <!-- Boolean toggle -->
                  <div *ngSwitchCase="'boolean'" class="pt-1">
                    <button
                      type="button"
                      (click)="setDynamicAttrValue(attr.name, getDynamicAttrValue(attr.name) === 'true' ? 'false' : 'true')"
                      [ngClass]="{
                        'bg-emerald-600': getDynamicAttrValue(attr.name) === 'true',
                        'bg-gray-200': getDynamicAttrValue(attr.name) !== 'true'
                      }"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      <span
                        [ngClass]="{
                          'translate-x-5': getDynamicAttrValue(attr.name) === 'true',
                          'translate-x-0': getDynamicAttrValue(attr.name) !== 'true'
                        }"
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      ></span>
                    </button>
                  </div>

                  <!-- Default fallback -->
                  <input
                    *ngSwitchDefault
                    type="text"
                    [value]="getDynamicAttrValue(attr.name)"
                    (input)="setDynamicAttrValue(attr.name, $any($event.target).value)"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </ng-container>
              </div>
            </div>
          </section>

          <!-- Inventory (collapsible) -->
          <section class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              (click)="inventoryOpen = !inventoryOpen"
              class="flex items-center justify-between w-full p-6 text-left"
            >
              <h2 class="text-base font-semibold text-gray-900">Inventory</h2>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform"
                [ngClass]="{'rotate-180': inventoryOpen}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="inventoryOpen" class="px-6 pb-6 border-t border-gray-100 pt-4">
              <!-- Track Inventory Toggle -->
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-sm font-medium text-gray-700">Track Inventory</p>
                  <p class="text-xs text-gray-500">Enable stock tracking for this product</p>
                </div>
                <button
                  type="button"
                  (click)="toggleTrackInventory()"
                  [ngClass]="{
                    'bg-emerald-600': form.get('trackInventory')?.value,
                    'bg-gray-200': !form.get('trackInventory')?.value
                  }"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <span
                    [ngClass]="{
                      'translate-x-5': form.get('trackInventory')?.value,
                      'translate-x-0': !form.get('trackInventory')?.value
                    }"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>

              <div *ngIf="form.get('trackInventory')?.value" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    formControlName="currentStock"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    formControlName="lowStockThreshold"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>

              <!-- Dimensions -->
              <h3 class="text-sm font-medium text-gray-700 mb-3">Dimensions</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Weight (g)</label>
                  <input
                    type="number"
                    formControlName="weightGrams"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    formControlName="lengthCm"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    formControlName="widthCm"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    formControlName="heightCm"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- SEO (collapsible) -->
          <section class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              (click)="seoOpen = !seoOpen"
              class="flex items-center justify-between w-full p-6 text-left"
            >
              <h2 class="text-base font-semibold text-gray-900">SEO</h2>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform"
                [ngClass]="{'rotate-180': seoOpen}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="seoOpen" class="px-6 pb-6 border-t border-gray-100 pt-4">
              <div class="flex justify-end mb-3">
                <app-ai-generate-button
                  label="AI Generate SEO"
                  [loading]="aiSeoLoading"
                  [preview]="aiSeoPreview"
                  [error]="aiSeoError"
                  [disabled]="!form.get('name')?.value"
                  (generate)="generateSeo()"
                  (accept)="acceptSeo()"
                  (reject)="aiSeoPreview = null; aiSeoError = null"
                ></app-ai-generate-button>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  formControlName="seoTitle"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="SEO-friendly title"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  formControlName="seoDescription"
                  rows="2"
                  maxlength="160"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Meta description for search engines (max 160 chars)"
                ></textarea>
                <p class="mt-1 text-xs text-gray-400 text-right">
                  {{ (form.get('seoDescription')?.value?.length || 0) }}/160
                </p>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                <app-tag-input formControlName="seoKeywords" placeholder="Add SEO keywords..."></app-tag-input>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-400">/products/</span>
                  <input
                    type="text"
                    formControlName="slug"
                    class="block flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="auto-generated-slug"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="lg:w-2/5 space-y-6">
          <!-- Images -->
          <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Images</h2>
            <app-image-uploader
              [images]="productImages"
              (filesSelected)="onFilesSelected($event)"
              (imageRemoved)="onImageRemoved($event)"
              (imagesReordered)="onImagesReordered($event)"
              (primaryChanged)="onPrimaryChanged($event)"
            ></app-image-uploader>
          </section>

          <!-- Variants (edit mode only) -->
          <section *ngIf="isEditMode" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              (click)="variantsOpen = !variantsOpen"
              class="flex items-center justify-between w-full p-6 text-left"
            >
              <h2 class="text-base font-semibold text-gray-900">Variants</h2>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform"
                [ngClass]="{'rotate-180': variantsOpen}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div *ngIf="variantsOpen" class="px-6 pb-6 border-t border-gray-100 pt-4">
              <app-variant-manager [productId]="productId"></app-variant-manager>
            </div>
          </section>

          <!-- Status & Visibility -->
          <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Status</h2>

            <div class="space-y-3 mb-4">
              <label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
                [ngClass]="form.get('status')?.value === 'DRAFT' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'"
              >
                <input
                  type="radio"
                  formControlName="status"
                  value="DRAFT"
                  class="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">Draft</p>
                  <p class="text-xs text-gray-500">Save as draft, not visible to customers</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
                [ngClass]="form.get('status')?.value === 'ACTIVE' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'"
              >
                <input
                  type="radio"
                  formControlName="status"
                  value="ACTIVE"
                  class="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">Active</p>
                  <p class="text-xs text-gray-500">Product is live and visible</p>
                </div>
              </label>
            </div>

            <!-- Featured Toggle -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p class="text-sm font-medium text-gray-700">Featured Product</p>
                <p class="text-xs text-gray-500">Highlight in catalogs</p>
              </div>
              <button
                type="button"
                (click)="form.get('featured')?.setValue(!form.get('featured')?.value)"
                [ngClass]="{
                  'bg-emerald-600': form.get('featured')?.value,
                  'bg-gray-200': !form.get('featured')?.value
                }"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <span
                  [ngClass]="{
                    'translate-x-5': form.get('featured')?.value,
                    'translate-x-0': !form.get('featured')?.value
                  }"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                ></span>
              </button>
            </div>
          </section>
        </div>
      </form>

      <!-- Sticky Bottom Bar -->
      <div *ngIf="!loading" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-40">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <button
              *ngIf="isEditMode"
              type="button"
              (click)="showDeleteConfirm = true"
              class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete
            </button>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="onSave('DRAFT')"
              [disabled]="saving"
              class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              (click)="onSave(form.get('status')?.value || 'ACTIVE')"
              [disabled]="saving"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              <svg *ngIf="saving" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Product') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [show]="showDeleteConfirm"
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete Product"
        (confirmed)="deleteProduct()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private productImageService = inject(ProductImageService);
  private categoryService = inject(CategoryService);
  private lookupService = inject(LookupService);
  private aiService = inject(AiService);
  private toast = inject(ToastService);

  trackByValue(index: number, item: any): string {
    return item.value;
  }

  trackByAttrName(index: number, item: any): string {
    return item.name;
  }

  trackByIndex(index: number): number {
    return index;
  }

  form!: FormGroup;
  isEditMode = false;
  loading = false;
  saving = false;
  productId: string = '';
  productImages: ProductImage[] = [];

  // Lookup data
  units: UnitOption[] = [];
  gstRates: GstRateOption[] = [];

  // Dynamic attributes
  dynamicAttributes: AttributeDefinition[] = [];
  dynamicAttrValues: Record<string, any> = {};

  // Collapsible sections
  inventoryOpen = false;
  seoOpen = false;
  variantsOpen = false;

  // Delete confirmation
  showDeleteConfirm = false;

  // AI generation state
  aiDescLoading = false;
  aiDescPreview: string | null = null;
  aiDescError: string | null = null;
  private aiDescLogId: string | null = null;

  aiSeoLoading = false;
  aiSeoPreview: string | null = null;
  aiSeoError: string | null = null;
  private aiSeoResult: AiSeoResult | null = null;

  aiTagsLoading = false;
  aiTagsPreview: string | null = null;
  aiTagsError: string | null = null;
  private aiTagsResult: string[] = [];
  private aiTagsLogId: string | null = null;
  private categoryNameForAi: string = '';

  private destroy$ = new Subject<void>();

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.onSave(this.form.get('status')?.value || 'ACTIVE');
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.loadLookupData();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = id;
      this.loadProduct(id);
    }

    // Auto-generate slug from name
    this.form
      .get('name')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((name: string) => {
        if (!this.isEditMode || !this.form.get('slug')?.value) {
          const slug = this.generateSlug(name);
          this.form.get('slug')?.setValue(slug, { emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get marginPercent(): number | null {
    const selling = this.form.get('sellingPrice')?.value;
    const cost = this.form.get('costPrice')?.value;
    if (!selling || !cost || cost === 0) return null;
    return ((selling - cost) / cost) * 100;
  }

  get marginAmount(): number {
    const selling = this.form.get('sellingPrice')?.value || 0;
    const cost = this.form.get('costPrice')?.value || 0;
    return selling - cost;
  }

  onCategorySelected(category: Category): void {
    this.categoryNameForAi = category.name;
    // Auto-set HSN and GST from category defaults
    if (category.hsnCodeDefault && !this.form.get('hsnCode')?.value) {
      this.form.get('hsnCode')?.setValue(category.hsnCodeDefault);
    }
    if (category.defaultGstRate && !this.form.get('gstRate')?.value) {
      this.form.get('gstRate')?.setValue(category.defaultGstRate);
    }

    // Parse and build dynamic attributes
    if (category.attributesSchema) {
      try {
        this.dynamicAttributes = JSON.parse(category.attributesSchema);
      } catch {
        this.dynamicAttributes = [];
      }
    } else {
      this.dynamicAttributes = [];
    }
  }

  onHsnSelected(hsn: HsnCode): void {
    if (hsn.gstRate && !this.form.get('gstRate')?.value) {
      // Find matching GST rate option
      const match = this.gstRates.find((r) => r.displayName.includes(hsn.gstRate!));
      if (match) {
        this.form.get('gstRate')?.setValue(match.value);
      }
    }
  }

  getDynamicAttrValue(name: string): string {
    return this.dynamicAttrValues[name] || '';
  }

  setDynamicAttrValue(name: string, value: any): void {
    this.dynamicAttrValues[name] = value;
  }

  isMultiSelectChecked(attrName: string, option: string): boolean {
    const val = this.dynamicAttrValues[attrName];
    if (!val) return false;
    const arr = Array.isArray(val) ? val : [];
    return arr.includes(option);
  }

  toggleMultiSelect(attrName: string, option: string): void {
    let arr: string[] = this.dynamicAttrValues[attrName] || [];
    if (!Array.isArray(arr)) arr = [];
    if (arr.includes(option)) {
      arr = arr.filter((o: string) => o !== option);
    } else {
      arr = [...arr, option];
    }
    this.dynamicAttrValues[attrName] = arr;
  }

  toggleTrackInventory(): void {
    const current = this.form.get('trackInventory')?.value;
    this.form.get('trackInventory')?.setValue(!current);
  }

  // Image handlers
  onFilesSelected(files: File[]): void {
    if (!this.isEditMode || !this.productId) {
      this.toast.info('Save the product first to upload images');
      return;
    }
    this.productImageService.uploadImages(this.productId, files).subscribe({
      next: (res) => {
        this.productImages = [...this.productImages, ...res.data];
        this.toast.success('Images uploaded');
      },
      error: () => this.toast.error('Failed to upload images'),
    });
  }

  onImageRemoved(imageId: string): void {
    if (!this.productId) return;
    this.productImageService.deleteImage(this.productId, imageId).subscribe({
      next: () => {
        this.productImages = this.productImages.filter((img) => img.id !== imageId);
        this.toast.success('Image removed');
      },
      error: () => this.toast.error('Failed to remove image'),
    });
  }

  onImagesReordered(imageIds: string[]): void {
    if (!this.productId) return;
    this.productImageService.reorderImages(this.productId, imageIds).subscribe({
      next: () => {
        // Re-sort local images to match new order
        const ordered: ProductImage[] = [];
        for (const id of imageIds) {
          const img = this.productImages.find((i) => i.id === id);
          if (img) ordered.push(img);
        }
        this.productImages = ordered;
      },
      error: () => this.toast.error('Failed to reorder images'),
    });
  }

  onPrimaryChanged(imageId: string): void {
    // Update locally
    this.productImages = this.productImages.map((img) => ({
      ...img,
      primary: img.id === imageId,
    }));
  }

  onSave(status: string): void {
    if (this.form.get('name')?.invalid || this.form.get('categoryId')?.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please fill in all required fields');
      return;
    }

    this.saving = true;
    const data = this.buildPayload(status);

    const request$ = this.isEditMode
      ? this.productService.updateProduct(this.productId, data)
      : this.productService.createProduct(data);

    request$.subscribe({
      next: (res) => {
        this.saving = false;
        this.toast.success(
          this.isEditMode ? 'Product updated successfully' : 'Product created successfully'
        );
        if (!this.isEditMode) {
          this.router.navigate(['/products', res.data.id, 'edit']);
        }
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Failed to save product');
      },
    });
  }

  deleteProduct(): void {
    if (!this.productId) return;
    this.productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.router.navigate(['/products']);
      },
      error: () => {
        this.toast.error('Failed to delete product');
        this.showDeleteConfirm = false;
      },
    });
  }

  // --- AI generation methods ---

  generateDescription(): void {
    this.aiDescLoading = true;
    this.aiDescPreview = null;
    this.aiDescError = null;
    this.aiService.generateDescription({
      productName: this.form.get('name')?.value,
      categoryName: this.selectedCategoryName,
      brand: this.form.get('brand')?.value || undefined,
      attributes: Object.keys(this.dynamicAttrValues).length > 0 ? this.dynamicAttrValues : undefined,
    }).subscribe({
      next: (res) => {
        this.aiDescLoading = false;
        this.aiDescPreview = res.data.generatedText;
        this.aiDescLogId = res.data.logId;
      },
      error: (err) => {
        this.aiDescLoading = false;
        this.aiDescError = err.error?.message || 'AI generation failed. Check AI settings.';
      },
    });
  }

  acceptDescription(): void {
    if (this.aiDescPreview) {
      this.form.get('longDescription')?.setValue(this.aiDescPreview);
      if (this.aiDescLogId) {
        this.aiService.acceptGeneration(this.aiDescLogId, true).subscribe();
      }
    }
    this.aiDescPreview = null;
  }

  generateSeo(): void {
    this.aiSeoLoading = true;
    this.aiSeoPreview = null;
    this.aiSeoError = null;
    this.seoOpen = true;
    this.aiService.generateSeo({
      productName: this.form.get('name')?.value,
      categoryName: this.selectedCategoryName,
      description: this.form.get('longDescription')?.value || this.form.get('shortDescription')?.value || undefined,
    }).subscribe({
      next: (res) => {
        this.aiSeoLoading = false;
        this.aiSeoResult = res.data;
        this.aiSeoPreview = `Title: ${res.data.seoTitle}\nDescription: ${res.data.seoDescription}\nKeywords: ${(res.data.seoKeywords || []).join(', ')}`;
      },
      error: (err) => {
        this.aiSeoLoading = false;
        this.aiSeoError = err.error?.message || 'AI generation failed. Check AI settings.';
      },
    });
  }

  acceptSeo(): void {
    if (this.aiSeoResult) {
      this.form.get('seoTitle')?.setValue(this.aiSeoResult.seoTitle);
      this.form.get('seoDescription')?.setValue(this.aiSeoResult.seoDescription);
      this.form.get('seoKeywords')?.setValue(this.aiSeoResult.seoKeywords || []);
      if (this.aiSeoResult.logId) {
        this.aiService.acceptGeneration(this.aiSeoResult.logId, true).subscribe();
      }
    }
    this.aiSeoPreview = null;
    this.aiSeoResult = null;
  }

  generateTags(): void {
    this.aiTagsLoading = true;
    this.aiTagsPreview = null;
    this.aiTagsError = null;
    this.aiService.suggestTags({
      productName: this.form.get('name')?.value,
      categoryName: this.selectedCategoryName,
      brand: this.form.get('brand')?.value || undefined,
      description: this.form.get('longDescription')?.value || undefined,
    }).subscribe({
      next: (res) => {
        this.aiTagsLoading = false;
        const text = res.data.generatedText;
        this.aiTagsResult = text.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        this.aiTagsPreview = this.aiTagsResult.join(', ');
        this.aiTagsLogId = res.data.logId;
      },
      error: (err) => {
        this.aiTagsLoading = false;
        this.aiTagsError = err.error?.message || 'AI generation failed. Check AI settings.';
      },
    });
  }

  acceptTags(): void {
    if (this.aiTagsResult.length > 0) {
      const existing: string[] = this.form.get('tags')?.value || [];
      const merged = [...new Set([...existing, ...this.aiTagsResult])];
      this.form.get('tags')?.setValue(merged);
      if (this.aiTagsLogId) {
        this.aiService.acceptGeneration(this.aiTagsLogId, true).subscribe();
      }
    }
    this.aiTagsPreview = null;
    this.aiTagsResult = [];
  }

  private get selectedCategoryName(): string | undefined {
    return this.categoryNameForAi || undefined;
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      brand: [''],
      sku: [''],
      tags: [[]],
      mrp: [null],
      sellingPrice: [null],
      costPrice: [null],
      gstRate: [''],
      hsnCode: [''],
      unit: [''],
      shortDescription: [''],
      longDescription: [''],
      trackInventory: [false],
      currentStock: [null],
      lowStockThreshold: [10],
      weightGrams: [null],
      lengthCm: [null],
      widthCm: [null],
      heightCm: [null],
      seoTitle: [''],
      seoDescription: [''],
      seoKeywords: [[]],
      slug: [''],
      status: ['DRAFT'],
      featured: [false],
    });
  }

  private loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (res) => {
        const product = res.data;
        this.patchForm(product);
        this.productImages = product.images || [];
        this.categoryNameForAi = product.categoryName || '';

        // Parse custom attributes
        if (product.customAttributes) {
          try {
            this.dynamicAttrValues = JSON.parse(product.customAttributes);
          } catch {
            this.dynamicAttrValues = {};
          }
        }

        // Load category for dynamic attributes
        if (product.categoryId) {
          this.categoryService.getCategory(product.categoryId).subscribe({
            next: (catRes) => {
              if (catRes.data.attributesSchema) {
                try {
                  this.dynamicAttributes = JSON.parse(catRes.data.attributesSchema);
                } catch {
                  this.dynamicAttributes = [];
                }
              }
            },
          });
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load product');
        this.router.navigate(['/products']);
      },
    });
  }

  private patchForm(product: Product): void {
    this.form.patchValue({
      name: product.name,
      categoryId: product.categoryId,
      brand: product.brand,
      sku: product.sku,
      tags: product.tags || [],
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      gstRate: product.gstRate || '',
      hsnCode: product.hsnCode || '',
      unit: product.unit || '',
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || '',
      trackInventory: product.trackInventory,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold,
      weightGrams: product.weightGrams,
      lengthCm: product.lengthCm,
      widthCm: product.widthCm,
      heightCm: product.heightCm,
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      seoKeywords: product.seoKeywords || [],
      slug: product.slug || '',
      status: product.status,
      featured: product.featured,
    });

    // Open inventory section if tracking
    if (product.trackInventory) {
      this.inventoryOpen = true;
    }
  }

  private buildPayload(status: string): any {
    const formVal = this.form.getRawValue();
    return {
      name: formVal.name,
      categoryId: formVal.categoryId,
      brand: formVal.brand || null,
      sku: formVal.sku || null,
      tags: formVal.tags,
      mrp: formVal.mrp,
      sellingPrice: formVal.sellingPrice,
      costPrice: formVal.costPrice,
      gstRate: formVal.gstRate || null,
      hsnCode: formVal.hsnCode || null,
      unit: formVal.unit || null,
      shortDescription: formVal.shortDescription || null,
      longDescription: formVal.longDescription || null,
      trackInventory: formVal.trackInventory,
      currentStock: formVal.currentStock,
      lowStockThreshold: formVal.lowStockThreshold,
      weightGrams: formVal.weightGrams,
      lengthCm: formVal.lengthCm,
      widthCm: formVal.widthCm,
      heightCm: formVal.heightCm,
      seoTitle: formVal.seoTitle || null,
      seoDescription: formVal.seoDescription || null,
      seoKeywords: formVal.seoKeywords,
      slug: formVal.slug || null,
      status: status,
      featured: formVal.featured,
      customAttributes:
        Object.keys(this.dynamicAttrValues).length > 0
          ? JSON.stringify(this.dynamicAttrValues)
          : null,
    };
  }

  private loadLookupData(): void {
    this.lookupService.getUnits().subscribe({
      next: (res) => (this.units = res.data),
    });
    this.lookupService.getGstRates().subscribe({
      next: (res) => (this.gstRates = res.data),
    });
  }

  private generateSlug(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
