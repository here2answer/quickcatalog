import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const user = authService.user();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }
    return false;
  };
};
