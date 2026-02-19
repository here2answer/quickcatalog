import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  template: `
    <div class="p-6 lg:p-8 max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
        <p class="mt-1 text-sm text-gray-500">Your account information and security settings</p>
      </div>

      <!-- Profile Info -->
      <section class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Account Details</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500">Name</p>
            <p class="text-sm font-medium text-gray-900">{{ user?.name || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="text-sm text-gray-900">{{ user?.email || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Role</p>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {{ user?.role || '-' }}
            </span>
          </div>
          <div>
            <p class="text-xs text-gray-500">Company</p>
            <p class="text-sm text-gray-900">{{ user?.companyName || '-' }}</p>
          </div>
        </div>
      </section>

      <!-- Change Password -->
      <section class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Change Password</h2>

        <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
            <input
              type="password"
              formControlName="currentPassword"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter current password"
            />
            <p *ngIf="passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.hasError('required')"
               class="mt-1 text-xs text-red-600">Current password is required</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
            <input
              type="password"
              formControlName="newPassword"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="At least 6 characters"
            />
            <p *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('minlength')"
               class="mt-1 text-xs text-red-600">Password must be at least 6 characters</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Re-enter new password"
            />
            <p *ngIf="passwordMismatch" class="mt-1 text-xs text-red-600">Passwords do not match</p>
          </div>

          <!-- Error -->
          <div *ngIf="errorMessage" class="rounded-md bg-red-50 p-3">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              [disabled]="saving || passwordForm.invalid"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg *ngIf="saving" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ saving ? 'Saving...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  passwordForm!: FormGroup;
  saving = false;
  errorMessage = '';

  get user() {
    return this.authService.user();
  }

  get passwordMismatch(): boolean {
    const form = this.passwordForm;
    return (
      form.get('confirmPassword')?.touched === true &&
      form.get('newPassword')?.value !== form.get('confirmPassword')?.value
    );
  }

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.saving = false;
        this.passwordForm.reset();
        this.toast.success('Password updated successfully');
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Failed to change password';
      },
    });
  }
}
