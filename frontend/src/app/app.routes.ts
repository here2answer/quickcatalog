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
        path: 'import',
        loadComponent: () => import('./features/import/bulk-import/bulk-import.component').then(m => m.BulkImportComponent),
      },
      {
        path: 'products',
        children: [
          { path: 'duplicates', loadComponent: () => import('./features/products/duplicate-scanner/duplicate-scanner.component').then(m => m.DuplicateScannerComponent) },
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
        path: 'channels',
        children: [
          { path: '', loadComponent: () => import('./features/channels/channel-list/channel-list.component').then(m => m.ChannelListComponent) },
          { path: 'new', loadComponent: () => import('./features/channels/channel-form/channel-form.component').then(m => m.ChannelFormComponent) },
          { path: 'listings', loadComponent: () => import('./features/channels/listing-dashboard/listing-dashboard.component').then(m => m.ListingDashboardComponent) },
          { path: ':id/edit', loadComponent: () => import('./features/channels/channel-form/channel-form.component').then(m => m.ChannelFormComponent) },
        ],
      },
      {
        path: 'ondc',
        children: [
          { path: '', loadComponent: () => import('./features/ondc/ondc-dashboard/ondc-dashboard.component').then(m => m.OndcDashboardComponent) },
          { path: 'setup', loadComponent: () => import('./features/ondc/ondc-setup/ondc-setup.component').then(m => m.OndcSetupComponent) },
          { path: 'products', loadComponent: () => import('./features/ondc/ondc-products/ondc-products.component').then(m => m.OndcProductsComponent) },
          { path: 'orders', loadComponent: () => import('./features/ondc/ondc-orders/ondc-order-list.component').then(m => m.OndcOrderListComponent) },
          { path: 'orders/:id', loadComponent: () => import('./features/ondc/ondc-orders/ondc-order-detail.component').then(m => m.OndcOrderDetailComponent) },
        ],
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/company-settings/company-settings.component').then(m => m.CompanySettingsComponent),
      },
      {
        path: 'settings/ai',
        loadComponent: () => import('./features/settings/ai-settings/ai-settings.component').then(m => m.AiSettingsComponent),
      },
      {
        path: 'settings/users',
        loadComponent: () => import('./features/settings/users/user-list.component').then(m => m.UserListComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
