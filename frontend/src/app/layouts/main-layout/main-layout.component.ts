import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-50">

      <!-- Mobile top bar -->
      <div class="fixed top-0 left-0 right-0 z-40 flex items-center h-14 bg-slate-800 px-4 lg:hidden">
        <button (click)="sidebarOpen = true" class="text-white p-1 -ml-1 focus:outline-none" aria-label="Open sidebar">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="ml-3 flex items-center gap-2">
          <div class="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </div>
          <span class="text-white text-base font-bold">QuickCatalog</span>
        </div>
      </div>

      <!-- Mobile sidebar backdrop -->
      @if (sidebarOpen) {
        <div class="fixed inset-0 z-50 bg-black/50 lg:hidden" (click)="sidebarOpen = false"></div>
      }

      <!-- Sidebar -->
      <aside
        [class]="sidebarOpen
          ? 'fixed inset-y-0 left-0 z-50 w-60 bg-slate-800 text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out translate-x-0 lg:static lg:translate-x-0'
          : 'fixed inset-y-0 left-0 z-50 w-60 bg-slate-800 text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out -translate-x-full lg:static lg:translate-x-0'">
        <div class="p-5 border-b border-slate-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </div>
            <span class="text-lg font-bold">QuickCatalog</span>
          </div>
          <!-- Close button (mobile only) -->
          <button (click)="sidebarOpen = false" class="text-slate-400 hover:text-white lg:hidden" aria-label="Close sidebar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav class="flex-1 py-4 space-y-1 px-3">
          <a routerLink="/dashboard" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Dashboard
          </a>
          <a routerLink="/products" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            Products
          </a>
          <a routerLink="/categories" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            Categories
          </a>
          <a routerLink="/channels" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Channels
          </a>
          <a routerLink="/settings" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Settings
          </a>
        </nav>

        <div class="p-4 border-t border-slate-700">
          @if (user(); as u) {
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                {{ u.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ u.name }}</p>
                <p class="text-xs text-slate-400 truncate">{{ u.companyName }}</p>
              </div>
              <button (click)="logout()" class="text-slate-400 hover:text-white" title="Logout">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto pt-14 lg:pt-0">
        <router-outlet />
      </main>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  user = this.authService.user;
  sidebarOpen = false;

  ngOnInit(): void {
    this.authService.loadCurrentUser().subscribe();
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
