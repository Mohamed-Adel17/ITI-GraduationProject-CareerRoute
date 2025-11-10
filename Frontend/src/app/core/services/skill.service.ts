import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { Skill } from '../../shared/models/skill.model';
import { ApiResponse } from '../../shared/models/api-response.model';

/**
 * SkillService
 *
 * Service for managing skills (career interests and mentor expertise) in the Career Route application.
 * Handles retrieving skills organized by categories.
 *
 * Features:
 * - Get all skills (GET /api/skills)
 * - Filter skills by category
 * - Filter skills by active status
 * - Skill caching for performance
 * - Integration with Skills-Endpoints.md contract
 *
 * @remarks
 * - All endpoints are public (no authentication required for GET operations)
 * - Admin endpoints (create, update, delete) are not implemented in this service
 * - Skills are used for both user career interests and mentor expertise tags
 * - User career interests are updated via PATCH /api/users/me with careerInterestIds
 * - Mentor expertise tags are updated via PATCH /api/mentors/{id} with expertiseTagIds
 *
 * @example
 * ```typescript
 * // Get all active skills
 * this.skillService.getAllSkills().subscribe(
 *   (skills) => this.skills = skills
 * );
 *
 * // Get skills by category
 * this.skillService.getSkillsByCategory(1).subscribe(
 *   (skills) => this.categorySkills = skills
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private readonly http = inject(HttpClient);

  // API endpoints
  private readonly API_URL = environment.apiUrl;
  private readonly SKILLS_URL = `${this.API_URL}/skills`;

  // Skills cache
  private skillsCache$ = new BehaviorSubject<Skill[] | null>(null);
  public skills$ = this.skillsCache$.asObservable();

  // ==================== Get Skills ====================

  /**
   * Get all skills with optional filtering
   *
   * @param categoryId - Optional category ID to filter by
   * @param isActive - Optional active status filter (default: true)
   * @returns Observable of Skill array
   *
   * @remarks
   * - Endpoint: GET /api/skills
   * - Public endpoint (no authentication required)
   * - Returns skills as flat list with category information
   * - Caches results for performance
   * - Use forceRefresh parameter to bypass cache
   *
   * @example
   * ```typescript
   * // Get all active skills
   * this.skillService.getAllSkills().subscribe(skills => {
   *   this.availableSkills = skills;
   * });
   *
   * // Get skills by category
   * this.skillService.getAllSkills(1).subscribe(skills => {
   *   this.careerDevSkills = skills;
   * });
   * ```
   */
  getAllSkills(categoryId?: number, isActive: boolean = true): Observable<Skill[]> {
    // Build query parameters
    let params = new HttpParams();
    if (categoryId !== undefined) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<Skill[]>>(this.SKILLS_URL, { params }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch skills');
        }
        return response.data;
      }),
      tap(skills => {
        // Update cache if fetching all skills
        if (!categoryId) {
          this.skillsCache$.next(skills);
        }
      }),
      shareReplay(1) // Share response among multiple subscribers
    );
  }

  /**
   * Get skills by category ID
   *
   * @param categoryId - Category ID to filter by
   * @param isActive - Optional active status filter (default: true)
   * @returns Observable of Skill array
   *
   * @remarks
   * - Convenience method for filtering by category
   * - Calls getAllSkills with categoryId parameter
   *
   * @example
   * ```typescript
   * this.skillService.getSkillsByCategory(3).subscribe(skills => {
   *   this.itSkills = skills;
   * });
   * ```
   */
  getSkillsByCategory(categoryId: number, isActive: boolean = true): Observable<Skill[]> {
    return this.getAllSkills(categoryId, isActive);
  }

  /**
   * Get cached skills (synchronous)
   *
   * @returns Cached skills array or null if not cached
   *
   * @remarks
   * - Returns immediately without API call
   * - Returns null if skills not cached
   * - Use getAllSkills() to fetch from API if not cached
   */
  getCachedSkills(): Skill[] | null {
    return this.skillsCache$.value;
  }

  /**
   * Refresh skills cache from API
   *
   * @returns Observable of refreshed Skill array
   *
   * @remarks
   * - Forces fresh fetch from API
   * - Ignores cache
   * - Updates cache with new data
   */
  refreshSkills(): Observable<Skill[]> {
    return this.getAllSkills();
  }

  /**
   * Clear skills cache
   *
   * @remarks
   * - Clears cached skills
   * - Next getAllSkills() will fetch from API
   */
  clearCache(): void {
    this.skillsCache$.next(null);
  }

  /**
   * Check if skills are loaded in cache
   *
   * @returns True if skills are cached, false otherwise
   */
  areSkillsLoaded(): boolean {
    return this.skillsCache$.value !== null && this.skillsCache$.value.length > 0;
  }

  /**
   * Get skill by ID from cache
   *
   * @param skillId - Skill ID to find
   * @returns Skill object or undefined if not found
   *
   * @remarks
   * - Searches cached skills only
   * - Returns undefined if not cached or not found
   */
  getSkillById(skillId: number): Skill | undefined {
    const skills = this.getCachedSkills();
    return skills?.find(skill => skill.id === skillId);
  }

  /**
   * Get multiple skills by IDs from cache
   *
   * @param skillIds - Array of skill IDs to find
   * @returns Array of Skill objects
   *
   * @remarks
   * - Searches cached skills only
   * - Skips IDs not found in cache
   * - Returns empty array if cache is empty
   */
  getSkillsByIds(skillIds: number[]): Skill[] {
    const skills = this.getCachedSkills();
    if (!skills) return [];

    return skillIds
      .map(id => skills.find(skill => skill.id === id))
      .filter((skill): skill is Skill => skill !== undefined);
  }

  /**
   * Group skills by category
   *
   * @param skills - Array of skills to group
   * @returns Map of category names to skill arrays
   *
   * @remarks
   * - Helper method for organizing skills by category
   * - Useful for displaying grouped skill lists
   */
  groupSkillsByCategory(skills: Skill[]): Map<string, Skill[]> {
    const grouped = new Map<string, Skill[]>();

    skills.forEach(skill => {
      const categoryName = skill.categoryName;
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(skill);
    });

    return grouped;
  }
}
