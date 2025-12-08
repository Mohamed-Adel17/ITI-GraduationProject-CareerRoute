import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  DisputeDto,
  AdminDisputeDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  AdminDisputeFilterDto,
  AdminDisputeListResponse
} from '../../shared/models/dispute.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * Dispute Service
 * Handles session dispute operations for mentees and admin management.
 */
@Injectable({
  providedIn: 'root'
})
export class DisputeService {
  private readonly http = inject(HttpClient);
  private readonly DISPUTES_URL = `${environment.apiUrl}/disputes`;

  /** Create dispute for a session (Mentee) */
  createDispute(sessionId: string, dto: CreateDisputeDto): Observable<DisputeDto> {
    return this.http
      .post<ApiResponse<DisputeDto>>(`${this.DISPUTES_URL}/sessions/${sessionId}`, dto)
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Get dispute by session ID (Mentee/Mentor/Admin) */
  getDisputeBySession(sessionId: string): Observable<DisputeDto | null> {
    return this.http
      .get<ApiResponse<DisputeDto | null>>(`${this.DISPUTES_URL}/sessions/${sessionId}`)
      .pipe(map(response => response.data ?? null));
  }

  /** Get dispute by ID (Admin) */
  getDisputeById(disputeId: string): Observable<DisputeDto> {
    return this.http
      .get<ApiResponse<DisputeDto>>(`${this.DISPUTES_URL}/${disputeId}`)
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Resolve dispute (Admin) */
  resolveDispute(disputeId: string, dto: ResolveDisputeDto): Observable<AdminDisputeDto> {
    return this.http
      .post<ApiResponse<AdminDisputeDto>>(`${this.DISPUTES_URL}/${disputeId}/resolve`, dto)
      .pipe(map(response => unwrapResponse(response)));
  }

  /** Get all disputes with filters (Admin) */
  getAdminDisputes(filter: AdminDisputeFilterDto): Observable<AdminDisputeListResponse> {
    const paramsObject: Record<string, string | number | boolean> = {};

    if (filter.status) paramsObject['Status'] = filter.status;
    if (filter.reason) paramsObject['Reason'] = filter.reason;
    if (filter.menteeId) paramsObject['MenteeId'] = filter.menteeId;
    if (filter.mentorId) paramsObject['MentorId'] = filter.mentorId;
    if (filter.startDate) paramsObject['StartDate'] = filter.startDate;
    if (filter.endDate) paramsObject['EndDate'] = filter.endDate;
    if (filter.sortBy) paramsObject['SortBy'] = filter.sortBy;
    if (filter.sortDescending !== undefined) paramsObject['SortDescending'] = filter.sortDescending;
    if (filter.page) paramsObject['Page'] = filter.page;
    if (filter.pageSize) paramsObject['PageSize'] = filter.pageSize;

    const params = new HttpParams({ fromObject: paramsObject });

    return this.http
      .get<ApiResponse<AdminDisputeListResponse>>(`${this.DISPUTES_URL}/admin`, { params })
      .pipe(map(response => unwrapResponse(response)));
  }
}
