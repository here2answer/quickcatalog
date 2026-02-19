import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ai-generate-button',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="inline-flex flex-col items-end">
      <!-- Generate button -->
      <button
        type="button"
        (click)="onGenerate()"
        [disabled]="loading || disabled"
        class="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <svg *ngIf="!loading" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <svg *ngIf="loading" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ loading ? 'Generating...' : label }}
      </button>

      <!-- Error message -->
      <p *ngIf="error" class="mt-1 text-xs text-red-500">{{ error }}</p>

      <!-- Preview panel -->
      <div *ngIf="preview && !loading" class="mt-2 w-full rounded-lg border border-violet-200 bg-violet-50 p-3">
        <p class="text-xs text-gray-500 mb-1">AI Suggestion:</p>
        <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ preview }}</p>
        <div class="flex items-center gap-2 mt-2">
          <button
            type="button"
            (click)="onAccept()"
            class="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Accept
          </button>
          <button
            type="button"
            (click)="onReject()"
            class="inline-flex items-center gap-1 rounded-md bg-white border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AiGenerateButtonComponent {
  @Input() label = 'AI Generate';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() preview: string | null = null;
  @Input() error: string | null = null;

  @Output() generate = new EventEmitter<void>();
  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();

  onGenerate(): void {
    this.generate.emit();
  }

  onAccept(): void {
    this.accept.emit();
  }

  onReject(): void {
    this.reject.emit();
  }
}
