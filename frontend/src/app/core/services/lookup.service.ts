import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, HsnCode, UnitOption, GstRateOption } from '../models';

@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly API = '/api/lookup';

  constructor(private http: HttpClient) {}

  searchHsn(query: string): Observable<ApiResponse<HsnCode[]>> {
    return this.http.get<ApiResponse<HsnCode[]>>(`${this.API}/hsn`, {
      params: { q: query },
    });
  }

  getUnits(): Observable<ApiResponse<UnitOption[]>> {
    return this.http.get<ApiResponse<UnitOption[]>>(`${this.API}/units`);
  }

  getGstRates(): Observable<ApiResponse<GstRateOption[]>> {
    return this.http.get<ApiResponse<GstRateOption[]>>(`${this.API}/gst-rates`);
  }
}
