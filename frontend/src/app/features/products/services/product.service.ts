import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse, Product, ProductListItem, DuplicateGroup, BarcodeResult } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API = '/api/products';

  constructor(private http: HttpClient) {}

  getProducts(params: {
    categoryId?: string;
    status?: string;
    sort?: string;
    page?: number;
    size?: number;
    q?: string;
  }): Observable<ApiResponse<PagedResponse<ProductListItem>>> {
    let httpParams = new HttpParams();
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.q) httpParams = httpParams.set('q', params.q);

    return this.http.get<ApiResponse<PagedResponse<ProductListItem>>>(this.API, {
      params: httpParams,
    });
  }

  getProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.API}/${id}`);
  }

  createProduct(data: any): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.API, data);
  }

  updateProduct(id: string, data: any): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.API}/${id}`, data);
  }

  deleteProduct(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  changeStatus(id: string, status: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.API}/${id}/status`, { status });
  }

  duplicateProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.API}/${id}/duplicate`, {});
  }

  searchProducts(
    query: string,
    page?: number,
    size?: number
  ): Observable<ApiResponse<PagedResponse<ProductListItem>>> {
    let httpParams = new HttpParams();

    // Auto-detect barcode: 8-14 digit number
    if (/^\d{8,14}$/.test(query.trim())) {
      httpParams = httpParams.set('barcode', query.trim());
    } else {
      httpParams = httpParams.set('q', query);
    }

    if (page !== undefined) httpParams = httpParams.set('page', page.toString());
    if (size !== undefined) httpParams = httpParams.set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<ProductListItem>>>(`${this.API}/search`, {
      params: httpParams,
    });
  }

  getLowStock(): Observable<ApiResponse<ProductListItem[]>> {
    return this.http.get<ApiResponse<ProductListItem[]>>(`${this.API}/low-stock`);
  }

  exportProducts(format: 'csv' | 'excel' = 'csv', filters?: {
    categoryId?: string;
    status?: string;
    q?: string;
  }): Observable<Blob> {
    let params: any = { format };
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.status) params.status = filters.status;
    if (filters?.q) params.q = filters.q;
    return this.http.get(`${this.API}/export`, {
      params,
      responseType: 'blob',
    });
  }

  findDuplicates(id: string): Observable<ApiResponse<DuplicateGroup>> {
    return this.http.get<ApiResponse<DuplicateGroup>>(`${this.API}/${id}/duplicates`);
  }

  scanDuplicates(): Observable<ApiResponse<DuplicateGroup[]>> {
    return this.http.get<ApiResponse<DuplicateGroup[]>>(`${this.API}/duplicates/scan`);
  }

  generateBarcode(id: string): Observable<ApiResponse<BarcodeResult>> {
    return this.http.post<ApiResponse<BarcodeResult>>(`${this.API}/${id}/generate-barcode`, {});
  }

  getBarcodeImage(id: string, value: string): Observable<Blob> {
    return this.http.get(`${this.API}/${id}/barcode-image`, {
      params: { value },
      responseType: 'blob',
    });
  }
}
