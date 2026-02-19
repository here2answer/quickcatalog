import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChannelService } from '../services/channel.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-channel-form',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ReactiveFormsModule],
  template: `
    <div class="p-6 lg:p-8 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/channels" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Edit Channel' : 'Add Channel' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <!-- Channel Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Channel Type</label>
          <select formControlName="channelType"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  [attr.disabled]="isEdit ? '' : null">
            <option value="">Select a channel type</option>
            <option *ngFor="let type of channelTypes" [value]="type.value">{{ type.label }}</option>
          </select>
        </div>

        <!-- Channel Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
          <input type="text" formControlName="channelName"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                 placeholder="e.g. My Amazon Store">
        </div>

        <!-- Sync Frequency -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label>
          <select formControlName="syncFrequency"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="MANUAL">Manual</option>
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>

        <!-- Credentials -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Credentials (JSON)</label>
          <textarea formControlName="credentials" rows="3"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder='{"apiKey": "...", "secretKey": "..."}'></textarea>
          <p class="text-xs text-gray-400 mt-1">API keys and secrets for this channel. Leave empty for ONDC (managed separately).</p>
        </div>

        <!-- Active toggle -->
        <div class="flex items-center gap-3">
          <input type="checkbox" formControlName="active" id="channelActive"
                 class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
          <label for="channelActive" class="text-sm font-medium text-gray-700">Active</label>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" [disabled]="form.invalid || saving"
                  class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors">
            {{ saving ? 'Saving...' : (isEdit ? 'Update Channel' : 'Create Channel') }}
          </button>
          <a routerLink="/channels" class="text-sm text-gray-500 hover:text-gray-700">Cancel</a>
        </div>
      </form>
    </div>
  `,
})
export class ChannelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private channelService = inject(ChannelService);
  private toast = inject(ToastService);

  form: FormGroup = this.fb.group({
    channelType: ['', Validators.required],
    channelName: ['', Validators.required],
    syncFrequency: ['MANUAL'],
    credentials: [''],
    active: [true],
  });

  isEdit = false;
  saving = false;
  channelId: string | null = null;

  channelTypes = [
    { value: 'ONDC', label: 'ONDC Network' },
    { value: 'AMAZON', label: 'Amazon' },
    { value: 'FLIPKART', label: 'Flipkart' },
    { value: 'MEESHO', label: 'Meesho' },
    { value: 'JIOMART', label: 'JioMart' },
    { value: 'WEBSITE', label: 'Own Website' },
    { value: 'CUSTOM', label: 'Custom Channel' },
  ];

  ngOnInit(): void {
    this.channelId = this.route.snapshot.paramMap.get('id');
    if (this.channelId) {
      this.isEdit = true;
      this.channelService.getChannel(this.channelId).subscribe({
        next: res => {
          const ch = res.data;
          this.form.patchValue({
            channelType: ch.channelType,
            channelName: ch.channelName,
            syncFrequency: ch.syncFrequency || 'MANUAL',
            credentials: ch.credentials === '***masked***' ? '' : ch.credentials,
            active: ch.active,
          });
        },
        error: () => this.toast.error('Failed to load channel'),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const data = this.form.value;
    const obs = this.isEdit
      ? this.channelService.updateChannel(this.channelId!, data)
      : this.channelService.createChannel(data);

    obs.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Channel updated' : 'Channel created');
        this.router.navigate(['/channels']);
      },
      error: () => {
        this.toast.error('Failed to save channel');
        this.saving = false;
      },
    });
  }
}
