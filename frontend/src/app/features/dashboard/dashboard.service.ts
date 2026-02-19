import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, DashboardSummary, RecentActivity } from '../../core/models';

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
}
