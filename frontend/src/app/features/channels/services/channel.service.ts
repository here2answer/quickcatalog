import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Channel } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private http = inject(HttpClient);
  private readonly API = '/api/channels';

  getChannels(): Observable<ApiResponse<Channel[]>> {
    return this.http.get<ApiResponse<Channel[]>>(this.API);
  }

  getChannel(id: string): Observable<ApiResponse<Channel>> {
    return this.http.get<ApiResponse<Channel>>(`${this.API}/${id}`);
  }

  createChannel(data: any): Observable<ApiResponse<Channel>> {
    return this.http.post<ApiResponse<Channel>>(this.API, data);
  }

  updateChannel(id: string, data: any): Observable<ApiResponse<Channel>> {
    return this.http.put<ApiResponse<Channel>>(`${this.API}/${id}`, data);
  }

  deleteChannel(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  testConnection(id: string): Observable<ApiResponse<{ success: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ success: boolean; message: string }>>(`${this.API}/${id}/test-connection`, {});
  }

  getFieldMappingTemplate(id: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API}/${id}/field-mapping-template`);
  }
}
