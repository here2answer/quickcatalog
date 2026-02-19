import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { StorageService } from './storage.service';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => {
    const token = this.storage.getAccessToken();
    return !!token && !this.storage.isTokenExpired(token);
  });

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router,
  ) {}

  login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/login`, req).pipe(
      tap(res => this.handleAuthResponse(res.data)),
    );
  }

  register(req: RegisterRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/register`, req).pipe(
      tap(res => this.handleAuthResponse(res.data)),
    );
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = this.storage.getRefreshToken();
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(res => this.handleAuthResponse(res.data)),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  loadCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/me`).pipe(
      tap(res => this.currentUser.set(res.data)),
    );
  }

  logout(): void {
    this.storage.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.role === role;
  }

  hasMinRole(minRole: string): boolean {
    const hierarchy = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'];
    const user = this.currentUser();
    if (!user) return false;
    const userLevel = hierarchy.indexOf(user.role);
    const minLevel = hierarchy.indexOf(minRole);
    return userLevel >= minLevel;
  }

  private handleAuthResponse(data: LoginResponse): void {
    this.storage.setTokens(data.accessToken, data.refreshToken);
    this.currentUser.set(data.user);
  }
}
