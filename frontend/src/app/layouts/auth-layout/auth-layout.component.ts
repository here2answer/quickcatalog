import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex">
      <!-- Left branding panel -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 flex-col justify-between text-white">
        <div>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </div>
            <span class="text-2xl font-bold">QuickCatalog</span>
          </div>
          <h1 class="text-4xl font-bold mb-4">One Catalog.<br/>Every Channel.</h1>
          <p class="text-lg text-emerald-100 mb-8">Create professional product listings and publish across all e-commerce channels.</p>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">AI</div>
            <span>AI-Powered Descriptions</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">MC</div>
            <span>Multi-Channel Publishing</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">HSN</div>
            <span>Auto HSN Detection</span>
          </div>
        </div>
      </div>
      <!-- Right content -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
