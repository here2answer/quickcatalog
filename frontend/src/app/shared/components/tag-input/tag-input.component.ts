import { Component, Input, forwardRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 cursor-text"
      (click)="inputEl.focus()"
    >
      <span
        *ngFor="let tag of tags; let i = index; trackBy: trackByIndex"
        class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm"
      >
        {{ tag }}
        <button
          type="button"
          (click)="removeTag(i); $event.stopPropagation()"
          class="text-emerald-500 hover:text-emerald-700 focus:outline-none"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </span>
      <input
        #inputEl
        type="text"
        [placeholder]="tags.length === 0 ? placeholder : ''"
        [(ngModel)]="inputValue"
        (keydown)="onKeyDown($event)"
        (blur)="addCurrentTag()"
        class="flex-1 min-w-[120px] outline-none border-none bg-transparent text-sm p-0 focus:ring-0"
        [disabled]="isDisabled"
      />
    </div>
  `,
})
export class TagInputComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Type and press Enter to add...';

  tags: string[] = [];
  inputValue: string = '';
  isDisabled: boolean = false;

  trackByIndex(index: number): number {
    return index;
  }

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    this.tags = value ? [...value] : [];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addCurrentTag();
    } else if (
      event.key === 'Backspace' &&
      this.inputValue === '' &&
      this.tags.length > 0
    ) {
      this.removeTag(this.tags.length - 1);
    }
  }

  addCurrentTag(): void {
    const tag = this.inputValue.trim().replace(/,/g, '');
    if (tag && !this.tags.includes(tag)) {
      this.tags = [...this.tags, tag];
      this.onChange(this.tags);
    }
    this.inputValue = '';
    this.onTouched();
  }

  removeTag(index: number): void {
    this.tags = this.tags.filter((_, i) => i !== index);
    this.onChange(this.tags);
    this.onTouched();
  }
}
