import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VariantService } from '../services/variant.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductVariant } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IndianCurrencyPipe } from '../../../shared/pipes/indian-currency.pipe';

@Component({
  selector: 'app-variant-manager',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DecimalPipe, ConfirmDialogComponent, IndianCurrencyPipe],
  template: `
    <div>
      <!-- Variant Generator -->
      <div *ngIf="!variants.length && !showAddForm" class="text-center py-6">
        <svg class="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p class="mt-2 text-sm text-gray-500">No variants yet</p>
        <div class="mt-3 flex items-center justify-center gap-2">
          <button type="button" (click)="showAddForm = true"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition">
            Add Variant
          </button>
          <button type="button" (click)="showGeneratePanel = !showGeneratePanel"
            class="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Auto-Generate
          </button>
        </div>
      </div>

      <!-- Generate panel -->
      <div *ngIf="showGeneratePanel" class="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
        <h4 class="text-sm font-medium text-violet-900 mb-3">Generate Variants from Attributes</h4>
        <p class="text-xs text-gray-600 mb-3">Enter attribute names and their values. Variants will be created for all combinations.</p>

        <div *ngFor="let attr of generateAttrs; let i = index; trackBy: trackByIndex" class="flex items-center gap-2 mb-2">
          <input type="text" [(ngModel)]="attr.name" placeholder="Attribute (e.g. Color)"
            class="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <input type="text" [(ngModel)]="attr.values" placeholder="Values comma-separated (e.g. Red, Blue)"
            class="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
          <button type="button" (click)="generateAttrs.splice(i, 1)" class="text-gray-400 hover:text-red-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex items-center gap-2 mt-3">
          <button type="button" (click)="generateAttrs.push({name: '', values: ''})"
            class="text-xs text-violet-700 hover:underline">+ Add Attribute</button>
          <div class="flex-1"></div>
          <button type="button" (click)="showGeneratePanel = false"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" (click)="onGenerate()" [disabled]="generating"
            class="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50">
            {{ generating ? 'Generating...' : 'Generate' }}
          </button>
        </div>
      </div>

      <!-- Variants list -->
      <div *ngIf="variants.length > 0">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm text-gray-500">{{ variants.length }} variant{{ variants.length > 1 ? 's' : '' }}</p>
          <div class="flex items-center gap-2">
            <button type="button" (click)="showGeneratePanel = !showGeneratePanel"
              class="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Auto-Generate
            </button>
            <button type="button" (click)="showAddForm = true"
              class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition">
              + Add
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 text-xs">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-500 uppercase">Name</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500 uppercase">SKU</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500 uppercase">Price</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500 uppercase">Stock</th>
                <th class="px-3 py-2 text-center font-medium text-gray-500 uppercase">Active</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr *ngFor="let v of variants; trackBy: trackByVariantId">
                <td class="px-3 py-2 font-medium text-gray-900">{{ v.variantName }}</td>
                <td class="px-3 py-2 text-gray-500">{{ v.sku || '-' }}</td>
                <td class="px-3 py-2 text-right text-gray-900">{{ v.sellingPrice | indianCurrency }}</td>
                <td class="px-3 py-2 text-right text-gray-500">{{ v.currentStock ?? '-' }}</td>
                <td class="px-3 py-2 text-center">
                  <span [ngClass]="v.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'"
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
                    {{ v.active ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right">
                  <button type="button" (click)="startEdit(v)" class="text-gray-400 hover:text-emerald-600 mr-2" title="Edit">
                    <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button type="button" (click)="confirmDelete(v)" class="text-gray-400 hover:text-red-600" title="Delete">
                    <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit form (inline) -->
      <div *ngIf="showAddForm || editingVariant" class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 class="text-sm font-medium text-gray-900 mb-3">{{ editingVariant ? 'Edit Variant' : 'Add Variant' }}</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Variant Name *</label>
            <input type="text" [(ngModel)]="variantForm.variantName"
              class="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Red - Large" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">SKU</label>
            <input type="text" [(ngModel)]="variantForm.sku"
              class="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Variant SKU" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Selling Price</label>
            <input type="number" [(ngModel)]="variantForm.sellingPrice" step="0.01" min="0"
              class="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="0.00" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">MRP</label>
            <input type="number" [(ngModel)]="variantForm.mrp" step="0.01" min="0"
              class="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="0.00" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Cost Price</label>
            <input type="number" [(ngModel)]="variantForm.costPrice" step="0.01" min="0"
              class="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="0.00" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
            <input type="number" [(ngModel)]="variantForm.currentStock" min="0"
              class="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="0" />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <button type="button" (click)="cancelForm()"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" (click)="saveVariant()" [disabled]="savingVariant"
            class="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
            {{ savingVariant ? 'Saving...' : (editingVariant ? 'Update' : 'Add') }}
          </button>
        </div>
      </div>

      <!-- Delete confirmation -->
      <app-confirm-dialog
        [show]="showDeleteConfirm"
        title="Delete Variant"
        message="Are you sure you want to delete this variant?"
        confirmLabel="Delete"
        (confirmed)="deleteVariant()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
})
export class VariantManagerComponent implements OnInit, OnChanges {
  private variantService = inject(VariantService);
  private toast = inject(ToastService);

  @Input() productId!: string;
  variants: ProductVariant[] = [];

  showAddForm = false;
  showGeneratePanel = false;
  showDeleteConfirm = false;
  editingVariant: ProductVariant | null = null;
  deletingVariant: ProductVariant | null = null;
  generating = false;
  savingVariant = false;

  variantForm: Partial<ProductVariant> = {};
  generateAttrs: { name: string; values: string }[] = [
    { name: '', values: '' },
  ];

  trackByIndex(index: number): number { return index; }
  trackByVariantId(index: number, v: ProductVariant): string { return v.id; }

  ngOnInit(): void {
    if (this.productId) this.loadVariants();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.loadVariants();
    }
  }

  private loadVariants(): void {
    this.variantService.list(this.productId).subscribe({
      next: (res) => this.variants = res.data || [],
      error: () => this.toast.error('Failed to load variants'),
    });
  }

  startEdit(v: ProductVariant): void {
    this.editingVariant = v;
    this.showAddForm = false;
    this.variantForm = { ...v };
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingVariant = null;
    this.variantForm = {};
  }

  saveVariant(): void {
    if (!this.variantForm.variantName?.trim()) {
      this.toast.warning('Variant name is required');
      return;
    }

    this.savingVariant = true;

    if (this.editingVariant) {
      this.variantService.update(this.productId, this.editingVariant.id, this.variantForm).subscribe({
        next: (res) => {
          const idx = this.variants.findIndex(v => v.id === this.editingVariant!.id);
          if (idx >= 0) this.variants[idx] = res.data;
          this.cancelForm();
          this.savingVariant = false;
          this.toast.success('Variant updated');
        },
        error: () => {
          this.savingVariant = false;
          this.toast.error('Failed to update variant');
        },
      });
    } else {
      this.variantService.create(this.productId, this.variantForm).subscribe({
        next: (res) => {
          this.variants.push(res.data);
          this.cancelForm();
          this.savingVariant = false;
          this.toast.success('Variant added');
        },
        error: () => {
          this.savingVariant = false;
          this.toast.error('Failed to add variant');
        },
      });
    }
  }

  confirmDelete(v: ProductVariant): void {
    this.deletingVariant = v;
    this.showDeleteConfirm = true;
  }

  deleteVariant(): void {
    if (!this.deletingVariant) return;
    this.variantService.delete(this.productId, this.deletingVariant.id).subscribe({
      next: () => {
        this.variants = this.variants.filter(v => v.id !== this.deletingVariant!.id);
        this.showDeleteConfirm = false;
        this.deletingVariant = null;
        this.toast.success('Variant deleted');
      },
      error: () => {
        this.showDeleteConfirm = false;
        this.toast.error('Failed to delete variant');
      },
    });
  }

  onGenerate(): void {
    const combos: Record<string, string[]> = {};
    for (const attr of this.generateAttrs) {
      if (attr.name.trim() && attr.values.trim()) {
        combos[attr.name.trim()] = attr.values.split(',').map(v => v.trim()).filter(v => v);
      }
    }
    if (Object.keys(combos).length === 0) {
      this.toast.warning('Enter at least one attribute with values');
      return;
    }

    this.generating = true;
    this.variantService.generate(this.productId, combos).subscribe({
      next: (res) => {
        this.variants = [...this.variants, ...(res.data || [])];
        this.showGeneratePanel = false;
        this.generating = false;
        this.toast.success(`Generated ${res.data?.length || 0} variants`);
      },
      error: (err) => {
        this.generating = false;
        this.toast.error(err.error?.message || 'Failed to generate variants');
      },
    });
  }
}
