import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiResponse, User } from '../../../core/models';
import { RouterLink } from '@angular/router';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, LoadingSkeletonComponent, RouterLink],
  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your company profile and preferences</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <app-loading-skeleton [lines]="6"></app-loading-skeleton>
      </div>

      <!-- Form -->
      <div *ngIf="!loading" class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-5">Company Information</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Company Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              formControlName="companyName"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Your company name"
            />
            <p *ngIf="form.get('companyName')?.touched && form.get('companyName')?.hasError('required')" class="mt-1 text-xs text-red-600">
              Company name is required
            </p>
          </div>

          <!-- GSTIN -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input
              type="text"
              formControlName="gstin"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxlength="15"
            />
            <p class="mt-1 text-xs text-gray-400">15-character GST Identification Number</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                formControlName="phone"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <!-- Email (read-only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                formControlName="email"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm shadow-sm text-gray-500 cursor-not-allowed"
                readonly
              />
              <p class="mt-1 text-xs text-gray-400">Contact support to change email</p>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="errorMessage" class="rounded-md bg-red-50 p-3">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>

          <!-- Submit -->
          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              [disabled]="saving || form.pristine"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg *ngIf="saving" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- AI Settings Link -->
      <a *ngIf="!loading" routerLink="/settings/ai"
        class="mt-6 flex items-center justify-between bg-white rounded-xl border border-gray-200 p-6 hover:bg-gray-50 transition group">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">AI Settings</p>
            <p class="text-xs text-gray-500">Configure AI provider for auto-generating descriptions, SEO, and more</p>
          </div>
        </div>
        <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>

      <!-- Danger Zone -->
      <div *ngIf="!loading" class="mt-6 bg-white rounded-xl border border-red-200 p-6">
        <h2 class="text-base font-semibold text-red-900 mb-2">Danger Zone</h2>
        <p class="text-sm text-gray-500 mb-4">Once you delete your account, all data will be permanently removed.</p>
        <button
          type="button"
          class="inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
          disabled
        >
          Delete Account (Coming Soon)
        </button>
      </div>
    </div>
  `,
})
export class CompanySettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  form!: FormGroup;
  loading = true;
  saving = false;
  errorMessage = '';

  ngOnInit(): void {
    this.form = this.fb.group({
      companyName: ['', [Validators.required]],
      gstin: [''],
      phone: [''],
      email: [{ value: '', disabled: true }],
    });

    this.loadSettings();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const data = {
      companyName: this.form.get('companyName')?.value,
      gstin: this.form.get('gstin')?.value || null,
      phone: this.form.get('phone')?.value || null,
    };

    this.http.put<ApiResponse<any>>('/api/settings/company', data).subscribe({
      next: (res) => {
        this.saving = false;
        this.form.markAsPristine();
        this.toast.success('Settings saved successfully');
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Failed to save settings';
      },
    });
  }

  private loadSettings(): void {
    this.http.get<ApiResponse<any>>('/api/settings/company').subscribe({
      next: (res) => {
        const s = res.data;
        this.form.patchValue({
          companyName: s.companyName || '',
          gstin: s.gstin || '',
          phone: s.phone || '',
          email: s.email || '',
        });
        this.loading = false;
        this.form.markAsPristine();
      },
      error: () => {
        const user = this.authService.user();
        if (user) {
          this.form.patchValue({
            companyName: user.companyName,
            phone: user.phone || '',
            email: user.email,
          });
        }
        this.loading = false;
      },
    });

    this.form.markAsPristine();
  }
}
