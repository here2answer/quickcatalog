import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImportService } from '../services/import.service';
import { ToastService } from '../../../core/services/toast.service';
import { ImportJob, ImportError } from '../../../core/models';
import { interval, switchMap, takeWhile, tap } from 'rxjs';

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  template: `
    <div class="p-6 lg:p-8 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Bulk Import Products</h1>
        <button (click)="downloadTemplate()"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Download Template
        </button>
      </div>

      <!-- Upload Zone -->
      <div *ngIf="!job" class="bg-white rounded-xl border border-gray-200 p-8">
        <div class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-emerald-400 transition cursor-pointer"
             (click)="fileInput.click()"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)">
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p class="text-base font-medium text-gray-700 mb-1">Drop your CSV or Excel file here</p>
          <p class="text-sm text-gray-500">or click to browse. Max 5MB, .csv / .xlsx / .xls</p>
          <input #fileInput type="file" accept=".csv,.xlsx,.xls" class="hidden" (change)="onFileSelect($event)">
        </div>
        <p *ngIf="uploading" class="text-sm text-gray-500 mt-4 text-center">Uploading...</p>
      </div>

      <!-- Progress Section -->
      <div *ngIf="job" class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ job.fileName }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ job.totalRows }} rows detected</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-medium"
                [class]="statusClass">
            {{ job.status }}
          </span>
        </div>

        <!-- Progress bar -->
        <div *ngIf="job.status === 'PROCESSING' || job.status === 'COMPLETED'">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{{ job.processedRows }} / {{ job.totalRows }}</span>
          </div>
          <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-2.5 bg-emerald-500 rounded-full transition-all duration-500"
                 [style.width.%]="progressPercent"></div>
          </div>
        </div>

        <!-- Counts -->
        <div *ngIf="job.status === 'COMPLETED' || job.status === 'FAILED'"
             class="grid grid-cols-2 gap-4">
          <div class="bg-emerald-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-emerald-600">{{ job.successCount }}</p>
            <p class="text-xs text-emerald-700">Imported Successfully</p>
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-red-600">{{ job.errorCount }}</p>
            <p class="text-xs text-red-700">Failed</p>
          </div>
        </div>

        <!-- Error Table -->
        <div *ngIf="errors.length > 0" class="mt-4">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Import Errors</h3>
          <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Row</th>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Field</th>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Error</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr *ngFor="let err of errors">
                  <td class="px-4 py-2 text-gray-700">{{ err.row }}</td>
                  <td class="px-4 py-2 text-gray-700 font-medium">{{ err.field }}</td>
                  <td class="px-4 py-2 text-red-600">{{ err.error }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-2">
          <button *ngIf="job.status === 'COMPLETED' || job.status === 'FAILED'"
                  (click)="reset()"
                  class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Import Another File
          </button>
          <a routerLink="/products"
             class="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500">
            Go to Products
          </a>
        </div>
      </div>
    </div>
  `,
})
export class BulkImportComponent {
  private importService = inject(ImportService);
  private toast = inject(ToastService);

  job: ImportJob | null = null;
  errors: ImportError[] = [];
  uploading = false;

  get progressPercent(): number {
    if (!this.job || this.job.totalRows === 0) return 0;
    return Math.round((this.job.processedRows / this.job.totalRows) * 100);
  }

  get statusClass(): string {
    if (!this.job) return '';
    switch (this.job.status) {
      case 'UPLOADED': return 'bg-blue-100 text-blue-700';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  downloadTemplate(): void {
    this.importService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Failed to download template'),
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File too large. Maximum 5MB.');
      return;
    }

    this.uploading = true;
    this.importService.uploadFile(file).subscribe({
      next: (res) => {
        this.job = res.data;
        this.uploading = false;
        this.pollStatus();
      },
      error: () => {
        this.uploading = false;
        this.toast.error('Upload failed');
      },
    });
  }

  private pollStatus(): void {
    if (!this.job) return;

    interval(2000).pipe(
      switchMap(() => this.importService.getStatus(this.job!.id)),
      tap(res => {
        this.job = res.data;
        if (res.data.errors) {
          this.errors = res.data.errors;
        }
      }),
      takeWhile(res => res.data.status === 'UPLOADED' || res.data.status === 'PROCESSING', true),
    ).subscribe({
      complete: () => {
        if (this.job?.status === 'COMPLETED') {
          this.toast.success(`Imported ${this.job.successCount} products`);
        }
      },
    });
  }

  reset(): void {
    this.job = null;
    this.errors = [];
  }
}
