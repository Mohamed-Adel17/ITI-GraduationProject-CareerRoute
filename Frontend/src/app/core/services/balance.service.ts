import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { MentorBalance } from '../../shared/models/balance.model';
import { ApiResponse, unwrapResponse } from '../../shared/models/api-response.model';

/**
 * Balance Service
 *
 * Retrieves mentor balance information (available, pending, total earnings).
 */
@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private readonly http = inject(HttpClient);
  private readonly BALANCE_URL = `${environment.apiUrl}/balance`;

  /**
   * Get mentor balance by mentorId
   */
  getMentorBalance(mentorId: string): Observable<MentorBalance> {
    return this.http
      .get<ApiResponse<MentorBalance>>(`${this.BALANCE_URL}/${mentorId}`)
      .pipe(map(response => unwrapResponse(response)));
  }
}
