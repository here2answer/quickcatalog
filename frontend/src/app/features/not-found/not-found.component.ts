import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div class="text-center">
        <p class="text-6xl font-bold text-emerald-600">404</p>
        <h1 class="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
        <p class="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
        <div class="mt-6 flex items-center justify-center gap-3">
          <a routerLink="/dashboard"
             class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Go to Dashboard
          </a>
          <a routerLink="/login"
             class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Login
          </a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
