import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserManagementService } from './user-management.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserInfo } from '../../../core/models';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, RouterLink, RelativeTimePipe],
  template: `
    <div class="p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your company profile and preferences</p>
      </div>

      <!-- Settings Tabs -->
      <nav class="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <a routerLink="/settings" class="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700">Company</a>
        <a routerLink="/settings/ai" class="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700">AI</a>
        <a routerLink="/settings/users" class="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm">Team</a>
      </nav>

      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Team Members</h2>
          <p class="mt-1 text-sm text-gray-500">Manage users and their roles</p>
        </div>
        <button
          *ngIf="authService.hasMinRole('ADMIN')"
          (click)="showInvite = true"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          Invite User
        </button>
      </div>

      <!-- User Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let user of users" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                  <p class="text-sm text-gray-500">{{ user.email }}</p>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="{
                    'bg-purple-100 text-purple-800': user.role === 'OWNER',
                    'bg-blue-100 text-blue-800': user.role === 'ADMIN',
                    'bg-green-100 text-green-800': user.role === 'EDITOR',
                    'bg-gray-100 text-gray-800': user.role === 'VIEWER'
                  }"
                >{{ user.role }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  [ngClass]="user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >{{ user.active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.lastLoginAt ? (user.lastLoginAt | relativeTime) : 'Never' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div *ngIf="authService.hasMinRole('ADMIN') && !isSelf(user)" class="flex items-center justify-end gap-2">
                  <select
                    [value]="user.role"
                    (change)="changeRole(user, $event)"
                    class="text-xs border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option *ngIf="authService.hasRole('OWNER')" value="OWNER">OWNER</option>
                  </select>
                  <button
                    *ngIf="authService.hasRole('OWNER')"
                    (click)="toggleActive(user)"
                    class="text-xs px-2 py-1 rounded"
                    [ngClass]="user.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'"
                  >{{ user.active ? 'Deactivate' : 'Reactivate' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Invite Modal -->
      <div *ngIf="showInvite" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input [(ngModel)]="inviteName" type="text" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input [(ngModel)]="inviteEmail" type="email" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Role</label>
              <select [(ngModel)]="inviteRole" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showInvite = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button (click)="invite()" [disabled]="!inviteName || !inviteEmail" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50">Send Invite</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private userService = inject(UserManagementService);
  authService = inject(AuthService);

  users: UserInfo[] = [];
  showInvite = false;
  inviteName = '';
  inviteEmail = '';
  inviteRole = 'EDITOR';

  ngOnInit(): void {
    this.loadUsers();
  }

  isSelf(user: UserInfo): boolean {
    const current = this.authService.user();
    return current?.id === user.id;
  }

  loadUsers(): void {
    this.userService.listUsers().subscribe({
      next: (res) => this.users = res.data,
    });
  }

  changeRole(user: UserInfo, event: Event): void {
    const role = (event.target as HTMLSelectElement).value;
    this.userService.updateRole(user.id, { role }).subscribe({
      next: () => this.loadUsers(),
    });
  }

  toggleActive(user: UserInfo): void {
    if (user.active) {
      this.userService.deactivateUser(user.id).subscribe({ next: () => this.loadUsers() });
    } else {
      this.userService.reactivateUser(user.id).subscribe({ next: () => this.loadUsers() });
    }
  }

  invite(): void {
    this.userService.inviteUser({
      name: this.inviteName,
      email: this.inviteEmail,
      role: this.inviteRole,
    }).subscribe({
      next: () => {
        this.showInvite = false;
        this.inviteName = '';
        this.inviteEmail = '';
        this.inviteRole = 'EDITOR';
        this.loadUsers();
      },
    });
  }
}
