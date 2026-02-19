import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ProductImage } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private readonly API = '/api/products';

  constructor(private http: HttpClient) {}

  uploadImages(productId: string, files: File[]): Observable<ApiResponse<ProductImage[]>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http.post<ApiResponse<ProductImage[]>>(
      `${this.API}/${productId}/images`,
      formData
    );
  }

  deleteImage(productId: string, imageId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.API}/${productId}/images/${imageId}`
    );
  }

  reorderImages(productId: string, imageIds: string[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.API}/${productId}/images/reorder`,
      { imageIds }
    );
  }
}
