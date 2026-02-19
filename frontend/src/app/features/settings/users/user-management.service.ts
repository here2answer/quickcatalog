import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, UserInfo, InviteUserRequest, UpdateRoleRequest } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly API = '/api/users';

  constructor(private http: HttpClient) {}

  listUsers(): Observable<ApiResponse<UserInfo[]>> {
    return this.http.get<ApiResponse<UserInfo[]>>(this.API);
  }

  getUser(id: string): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.API}/${id}`);
  }

  inviteUser(request: InviteUserRequest): Observable<ApiResponse<UserInfo>> {
    return this.http.post<ApiResponse<UserInfo>>(`${this.API}/invite`, request);
  }

  updateRole(id: string, request: UpdateRoleRequest): Observable<ApiResponse<UserInfo>> {
    return this.http.put<ApiResponse<UserInfo>>(`${this.API}/${id}/role`, request);
  }

  deactivateUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  reactivateUser(id: string): Observable<ApiResponse<UserInfo>> {
    return this.http.post<ApiResponse<UserInfo>>(`${this.API}/${id}/reactivate`, {});
  }
}
