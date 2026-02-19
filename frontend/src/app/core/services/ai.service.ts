import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, AiGenerationResult, AiSeoResult, AiHsnSuggestion } from '../models';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly API = '/api/ai';

  constructor(private http: HttpClient) {}

  generateDescription(req: {
    productName: string;
    categoryName?: string;
    brand?: string;
    attributes?: Record<string, string>;
  }): Observable<ApiResponse<AiGenerationResult>> {
    return this.http.post<ApiResponse<AiGenerationResult>>(`${this.API}/generate-description`, req);
  }

  generateSeo(req: {
    productName: string;
    categoryName?: string;
    description?: string;
  }): Observable<ApiResponse<AiSeoResult>> {
    return this.http.post<ApiResponse<AiSeoResult>>(`${this.API}/generate-seo`, req);
  }

  suggestHsn(req: {
    productName: string;
    categoryName?: string;
  }): Observable<ApiResponse<AiHsnSuggestion[]>> {
    return this.http.post<ApiResponse<AiHsnSuggestion[]>>(`${this.API}/suggest-hsn`, req);
  }

  suggestTags(req: {
    productName: string;
    categoryName?: string;
    brand?: string;
    description?: string;
  }): Observable<ApiResponse<AiGenerationResult>> {
    return this.http.post<ApiResponse<AiGenerationResult>>(`${this.API}/suggest-tags`, req);
  }

  acceptGeneration(logId: string, accepted: boolean): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/accept`, { logId, accepted });
  }
}
