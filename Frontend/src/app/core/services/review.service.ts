// app/core/services/review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Review {
  id: number;
  sessionId: number;
  menteeId: number;
  mentorId: number;
  rating: number;
  comment: string;
  createdAt: string;
  menteeName?: string; // optional for display
}

const MOCK_REVIEWS: Review[] = [
  {id: 1, sessionId: 101, menteeId: 1, mentorId: 1, rating: 5, comment: 'Great session!', createdAt: '2025-12-01', menteeName: 'Ali'},
  {id: 2, sessionId: 102, menteeId: 2, mentorId: 1, rating: 4, comment: 'Very helpful', createdAt: '2025-12-02', menteeName: 'Sara'},
  { id: 3, sessionId: 103, menteeId: 203, mentorId: 302, rating: 3, comment: "Good session", createdAt: "2025-12-03T09:15:00" },
];

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private apiUrl = '/api'; // replace with real API base when ready

  constructor(private http: HttpClient) { }

  getMentorReviews(mentorId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.mentorId === mentorId));
    // later: return this.http.get<Review[]>(`${this.apiUrl}/mentors/${mentorId}/reviews`);
  }

  addReview(review: Partial<Review>): Observable<Review> {
    const newReview: Review = { ...review, id: Math.floor(Math.random() * 1000), createdAt: new Date().toISOString() } as Review;
    MOCK_REVIEWS.push(newReview);
    return of(newReview);
    // later: return this.http.post<Review>(`${this.apiUrl}/reviews`, review);
  }
}
