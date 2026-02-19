import {
  Component,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { HsnCode } from '../../../core/models';
import { LookupService } from '../../../core/services/lookup.service';

@Component({
  selector: 'app-hsn-search',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HsnSearchComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative">
      <input
        type="text"
        [(ngModel)]="searchText"
        (ngModelChange)="onSearchChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        placeholder="Search HSN code or description..."
        class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100"
        [disabled]="isDisabled"
      />
      <div *ngIf="searching" class="absolute right-3 top-1/2 -translate-y-1/2">
        <svg class="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Dropdown -->
      <div
        *ngIf="showDropdown && results.length > 0"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5"
      >
        <button
          type="button"
          *ngFor="let hsn of results; trackBy: trackByHsnCode"
          (mousedown)="selectHsn(hsn)"
          class="relative w-full cursor-pointer select-none py-2 px-3 hover:bg-emerald-50 text-left"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-900">{{ hsn.code }}</span>
            <span *ngIf="hsn.gstRate" class="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              GST {{ hsn.gstRate }}%
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5 truncate">{{ hsn.description }}</p>
        </button>
      </div>

      <div
        *ngIf="showDropdown && !searching && results.length === 0 && searchText.length >= 2"
        class="absolute z-10 mt-1 w-full rounded-md bg-white py-3 text-sm shadow-lg ring-1 ring-black ring-opacity-5 text-center text-gray-500"
      >
        No HSN codes found
      </div>
    </div>
  `,
})
export class HsnSearchComponent implements ControlValueAccessor, OnDestroy {
  @Output() hsnSelected = new EventEmitter<HsnCode>();

  trackByHsnCode(index: number, item: any): string {
    return item.code;
  }

  searchText: string = '';
  results: HsnCode[] = [];
  searching = false;
  showDropdown = false;
  isDisabled = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private lookupService: LookupService,
    private elementRef: ElementRef
  ) {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 2) {
            this.results = [];
            this.searching = false;
            return of(null);
          }
          this.searching = true;
          return this.lookupService.searchHsn(query);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.searching = false;
          if (res) {
            this.results = res.data;
            this.showDropdown = true;
          }
        },
        error: () => {
          this.searching = false;
          this.results = [];
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  writeValue(value: string | null): void {
    this.searchText = value || '';
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

  onSearchChange(value: string): void {
    this.onChange(value);
    this.searchSubject.next(value);
  }

  onFocus(): void {
    if (this.results.length > 0) {
      this.showDropdown = true;
    }
  }

  onBlur(): void {
    this.onTouched();
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  selectHsn(hsn: HsnCode): void {
    this.searchText = hsn.code;
    this.showDropdown = false;
    this.onChange(hsn.code);
    this.onTouched();
    this.hsnSelected.emit(hsn);
  }
}
