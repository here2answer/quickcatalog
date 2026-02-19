import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductImage } from '../../../core/models';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DragDropModule],
  template: `
    <!-- Drop zone -->
    <div
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onFileDrop($event)"
      (click)="fileInput.click()"
      [ngClass]="{
        'border-emerald-500 bg-emerald-50': isDragOver,
        'border-gray-300 bg-white': !isDragOver
      }"
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
    >
      <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <p class="mt-2 text-sm text-gray-600">
        <span class="font-semibold text-emerald-600">Click to upload</span> or drag and drop
      </p>
      <p class="mt-1 text-xs text-gray-500">PNG, JPG, WebP up to 5MB each</p>
      <input
        #fileInput
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        (change)="onFileSelect($event)"
        class="hidden"
      />
    </div>

    <!-- Preview grid -->
    <div
      *ngIf="allImages.length > 0"
      cdkDropList
      [cdkDropListData]="allImages"
      (cdkDropListDropped)="onReorder($event)"
      class="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3"
      [cdkDropListOrientation]="'horizontal'"
    >
      <div
        *ngFor="let img of allImages; let i = index; trackBy: trackByImageId"
        cdkDrag
        class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-move"
      >
        <img
          [src]="img.thumbnailUrl || img.originalUrl"
          [alt]="img.altText || 'Product image'"
          class="w-full h-full object-cover"
        />

        <!-- Primary badge -->
        <span
          *ngIf="img.primary"
          class="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded"
        >
          Primary
        </span>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <!-- Set as primary -->
          <button
            *ngIf="!img.primary"
            type="button"
            (click)="setPrimary(img.id); $event.stopPropagation()"
            class="p-1.5 bg-white rounded-full text-gray-700 hover:text-emerald-600 shadow-sm"
            title="Set as primary"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </button>
          <!-- Delete -->
          <button
            type="button"
            (click)="removeImage(img.id); $event.stopPropagation()"
            class="p-1.5 bg-white rounded-full text-gray-700 hover:text-red-600 shadow-sm"
            title="Delete image"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <!-- Drag handle indicator -->
        <div class="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- New file previews (not yet uploaded) -->
    <div *ngIf="newFilePreviews.length > 0" class="mt-4">
      <p class="text-xs text-gray-500 mb-2">Pending upload ({{ newFilePreviews.length }} files)</p>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <div
          *ngFor="let preview of newFilePreviews; let i = index; trackBy: trackByIndex"
          class="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-emerald-300 bg-emerald-50"
        >
          <img [src]="preview" class="w-full h-full object-cover opacity-70" />
          <button
            type="button"
            (click)="removeNewFile(i)"
            class="absolute top-1 right-1 p-1 bg-white rounded-full text-gray-500 hover:text-red-600 shadow-sm"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ImageUploaderComponent {
  @Input() images: ProductImage[] = [];
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() imageRemoved = new EventEmitter<string>();
  @Output() imagesReordered = new EventEmitter<string[]>();
  @Output() primaryChanged = new EventEmitter<string>();

  isDragOver = false;
  newFiles: File[] = [];
  newFilePreviews: string[] = [];

  trackByImageId(index: number, item: any): string {
    return item.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  get allImages(): ProductImage[] {
    return this.images || [];
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onReorder(event: CdkDragDrop<ProductImage[]>): void {
    const images = [...this.allImages];
    moveItemInArray(images, event.previousIndex, event.currentIndex);
    this.imagesReordered.emit(images.map((img) => img.id));
  }

  removeImage(imageId: string): void {
    this.imageRemoved.emit(imageId);
  }

  setPrimary(imageId: string): void {
    this.primaryChanged.emit(imageId);
  }

  removeNewFile(index: number): void {
    this.newFiles.splice(index, 1);
    this.newFilePreviews.splice(index, 1);
  }

  private handleFiles(files: File[]): void {
    const imageFiles = files.filter((f) =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(f.type)
    );

    for (const file of imageFiles) {
      this.newFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newFilePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    this.filesSelected.emit(imageFiles);
  }
}
