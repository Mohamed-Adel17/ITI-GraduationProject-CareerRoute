import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, AfterViewInit, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { MentorService } from '../../../core/services/mentor.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category } from '../../../shared/models/category.model';
import { UserRole } from '../../../shared/models/user.model';

/**
 * HomeComponent - Landing Page
 *
 * Main landing page for CareerRoute platform.
 * Displays hero section with value proposition and call-to-action buttons.
 *
 * Sections (Phase 1 - MVP):
 * - Hero Section: Background image, headline, CTAs, trust indicators
 * - How It Works: 3-step process explanation
 * - Browse Categories: Top 8 categories linking to /mentors with category filter
 * - Final CTA: Conversion section before footer
 *
 * Future sections (Phase 2):
 * - Featured Mentors
 * - Stats Banner
 * - Why Choose CareerRoute
 * - Testimonials
 *
 * User Journeys:
 * 1. Browse Mentors → /mentors (search/filter)
 * 2. Browse All Categories → /categories (category grid)
 * 3. View Category Mentors → /mentors?categoryId={id}&categoryName={name}
 *
 * Access: Public (no authentication required)
 * Guards: None
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly mentorService = inject(MentorService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly el = inject(ElementRef);
  private destroy$ = new Subject<void>();

  // Animated counter values
  animatedMentors = 0;
  animatedSessions = 0;
  animatedRating = 0;
  animatedSpecs = 0;

  /**
   * Trust indicators displayed in hero section
   */
  trustIndicators = {
    mentors: '1,000+',
    sessions: '10,000+',
    rating: '4.8',
    specializations: '50+'
  };

  /**
   * Top categories to display on home page (limited to 8)
   */
  topCategories: Category[] = [];

  /**
   * Loading state for categories
   */
  categoriesLoading = false;

  /**
   * Loading state for approval status check
   */
  checkingApprovalStatus = false;

  /**
   * Indicates whether user has submitted mentor application
   * null = not checked yet, true = submitted, false = not submitted
   */
  private hasMentorProfile: boolean | null = null;

  /**
   * Determines whether to show the "Become a Mentor" button
   * Shows if user registered as mentor (isMentor=true) but hasn't submitted application yet
   * Excludes admins and already-approved mentors
   */
  get showBecomeAMentorButton(): boolean {
    // Only show for authenticated users
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    // Don't show for admins (they use admin dashboard, not mentor flow)
    const isAdmin = this.authService.hasRole(UserRole.Admin);
    if (isAdmin) {
      return false;
    }

    // Must have isMentor flag but not Mentor role
    const hasIsMentorFlag = this.authService.isMentor();
    const hasMentorRole = this.authService.hasRole(UserRole.Mentor);

    if (!hasIsMentorFlag || hasMentorRole) {
      return false;
    }

    // Show only if user hasn't submitted application (no mentor profile)
    return this.hasMentorProfile === false;
  }

  /**
   * Determines whether to show the "Check Approval Status" button
   * Shows if user has submitted mentor application but not approved yet
   * Excludes admins and already-approved mentors
   */
  get showCheckApprovalButton(): boolean {
    // Only show for authenticated users
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    // Don't show for admins (they use admin dashboard, not mentor flow)
    const isAdmin = this.authService.hasRole(UserRole.Admin);
    if (isAdmin) {
      return false;
    }

    // Must have isMentor flag but not Mentor role
    const hasIsMentorFlag = this.authService.isMentor();
    const hasMentorRole = this.authService.hasRole(UserRole.Mentor);

    if (!hasIsMentorFlag || hasMentorRole) {
      return false;
    }

    // Show only if user has submitted application (has mentor profile)
    return this.hasMentorProfile === true;
  }

  ngOnInit(): void {
    this.loadTopCategories();
    this.checkMentorProfileStatus();

    // Re-check on navigation back to home
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter(event => (event as NavigationEnd).url === '/' || (event as NavigationEnd).url.startsWith('/?')),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkMentorProfileStatus();
        this.cdr.detectChanges();
      });
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
    this.animateCounters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollAnimations(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
        }
      });
    }, { threshold: 0.1 });

    this.el.nativeElement.querySelectorAll('.animate-on-scroll').forEach((el: Element) => {
      observer.observe(el);
    });
  }

  private animateCounters(): void {
    const duration = 2000;
    const start = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.animatedMentors = Math.floor(1000 * eased);
      this.animatedSessions = Math.floor(10000 * eased);
      this.animatedRating = Math.round(48 * eased) / 10;
      this.animatedSpecs = Math.floor(50 * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Check if authenticated user has submitted mentor application
   * Sets hasMentorProfile based on API response (404 = not submitted, 200 = submitted)
   */
  private checkMentorProfileStatus(): void {
    // Only check for users with isMentor flag who aren't approved yet
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Don't check for admins - they don't have mentor profiles
    const isAdmin = this.authService.hasRole(UserRole.Admin);
    if (isAdmin) {
      return;
    }

    const hasIsMentorFlag = this.authService.isMentor();
    const hasMentorRole = this.authService.hasRole(UserRole.Mentor);

    // Only check for pending mentors (Type 2 or 3)
    if (!hasIsMentorFlag || hasMentorRole) {
      return;
    }

    // Try to fetch mentor profile
    this.mentorService.getCurrentMentorProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          // Type 3: Has mentor profile (application submitted)
          this.hasMentorProfile = true;
        },
        error: (error) => {
          if (error.status === 404) {
            // Type 2: No mentor profile (no application submitted)
            this.hasMentorProfile = false;
          } else {
            // Other errors, default to not showing buttons
            console.error('Error checking mentor profile:', error);
            this.hasMentorProfile = null;
          }
        }
      });
  }

  /**
   * Load top 8 categories for home page display
   */
  private loadTopCategories(): void {
    this.categoriesLoading = true;
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          // Take first 8 active categories
          this.topCategories = categories
            .filter(cat => cat.isActive)
            .slice(0, 8);
          this.categoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.categoriesLoading = false;
        }
      });
  }

  /**
   * Navigate to browse mentors page
   * Public access, no authentication required
   */
  browseMentors(): void {
    this.router.navigate(['/mentors']);
  }

  /**
   * Navigate to mentor application page
   * Requires authentication (protected by authGuard on route)
   */
  becomeMentor(): void {
    this.router.navigate(['/user/apply-mentor']);
  }

  /**
   * Navigate to categories page
   * Public access, no authentication required
   */
  exploreCategories(): void {
    this.router.navigate(['/categories']);
  }

  /**
   * Navigate to mentor list with category filter
   * @param category - Category to view mentors for
   */
  viewCategory(category: Category): void {
    if (!category?.id) {
      console.error('Invalid category selected');
      return;
    }

    // Navigate to mentor list with category filter
    this.router.navigate(['/mentors'], {
      queryParams: {
        categoryId: category.id,
      }
    });
  }

  /**
   * Get mentor count display text
   * @param count - Number of mentors
   * @returns Formatted string with mentor count
   */
  getMentorCountText(count: number | null | undefined): string {
    if (!count || count === 0) {
      return 'No mentors';
    }
    return count === 1 ? '1 mentor' : `${count} mentors`;
  }

  /**
   * Check approval status by refreshing the authentication token
   *
   * This method refreshes the JWT token to get the latest user roles from the backend.
   * If the user has been approved as a mentor by an admin, the refreshed token will
   * include the 'Mentor' role, and the UI will update automatically.
   *
   * Use case: Pending mentors can click "Check Approval Status" to see if they've been approved
   * without needing to log out and log back in.
   */
  checkApprovalStatus(): void {
    this.checkingApprovalStatus = true;

    this.authService.refreshToken()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.checkingApprovalStatus = false;

          // Check if user now has Mentor role
          const hasMentorRole = this.authService.hasRole(UserRole.Mentor);

          if (hasMentorRole) {
            // User has been approved!
            this.notificationService.success(
              'Congratulations! Your mentor application has been approved. You now have access to mentor features.',
              'Application Approved!',
              10000 // Show for 10 seconds
            );

            // Update button visibility
            this.hasMentorProfile = null; // Hide both buttons

            // Navigate to mentor dashboard
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000); // Give user time to read the message
          } else {
            // Still pending
            this.notificationService.info(
              'Your mentor application is still pending review. We will notify you once it has been reviewed.',
              'Status: Pending',
              6000
            );
          }
        },
        error: (error) => {
          this.checkingApprovalStatus = false;
          console.error('Error checking approval status:', error);
          this.notificationService.error(
            'Unable to check approval status. Please try again later.',
            'Error'
          );
        }
      });
  }
}
