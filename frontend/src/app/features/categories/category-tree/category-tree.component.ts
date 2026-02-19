import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass, NgTemplateOutlet } from '@angular/common';
import { CategoryService } from '../services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    NgTemplateOutlet,
    CategoryFormComponent,
    ConfirmDialogComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
          <p class="mt-1 text-sm text-gray-500">Organize your products into categories</p>
        </div>
        <button
          (click)="startCreate()"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Category
        </button>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left: Category Tree -->
        <div class="lg:w-1/2">
          <div class="bg-white rounded-xl border border-gray-200">
            <!-- Loading -->
            <div *ngIf="loading" class="p-6">
              <app-loading-skeleton [lines]="6"></app-loading-skeleton>
            </div>

            <!-- Empty -->
            <div *ngIf="!loading && categories.length === 0">
              <app-empty-state
                title="No categories yet"
                message="Create your first category to organize products."
                actionLabel="Add Category"
                (actionClicked)="startCreate()"
              ></app-empty-state>
            </div>

            <!-- Tree -->
            <div *ngIf="!loading && categories.length > 0" class="py-2">
              <ng-container *ngTemplateOutlet="treeTemplate; context: { $implicit: categories, depth: 0 }"></ng-container>
            </div>
          </div>
        </div>

        <!-- Right: Form Panel -->
        <div class="lg:w-1/2">
          <div *ngIf="!showForm" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <p class="mt-2 text-sm text-gray-500">Select a category to edit, or create a new one.</p>
          </div>

          <app-category-form
            *ngIf="showForm"
            [category]="editingCategory"
            [parentId]="newParentId"
            (saved)="onSaved($event)"
            (cancelled)="closeForm()"
          ></app-category-form>
        </div>
      </div>

      <!-- Delete confirmation -->
      <app-confirm-dialog
        [show]="showDeleteDialog"
        title="Delete Category"
        [message]="'Are you sure you want to delete &quot;' + (deletingCategory?.name || '') + '&quot;? Products in this category will not be deleted.'"
        confirmLabel="Delete"
        (confirmed)="deleteCategory()"
        (cancelled)="showDeleteDialog = false"
      ></app-confirm-dialog>
    </div>

    <!-- Recursive tree template -->
    <ng-template #treeTemplate let-nodes let-depth="depth">
      <div *ngFor="let node of nodes; trackBy: trackByCategoryId">
        <div
          class="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors"
          [style.paddingLeft.px]="16 + depth * 24"
          [ngClass]="{'bg-emerald-50': editingCategory?.id === node.id}"
          (click)="startEdit(node)"
        >
          <!-- Expand/collapse -->
          <button
            *ngIf="node.children?.length"
            type="button"
            (click)="toggleExpanded(node.id); $event.stopPropagation()"
            class="p-0.5 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg
              class="w-4 h-4 transition-transform"
              [ngClass]="{'rotate-90': isExpanded(node.id)}"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <span *ngIf="!node.children?.length" class="w-5"></span>

          <!-- Folder icon -->
          <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
          </svg>

          <!-- Name -->
          <span class="text-sm text-gray-900 flex-1 truncate" [class.font-medium]="editingCategory?.id === node.id">
            {{ node.name }}
          </span>

          <!-- Actions (visible on hover) -->
          <div class="hidden group-hover:flex items-center gap-0.5" (click)="$event.stopPropagation()">
            <button
              (click)="startCreateSub(node.id)"
              class="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-emerald-50"
              title="Add subcategory"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
            <button
              (click)="startEdit(node)"
              class="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
              title="Edit"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              (click)="confirmDelete(node)"
              class="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
              title="Delete"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>

          <!-- Children count badge -->
          <span *ngIf="node.children?.length" class="text-xs text-gray-400 mr-1 group-hover:hidden">
            {{ node.children.length }}
          </span>
        </div>

        <!-- Children (recursive) -->
        <div *ngIf="node.children?.length && isExpanded(node.id)">
          <ng-container *ngTemplateOutlet="treeTemplate; context: { $implicit: node.children, depth: depth + 1 }"></ng-container>
        </div>
      </div>
    </ng-template>
  `,
})
export class CategoryTreeComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  trackByCategoryId(index: number, item: any): string {
    return item.id;
  }

  categories: Category[] = [];
  loading = true;

  // Form state
  showForm = false;
  editingCategory: Category | null = null;
  newParentId: string | null = null;

  // Delete state
  showDeleteDialog = false;
  deletingCategory: Category | null = null;

  // Expand/collapse state
  expandedIds = new Set<string>();

  ngOnInit(): void {
    this.loadCategories();
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  toggleExpanded(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  startCreate(): void {
    this.editingCategory = null;
    this.newParentId = null;
    this.showForm = true;
  }

  startCreateSub(parentId: string): void {
    this.editingCategory = null;
    this.newParentId = parentId;
    this.showForm = true;
    // Auto-expand parent
    this.expandedIds.add(parentId);
  }

  startEdit(category: Category): void {
    this.editingCategory = category;
    this.newParentId = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCategory = null;
    this.newParentId = null;
  }

  confirmDelete(category: Category): void {
    this.deletingCategory = category;
    this.showDeleteDialog = true;
  }

  deleteCategory(): void {
    if (!this.deletingCategory) return;
    this.categoryService.deleteCategory(this.deletingCategory.id).subscribe({
      next: () => {
        this.toast.success('Category deleted');
        this.showDeleteDialog = false;
        if (this.editingCategory?.id === this.deletingCategory?.id) {
          this.closeForm();
        }
        this.deletingCategory = null;
        this.loadCategories();
      },
      error: () => {
        this.toast.error('Failed to delete category');
        this.showDeleteDialog = false;
      },
    });
  }

  onSaved(category: Category): void {
    this.closeForm();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategoryTree().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load categories');
      },
    });
  }
}
