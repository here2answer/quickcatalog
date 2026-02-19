import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { ApiResponse } from '../../../core/models';

@Component({
  selector: 'app-ai-settings',
  standalone: true,
  imports: [NgIf, NgClass, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <p class="mt-1 text-sm text-gray-500">Manage your company profile and preferences</p>
      </div>

      <!-- Settings Tabs -->
      <nav class="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <a routerLink="/settings" class="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700">Company</a>
        <a routerLink="/settings/ai" class="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm">AI</a>
        <a routerLink="/settings/users" class="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700">Team</a>
      </nav>

      <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-6">
        <!-- Provider Selection -->
        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">AI Provider</h2>
          <p class="text-sm text-gray-500 mb-4">Choose which AI provider to use for content generation.</p>

          <div class="space-y-3">
            <label class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
              [ngClass]="form.get('aiProvider')?.value === 'OLLAMA' ? 'border-violet-500 bg-violet-50' : 'border-gray-200'"
            >
              <input type="radio" formControlName="aiProvider" value="OLLAMA"
                class="mt-0.5 h-4 w-4 text-violet-600 border-gray-300 focus:ring-violet-500" />
              <div>
                <p class="text-sm font-medium text-gray-900">Ollama (Local)</p>
                <p class="text-xs text-gray-500 mt-0.5">Free, runs locally. Requires Ollama installed on the server with a model pulled (e.g., llama3.1).</p>
              </div>
            </label>

            <label class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
              [ngClass]="form.get('aiProvider')?.value === 'OPENAI' ? 'border-violet-500 bg-violet-50' : 'border-gray-200'"
            >
              <input type="radio" formControlName="aiProvider" value="OPENAI"
                class="mt-0.5 h-4 w-4 text-violet-600 border-gray-300 focus:ring-violet-500" />
              <div>
                <p class="text-sm font-medium text-gray-900">OpenAI</p>
                <p class="text-xs text-gray-500 mt-0.5">Uses GPT models via API. Requires an API key. Usage is billed by OpenAI.</p>
              </div>
            </label>
          </div>
        </section>

        <!-- OpenAI API Key -->
        <section *ngIf="form.get('aiProvider')?.value === 'OPENAI'" class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">OpenAI API Key</h2>
          <p class="text-sm text-gray-500 mb-4">Enter your OpenAI API key. It will be stored securely and only used for AI generation requests.</p>
          <input
            type="password"
            formControlName="openaiApiKey"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="sk-..."
          />
        </section>

        <!-- Info -->
        <section class="bg-violet-50 border border-violet-200 rounded-xl p-6">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-violet-900">AI-Powered Features</p>
              <ul class="mt-2 text-sm text-violet-700 space-y-1 list-disc list-inside">
                <li>Auto-generate product descriptions</li>
                <li>Generate SEO titles, meta descriptions, and keywords</li>
                <li>Suggest HSN codes based on product details</li>
                <li>Auto-suggest product tags for better discoverability</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Save -->
        <div class="flex justify-end">
          <button
            type="submit"
            [disabled]="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
          >
            <svg *ngIf="saving" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AiSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  form!: FormGroup;
  saving = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      aiProvider: ['OLLAMA'],
      openaiApiKey: [''],
    });
    this.loadSettings();
  }

  private loadSettings(): void {
    this.http.get<ApiResponse<any>>('/api/settings/company').subscribe({
      next: (res) => {
        if (res.data) {
          this.form.patchValue({
            aiProvider: res.data.aiProvider || 'OLLAMA',
            openaiApiKey: res.data.openaiApiKey || '',
          });
        }
      },
    });
  }

  onSave(): void {
    this.saving = true;
    const val = this.form.getRawValue();
    this.http.put<ApiResponse<any>>('/api/settings/company', {
      aiProvider: val.aiProvider,
      openaiApiKey: val.aiProvider === 'OPENAI' ? val.openaiApiKey : null,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('AI settings saved');
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Failed to save settings');
      },
    });
  }
}
