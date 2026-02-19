import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

let isRefreshing = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const storage = inject(StorageService);

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = storage.getRefreshToken();
          if (refreshToken && !storage.isTokenExpired(refreshToken)) {
            return authService.refreshToken().pipe(
              switchMap(() => {
                isRefreshing = false;
                const newReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${storage.getAccessToken()}` },
                });
                return next(newReq);
              }),
              catchError(refreshError => {
                isRefreshing = false;
                authService.logout();
                return throwError(() => refreshError);
              }),
            );
          }
        }
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
