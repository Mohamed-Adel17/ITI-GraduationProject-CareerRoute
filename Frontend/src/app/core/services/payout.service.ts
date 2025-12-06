import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  Payout,
  RequestPayoutDto,
  MentorPayoutHistoryResponse,
  AdminPayoutListResponse,
  AdminPayoutFilterDto
} from '../../shared/models/payout.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * Payout Service
 * Handles mentor payout requests and admin payout management.
 */
@Injectable({
  providedIn: 'root'
})
export class PayoutService {
  private readonly http = inject(HttpClient);
  private readonly PAYOUTS_URL = `${environment.apiUrl}/payouts`;

  /** Request payout for mentor */
  requestPayout(mentorId: string, payload: RequestPayoutDto): Observable<Payout> {
    return this.http
      .post<ApiResponse<Payout>>(`${this.PAYOUTS_URL}/mentors/${mentorId}`, payload)
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Get mentor payout history */
  getMentorPayoutHistory(
    mentorId: string,
    params?: { page?: number; pageSize?: number }
  ): Observable<MentorPayoutHistoryResponse> {
    const httpParams = new HttpParams({ fromObject: {
      ...(params?.page ? { page: params.page } : {}),
      ...(params?.pageSize ? { pageSize: params.pageSize } : {})
    }});

    return this.http
      .get<ApiResponse<MentorPayoutHistoryResponse>>(`${this.PAYOUTS_URL}/mentors/${mentorId}`, { params: httpParams })
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Get payout details by id (mentor/admin) */
  getPayoutDetails(payoutId: string): Observable<Payout> {
    return this.http
      .get<ApiResponse<Payout>>(`${this.PAYOUTS_URL}/${payoutId}`)
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Admin: search payouts with filters */
  getAdminPayouts(filter: AdminPayoutFilterDto): Observable<AdminPayoutListResponse> {
    const paramsObject: Record<string, any> = {};

    if (filter.mentorId) paramsObject['mentorId'] = filter.mentorId;
    if (filter.mentorName) paramsObject['mentorName'] = filter.mentorName;
    if (filter.mentorEmail) paramsObject['mentorEmail'] = filter.mentorEmail;
    if (filter.status) paramsObject['status'] = filter.status;
    if (filter.minAmount !== undefined && filter.minAmount !== null) paramsObject['minAmount'] = filter.minAmount;
    if (filter.maxAmount !== undefined && filter.maxAmount !== null) paramsObject['maxAmount'] = filter.maxAmount;
    if (filter.startDate) paramsObject['startDate'] = filter.startDate;
    if (filter.endDate) paramsObject['endDate'] = filter.endDate;
    if (filter.sortBy) paramsObject['sortBy'] = filter.sortBy;
    if (filter.sortDescending !== undefined) paramsObject['sortDescending'] = filter.sortDescending;
    if (filter.page) paramsObject['page'] = filter.page;
    if (filter.pageSize) paramsObject['pageSize'] = filter.pageSize;

    const params = new HttpParams({ fromObject: paramsObject });

    return this.http
      .get<ApiResponse<AdminPayoutListResponse>>(`${this.PAYOUTS_URL}/admin`, { params })
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Admin: process payout */
  processPayout(payoutId: string): Observable<Payout> {
    return this.http
      .post<ApiResponse<Payout>>(`${this.PAYOUTS_URL}/${payoutId}/process`, {})
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Admin: cancel payout */
  cancelPayout(payoutId: string): Observable<Payout> {
    return this.http
      .post<ApiResponse<Payout>>(`${this.PAYOUTS_URL}/${payoutId}/cancel`, {})
      .pipe(map(response => unwrapResponse(response)));
  }
}
