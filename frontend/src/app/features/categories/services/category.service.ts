import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Category, CategoryRequest } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly API = '/api/categories';

  constructor(private http: HttpClient) {}

  getCategoryTree(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.API);
  }

  getCategory(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.API}/${id}`);
  }

  createCategory(data: CategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.API, data);
  }

  updateCategory(id: string, data: CategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.API}/${id}`, data);
  }

  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  getAttributesSchema(id: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.API}/${id}/attributes-schema`);
  }
}
