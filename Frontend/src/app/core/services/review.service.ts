import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import {
  CreateReviewRequest,
  ReviewItem,
  ReviewResponse,
  MentorReviewsResponse
} from '../../shared/models/review.model';

/**
 * ReviewService
 *
 * Handles all review-related API operations based on Reviews-Endpoints.md contract.
 *
 * Endpoints:
 * - GET /api/sessions/{sessionId}/review - Get session review (auth required)
 * - POST /api/sessions/{sessionId}/reviews - Add review (mentee only)
 * - GET /api/mentors/{mentorId}/reviews - Get mentor reviews (public)
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get review for a specific session
   * GET /api/sessions/{sessionId}/review
   *
   * @param sessionId - The session ID
   * @returns Observable with review data or null if no review exists
   */
  getSessionReview(sessionId: string): Observable<ReviewItem | null> {
    return this.http.get<ApiResponse<ReviewItem | null>>(
      `${this.apiUrl}/sessions/${sessionId}/review`
    ).pipe(
      map(response => response.data ?? null)
    );
  }

  /**
   * Add a review for a completed session
   * POST /api/sessions/{sessionId}/reviews
   *
   * @param sessionId - The session ID
   * @param request - Review data (rating and optional comment)
   * @returns Observable with created review
   */
  addReview(sessionId: string, request: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ApiResponse<ReviewResponse>>(
      `${this.apiUrl}/sessions/${sessionId}/reviews`,
      request
    ).pipe(
      map(response => {
        if (!response.data) {
          throw new Error(response.message || 'Failed to create review');
        }
        return response.data;
      })
    );
  }

  /**
   * Get all reviews for a mentor (public endpoint)
   * GET /api/mentors/{mentorId}/reviews
   *
   * @param mentorId - The mentor ID
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 10)
   * @returns Observable with paginated reviews
   */
  getMentorReviews(
    mentorId: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<MentorReviewsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/mentors/${mentorId}/reviews`,
      { params }
    ).pipe(
      map(response => {
        if (!response.data) {
          // Return empty response if no data
          return {
            reviews: [],
            pagination: {
              totalCount: 0,
              currentPage: page,
              pageSize: pageSize,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          };
        }

        // Handle different response structures
        // Could be { reviews: [...], pagination: {...} } or just an array
        let rawReviews: any[] = [];
        let pagination = response.data.pagination;

        if (Array.isArray(response.data)) {
          rawReviews = response.data;
        } else if (response.data.reviews) {
          rawReviews = response.data.reviews;
        } else if (response.data.items) {
          rawReviews = response.data.items;
        } else if (response.data.data) {
          rawReviews = Array.isArray(response.data.data) ? response.data.data : [];
        }

        // Map reviews to handle potential field name variations from backend
        const reviews = rawReviews.map((r: any) => this.mapReviewItem(r));

        return {
          reviews,
          pagination: pagination || {
            totalCount: reviews.length,
            currentPage: page,
            pageSize: pageSize,
            totalPages: Math.ceil(reviews.length / pageSize) || 1,
            hasNextPage: false,
            hasPreviousPage: page > 1
          }
        };
      })
    );
  }

  /**
   * Map backend review response to ReviewItem
   */
  private mapReviewItem(data: any): ReviewItem {
    return {
      id: data.id ?? '',
      rating: data.rating ?? 0,
      comment: data.comment ?? undefined,
      createdAt: data.createdAt ?? '',
      menteeFirstName: data.menteeFirstName ?? '',
      menteeLastName: data.menteeLastName ?? ''
    };
  }
}
