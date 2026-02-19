import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  PagedResponse,
  OndcSubscriber,
  OndcSubscriberRequest,
  OndcProvider,
  OndcProviderRequest,
  OndcProductConfig,
  OndcProductConfigRequest,
  OndcOrderListItem,
  OndcOrderDetail,
} from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class OndcService {
  constructor(private http: HttpClient) {}

  // --- Subscriber ---

  getSubscriber(): Observable<ApiResponse<OndcSubscriber>> {
    return this.http.get<ApiResponse<OndcSubscriber>>('/api/ondc/subscriber');
  }

  saveSubscriber(request: OndcSubscriberRequest): Observable<ApiResponse<OndcSubscriber>> {
    return this.http.post<ApiResponse<OndcSubscriber>>('/api/ondc/subscriber', request);
  }

  generateKeys(): Observable<ApiResponse<OndcSubscriber>> {
    return this.http.post<ApiResponse<OndcSubscriber>>('/api/ondc/subscriber/generate-keys', {});
  }

  register(): Observable<ApiResponse<OndcSubscriber>> {
    return this.http.post<ApiResponse<OndcSubscriber>>('/api/ondc/subscriber/register', {});
  }

  getSubscriberStatus(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>('/api/ondc/subscriber/status');
  }

  // --- Providers ---

  listProviders(): Observable<ApiResponse<OndcProvider[]>> {
    return this.http.get<ApiResponse<OndcProvider[]>>('/api/ondc/providers');
  }

  getProvider(id: string): Observable<ApiResponse<OndcProvider>> {
    return this.http.get<ApiResponse<OndcProvider>>(`/api/ondc/providers/${id}`);
  }

  createProvider(request: OndcProviderRequest): Observable<ApiResponse<OndcProvider>> {
    return this.http.post<ApiResponse<OndcProvider>>('/api/ondc/providers', request);
  }

  updateProvider(id: string, request: OndcProviderRequest): Observable<ApiResponse<OndcProvider>> {
    return this.http.put<ApiResponse<OndcProvider>>(`/api/ondc/providers/${id}`, request);
  }

  deleteProvider(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/api/ondc/providers/${id}`);
  }

  // --- Product Config ---

  getProductConfig(productId: string): Observable<ApiResponse<OndcProductConfig>> {
    return this.http.get<ApiResponse<OndcProductConfig>>(`/api/ondc/products/${productId}/config`);
  }

  saveProductConfig(productId: string, request: OndcProductConfigRequest): Observable<ApiResponse<OndcProductConfig>> {
    return this.http.put<ApiResponse<OndcProductConfig>>(`/api/ondc/products/${productId}/config`, request);
  }

  publishProduct(productId: string): Observable<ApiResponse<OndcProductConfig>> {
    return this.http.post<ApiResponse<OndcProductConfig>>(`/api/ondc/products/${productId}/publish`, {});
  }

  unpublishProduct(productId: string): Observable<ApiResponse<OndcProductConfig>> {
    return this.http.post<ApiResponse<OndcProductConfig>>(`/api/ondc/products/${productId}/unpublish`, {});
  }

  listPublishedProducts(): Observable<ApiResponse<OndcProductConfig[]>> {
    return this.http.get<ApiResponse<OndcProductConfig[]>>('/api/ondc/products/published');
  }

  // --- Orders ---

  listOrders(params: { state?: string; page?: number; size?: number } = {}): Observable<ApiResponse<PagedResponse<OndcOrderListItem>>> {
    let httpParams = new HttpParams();
    if (params.state) httpParams = httpParams.set('state', params.state);
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<ApiResponse<PagedResponse<OndcOrderListItem>>>('/api/ondc/orders', { params: httpParams });
  }

  getOrder(id: string): Observable<ApiResponse<OndcOrderDetail>> {
    return this.http.get<ApiResponse<OndcOrderDetail>>(`/api/ondc/orders/${id}`);
  }

  acceptOrder(id: string): Observable<ApiResponse<OndcOrderDetail>> {
    return this.http.post<ApiResponse<OndcOrderDetail>>(`/api/ondc/orders/${id}/accept`, {});
  }
}
