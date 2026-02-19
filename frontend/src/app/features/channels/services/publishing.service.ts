import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ChannelListing } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class PublishingService {
  private http = inject(HttpClient);

  publishProduct(productId: string, channelId: string, data?: any): Observable<ApiResponse<ChannelListing>> {
    return this.http.post<ApiResponse<ChannelListing>>(
      `/api/products/${productId}/publish/${channelId}`, data || {}
    );
  }

  unpublishProduct(productId: string, channelId: string): Observable<ApiResponse<ChannelListing>> {
    return this.http.post<ApiResponse<ChannelListing>>(
      `/api/products/${productId}/unpublish/${channelId}`, {}
    );
  }

  bulkPublish(channelId: string, productIds: string[], defaultPrice?: number): Observable<ApiResponse<ChannelListing[]>> {
    return this.http.post<ApiResponse<ChannelListing[]>>(
      `/api/products/bulk-publish/${channelId}`,
      { productIds, defaultChannelPrice: defaultPrice }
    );
  }

  getListings(productId: string): Observable<ApiResponse<ChannelListing[]>> {
    return this.http.get<ApiResponse<ChannelListing[]>>(`/api/products/${productId}/listings`);
  }

  syncListing(productId: string, listingId: string): Observable<ApiResponse<ChannelListing>> {
    return this.http.post<ApiResponse<ChannelListing>>(
      `/api/products/${productId}/listings/${listingId}/sync`, {}
    );
  }

  updatePricing(productId: string, listingId: string, data: any): Observable<ApiResponse<ChannelListing>> {
    return this.http.put<ApiResponse<ChannelListing>>(
      `/api/products/${productId}/listings/${listingId}/pricing`, data
    );
  }
}
