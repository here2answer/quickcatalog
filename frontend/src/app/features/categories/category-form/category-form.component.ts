import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject, SimpleChanges } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { LookupService } from '../../../core/services/lookup.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryRequest, AttributeDefinition, GstRateOption } from '../../../core/models';
import { CategoryTreeSelectComponent } from '../../../shared/components/category-tree-select/category-tree-select.component';
import { TagInputComponent } from '../../../shared/components/tag-input/tag-input.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    FormsModule,
    CategoryTreeSelectComponent,
    TagInputComponent,
  ],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ category ? 'Edit Category' : (parentId ? 'New Subcategory' : 'New Category') }}
        </h2>
        <button
          *ngIf="category || parentId"
          type="button"
          (click)="cancelled.emit()"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
          <input
            type="text"
            formControlName="name"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Enter category name"
          />
          <p *ngIf="form.get('name')?.touched && form.get('name')?.hasError('required')" class="mt-1 text-xs text-red-600">
            Category name is required
          </p>
        </div>

        <!-- Parent Category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
          <app-category-tree-select formControlName="parentId"></app-category-tree-select>
          <p class="mt-1 text-xs text-gray-400">Leave empty for a root category</p>
        </div>

        <!-- Default HSN -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Default HSN Code</label>
          <input
            type="text"
            formControlName="hsnCodeDefault"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Default HSN code for products in this category"
          />
        </div>

        <!-- Default GST Rate -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Default GST Rate</label>
          <select
            formControlName="defaultGstRate"
            class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select GST Rate</option>
            <option *ngFor="let rate of gstRates; trackBy: trackByValue" [value]="rate.value">{{ rate.displayName }}</option>
          </select>
        </div>

        <!-- Attributes Schema Builder -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">Category Attributes</label>
            <button
              type="button"
              (click)="addAttribute()"
              class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-500"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Attribute
            </button>
          </div>

          <div *ngIf="attributes.length === 0" class="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-lg">
            No attributes defined. Products in this category will only have standard fields.
          </div>

          <div class="space-y-3">
            <div
              *ngFor="let attr of attributes.controls; let i = index; trackBy: trackByIndex"
              [formGroupName]="i.toString()"
              class="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <!-- Attribute Name -->
                <div class="sm:col-span-4">
                  <input
                    type="text"
                    formControlName="name"
                    class="block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Attribute name"
                  />
                </div>

                <!-- Type -->
                <div class="sm:col-span-3">
                  <select
                    formControlName="type"
                    class="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                    <option value="multi-select">Multi-Select</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>

                <!-- Required -->
                <div class="sm:col-span-3 flex items-center gap-2 pt-2 sm:pt-0 sm:justify-center">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      formControlName="required"
                      class="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span class="text-xs text-gray-600">Required</span>
                  </label>
                </div>

                <!-- Remove -->
                <div class="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    (click)="removeAttribute(i)"
                    class="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    title="Remove attribute"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Options (for select/multi-select types) -->
              <div
                *ngIf="attr.get('type')?.value === 'select' || attr.get('type')?.value === 'multi-select'"
                class="mt-3"
              >
                <label class="block text-xs text-gray-500 mb-1">Options</label>
                <app-tag-input
                  formControlName="options"
                  placeholder="Type option and press Enter..."
                ></app-tag-input>
              </div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="errorMessage" class="rounded-md bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            [disabled]="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
          >
            <svg *ngIf="saving" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ saving ? 'Saving...' : (category ? 'Update Category' : 'Create Category') }}
          </button>
          <button
            type="button"
            (click)="cancelled.emit()"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CategoryFormComponent implements OnInit, OnChanges {
  @Input() category: Category | null = null;
  @Input() parentId: string | null = null;
  @Output() saved = new EventEmitter<Category>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private lookupService = inject(LookupService);
  private toast = inject(ToastService);

  trackByValue(index: number, item: any): string {
    return item.value;
  }

  trackByIndex(index: number): number {
    return index;
  }

  form!: FormGroup;
  saving = false;
  errorMessage = '';
  gstRates: GstRateOption[] = [];

  get attributes(): FormArray {
    return this.form.get('attributes') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadGstRates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['category'] || changes['parentId']) && this.form) {
      this.patchForm();
    }
  }

  addAttribute(): void {
    this.attributes.push(
      this.fb.group({
        name: ['', Validators.required],
        type: ['text'],
        options: [[]],
        required: [false],
      })
    );
  }

  removeAttribute(index: number): void {
    this.attributes.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const data = this.buildPayload();
    const request$ = this.category
      ? this.categoryService.updateCategory(this.category.id, data)
      : this.categoryService.createCategory(data);

    request$.subscribe({
      next: (res) => {
        this.saving = false;
        this.toast.success(this.category ? 'Category updated' : 'Category created');
        this.saved.emit(res.data);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Failed to save category';
      },
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      parentId: [''],
      hsnCodeDefault: [''],
      defaultGstRate: [''],
      attributes: this.fb.array([]),
    });
    this.patchForm();
  }

  private patchForm(): void {
    if (!this.form) return;

    // Clear existing attributes
    while (this.attributes.length) {
      this.attributes.removeAt(0);
    }

    if (this.category) {
      this.form.patchValue({
        name: this.category.name,
        parentId: this.category.parentId || '',
        hsnCodeDefault: this.category.hsnCodeDefault || '',
        defaultGstRate: this.category.defaultGstRate || '',
      });

      // Parse attributes schema
      if (this.category.attributesSchema) {
        try {
          const attrs: AttributeDefinition[] = JSON.parse(this.category.attributesSchema);
          attrs.forEach((attr) => {
            this.attributes.push(
              this.fb.group({
                name: [attr.name, Validators.required],
                type: [attr.type],
                options: [attr.options || []],
                required: [attr.required || false],
              })
            );
          });
        } catch {
          // ignore parse errors
        }
      }
    } else {
      this.form.reset({
        name: '',
        parentId: this.parentId || '',
        hsnCodeDefault: '',
        defaultGstRate: '',
      });
    }
  }

  private buildPayload(): CategoryRequest {
    const val = this.form.getRawValue();

    // Build attributes schema
    const attrs: AttributeDefinition[] = val.attributes.map((a: any) => ({
      name: a.name,
      type: a.type,
      options: ['select', 'multi-select'].includes(a.type) ? a.options : undefined,
      required: a.required,
    }));

    return {
      name: val.name,
      parentId: val.parentId || undefined,
      hsnCodeDefault: val.hsnCodeDefault || undefined,
      defaultGstRate: val.defaultGstRate || undefined,
      attributesSchema: attrs.length > 0 ? JSON.stringify(attrs) : undefined,
    };
  }

  private loadGstRates(): void {
    this.lookupService.getGstRates().subscribe({
      next: (res) => (this.gstRates = res.data),
    });
  }
}
