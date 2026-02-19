import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgIf } from '@angular/common';
import { IndianCurrencyPipe } from '../../pipes/indian-currency.pipe';

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [NgIf, IndianCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-lg font-semibold text-gray-900">
        {{ sellingPrice | indianCurrency }}
      </span>
      <span
        *ngIf="mrp && mrp > (sellingPrice ?? 0)"
        class="text-sm text-gray-400 line-through"
      >
        {{ mrp | indianCurrency }}
      </span>
      <span
        *ngIf="discountPercent > 0"
        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700"
      >
        {{ discountPercent }}% off
      </span>
    </div>
  `,
})
export class PriceDisplayComponent {
  @Input() sellingPrice?: number;
  @Input() mrp?: number;

  get discountPercent(): number {
    if (!this.mrp || !this.sellingPrice || this.mrp <= this.sellingPrice) return 0;
    return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
}
