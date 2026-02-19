import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ImportJob, ImportError } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly API = '/api/import';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<ApiResponse<ImportJob>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ImportJob>>(`${this.API}/upload`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.API}/template`, { responseType: 'blob' });
  }

  getStatus(jobId: string): Observable<ApiResponse<ImportJob & { errors: ImportError[] }>> {
    return this.http.get<ApiResponse<ImportJob & { errors: ImportError[] }>>(`${this.API}/${jobId}/status`);
  }

  getErrors(jobId: string): Observable<ApiResponse<ImportError[]>> {
    return this.http.get<ApiResponse<ImportError[]>>(`${this.API}/${jobId}/errors`);
  }
}
