import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  forwardRef,
  ElementRef,
  HostListener,
} from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Category } from '../../../core/models';
import { CategoryService } from '../../../features/categories/services/category.service';

interface FlatCategory {
  id: string;
  name: string;
  depth: number;
  path: string[];
  category: Category;
}

@Component({
  selector: 'app-category-tree-select',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryTreeSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative">
      <!-- Trigger button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        [disabled]="isDisabled"
        class="relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-left text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span *ngIf="selectedCategory" class="block truncate text-gray-900">
          {{ breadcrumb }}
        </span>
        <span *ngIf="!selectedCategory" class="block truncate text-gray-400">
          Select a category...
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd"/>
          </svg>
        </span>
      </button>

      <!-- Dropdown -->
      <div
        *ngIf="isOpen"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div *ngIf="loading" class="px-4 py-3 text-gray-500">Loading categories...</div>
        <div *ngIf="!loading && flatCategories.length === 0" class="px-4 py-3 text-gray-500">
          No categories found
        </div>
        <button
          type="button"
          *ngFor="let item of flatCategories; trackBy: trackByCategoryId"
          (click)="selectCategory(item)"
          class="relative w-full cursor-pointer select-none py-2 pr-9 hover:bg-emerald-50 text-left"
          [style.paddingLeft.px]="16 + item.depth * 20"
          [ngClass]="{
            'bg-emerald-50 text-emerald-700': item.id === value,
            'text-gray-900': item.id !== value
          }"
        >
          <span class="flex items-center gap-1.5">
            <svg *ngIf="item.depth > 0" class="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <span [class.font-medium]="item.id === value">{{ item.name }}</span>
          </span>
          <span *ngIf="item.id === value" class="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  `,
})
export class CategoryTreeSelectComponent implements ControlValueAccessor, OnInit {
  @Output() categorySelected = new EventEmitter<Category>();

  trackByCategoryId(index: number, item: any): string {
    return item.id;
  }

  isOpen = false;
  loading = false;
  isDisabled = false;
  categories: Category[] = [];
  flatCategories: FlatCategory[] = [];
  selectedCategory: Category | null = null;
  value: string = '';
  breadcrumb: string = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private categoryService: CategoryService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  writeValue(value: string | null): void {
    this.value = value || '';
    if (this.flatCategories.length > 0) {
      this.updateSelection();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  toggleDropdown(): void {
    if (!this.isDisabled) {
      this.isOpen = !this.isOpen;
    }
  }

  selectCategory(item: FlatCategory): void {
    this.value = item.id;
    this.selectedCategory = item.category;
    this.breadcrumb = item.path.join(' > ');
    this.isOpen = false;
    this.onChange(this.value);
    this.onTouched();
    this.categorySelected.emit(item.category);
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategoryTree().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.flatCategories = this.flattenTree(this.categories, 0, []);
        this.loading = false;
        if (this.value) {
          this.updateSelection();
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private flattenTree(
    categories: Category[],
    depth: number,
    parentPath: string[]
  ): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const cat of categories) {
      const path = [...parentPath, cat.name];
      result.push({
        id: cat.id,
        name: cat.name,
        depth,
        path,
        category: cat,
      });
      if (cat.children && cat.children.length > 0) {
        result.push(...this.flattenTree(cat.children, depth + 1, path));
      }
    }
    return result;
  }

  private updateSelection(): void {
    const found = this.flatCategories.find((fc) => fc.id === this.value);
    if (found) {
      this.selectedCategory = found.category;
      this.breadcrumb = found.path.join(' > ');
    }
  }
}
