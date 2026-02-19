import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, DashboardSummary, RecentActivity, ChannelStatus, CatalogHealth } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.API}/summary`);
  }

  getRecentActivity(): Observable<ApiResponse<RecentActivity[]>> {
    return this.http.get<ApiResponse<RecentActivity[]>>(`${this.API}/recent-activity`);
  }

  getChannelStatus(): Observable<ApiResponse<ChannelStatus[]>> {
    return this.http.get<ApiResponse<ChannelStatus[]>>(`${this.API}/channel-status`);
  }

  getCatalogHealth(): Observable<ApiResponse<CatalogHealth>> {
    return this.http.get<ApiResponse<CatalogHealth>>(`${this.API}/catalog-health`);
  }
}
