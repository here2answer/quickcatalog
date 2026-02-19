import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, RouterLink],
  template: `
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900">Create your account</h2>
        <p class="mt-2 text-sm text-gray-600">Start managing your product catalog in minutes</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Company Name -->
        <div>
          <label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            id="companyName"
            type="text"
            formControlName="companyName"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Your company name"
          />
          <p *ngIf="f('companyName')?.touched && f('companyName')?.hasError('required')" class="mt-1 text-xs text-red-600">
            Company name is required
          </p>
        </div>

        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Full name"
          />
          <p *ngIf="f('name')?.touched && f('name')?.hasError('required')" class="mt-1 text-xs text-red-600">
            Name is required
          </p>
        </div>

        <!-- Email & Phone row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@company.com"
            />
            <p *ngIf="f('email')?.touched && f('email')?.hasError('required')" class="mt-1 text-xs text-red-600">
              Email is required
            </p>
            <p *ngIf="f('email')?.touched && f('email')?.hasError('email')" class="mt-1 text-xs text-red-600">
              Please enter a valid email
            </p>
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id="phone"
              type="tel"
              formControlName="phone"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Min. 8 characters"
          />
          <p *ngIf="f('password')?.touched && f('password')?.hasError('required')" class="mt-1 text-xs text-red-600">
            Password is required
          </p>
          <p *ngIf="f('password')?.touched && f('password')?.hasError('minlength')" class="mt-1 text-xs text-red-600">
            Password must be at least 8 characters
          </p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Repeat your password"
          />
          <p *ngIf="f('confirmPassword')?.touched && f('confirmPassword')?.hasError('required')" class="mt-1 text-xs text-red-600">
            Please confirm your password
          </p>
          <p *ngIf="f('confirmPassword')?.touched && f('confirmPassword')?.hasError('mismatch')" class="mt-1 text-xs text-red-600">
            Passwords do not match
          </p>
        </div>

        <!-- Error -->
        <div *ngIf="errorMessage" class="rounded-md bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          [disabled]="loading"
          class="flex w-full justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg *ngIf="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Already have an account?
        <a routerLink="/login" class="font-semibold text-emerald-600 hover:text-emerald-500">
          Sign in
        </a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = false;
  errorMessage = '';

  form: FormGroup = this.fb.group(
    {
      companyName: ['', [Validators.required]],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  f(field: string) {
    return this.form.get(field);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { confirmPassword, ...registerData } = this.form.value;

    this.authService.register(registerData).subscribe({
      next: () => {
        this.toast.success('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
