import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'indianCurrency', standalone: true })
export class IndianCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '';
    return '\u20B9' + value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
