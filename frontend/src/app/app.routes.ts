import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      {
        path: 'products',
        children: [
          { path: '', loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent) },
          { path: 'new', loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
          { path: ':id', loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
        ],
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-tree/category-tree.component').then(m => m.CategoryTreeComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/company-settings/company-settings.component').then(m => m.CompanySettingsComponent),
      },
      {
        path: 'settings/ai',
        loadComponent: () => import('./features/settings/ai-settings/ai-settings.component').then(m => m.AiSettingsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
