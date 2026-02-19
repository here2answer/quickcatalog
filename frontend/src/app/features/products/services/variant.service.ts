import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ProductVariant } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class VariantService {
  private api(productId: string): string {
    return `/api/products/${productId}/variants`;
  }

  constructor(private http: HttpClient) {}

  list(productId: string): Observable<ApiResponse<ProductVariant[]>> {
    return this.http.get<ApiResponse<ProductVariant[]>>(this.api(productId));
  }

  get(productId: string, variantId: string): Observable<ApiResponse<ProductVariant>> {
    return this.http.get<ApiResponse<ProductVariant>>(`${this.api(productId)}/${variantId}`);
  }

  create(productId: string, variant: Partial<ProductVariant>): Observable<ApiResponse<ProductVariant>> {
    return this.http.post<ApiResponse<ProductVariant>>(this.api(productId), variant);
  }

  update(productId: string, variantId: string, variant: Partial<ProductVariant>): Observable<ApiResponse<ProductVariant>> {
    return this.http.put<ApiResponse<ProductVariant>>(`${this.api(productId)}/${variantId}`, variant);
  }

  delete(productId: string, variantId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api(productId)}/${variantId}`);
  }

  generate(productId: string, attributeCombinations: Record<string, string[]>): Observable<ApiResponse<ProductVariant[]>> {
    return this.http.post<ApiResponse<ProductVariant[]>>(
      `${this.api(productId)}/generate`,
      { attributeCombinations }
    );
  }
}
