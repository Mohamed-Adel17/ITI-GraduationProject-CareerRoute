import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { CategoryBrowseComponent } from './category-browse.component';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/category.model';

/**
 * Unit Tests for CategoryBrowseComponent
 *
 * Test coverage includes:
 * - Component initialization and lifecycle
 * - Data loading and error handling
 * - User interactions (category clicks, refresh)
 * - Loading states and empty states
 * - Helper methods and edge cases
 * - Observable subscriptions and cleanup
 */

describe('CategoryBrowseComponent', () => {
  let component: CategoryBrowseComponent;
  let fixture: ComponentFixture<CategoryBrowseComponent>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Mock test data
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Software Development',
      description: 'Building software applications and systems',
      iconUrl: '💻',
      mentorCount: 42,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Data Science',
      description: 'Analyzing and interpreting complex data',
      iconUrl: '📊',
      mentorCount: 28,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: 'Leadership',
      description: null,
      iconUrl: null,
      mentorCount: 0,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    // Create spies for services
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getAllCategories',
      'refreshCategories',
      'categories$',
      'loading$'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Setup observable subjects for testing
    const categoriesSubject = new Subject<Category[]>();
    const loadingSubject = new Subject<boolean>();

    Object.defineProperty(categoryServiceSpy, 'categories$', {
      get: () => categoriesSubject.asObservable()
    });
    
    Object.defineProperty(categoryServiceSpy, 'loading$', {
      get: () => loadingSubject.asObservable()
    });

    categoryServiceSpy.getAllCategories.and.returnValue(of(mockCategories));
    categoryServiceSpy.refreshCategories.and.returnValue(of(mockCategories));

    await TestBed.configureTestingModule({
      imports: [CategoryBrowseComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBrowseComponent);
    component = fixture.componentInstance;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.categories).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.error).toBeNull();
  });

  describe('Component Initialization', () => {
    it('should load categories on ngOnInit', () => {
      spyOn(component as any, 'loadCategories');
      spyOn(component as any, 'subscribeToDataStreams');

      component.ngOnInit();

      expect((component as any).loadCategories).toHaveBeenCalled();
      expect((component as any).subscribeToDataStreams).toHaveBeenCalled();
    });

    it('should clean up subscriptions on ngOnDestroy', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    it('should call getAllCategories when loadCategories is called', () => {
      (component as any).loadCategories();
      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
    });

    it('should handle error when loading categories fails', () => {
      const errorMessage = 'Network error';
      mockCategoryService.getAllCategories.and.returnValue(throwError(() => new Error(errorMessage)));
      spyOn(console, 'error');

      (component as any).loadCategories();

      expect(component.error).toBe('Failed to load categories. Please try again.');
      expect(console.error).toHaveBeenCalledWith('Error loading categories:', jasmine.any(Error));
    });

    it('should subscribe to categories and loading streams', waitForAsync(() => {
      const categoriesSubject = new Subject<Category[]>();
      const loadingSubject = new Subject<boolean>();
      
      Object.defineProperty(mockCategoryService, 'categories$', {
        get: () => categoriesSubject.asObservable()
      });
      
      Object.defineProperty(mockCategoryService, 'loading$', {
        get: () => loadingSubject.asObservable()
      });

      (component as any).subscribeToDataStreams();

      // Test categories subscription
      categoriesSubject.next(mockCategories);
      expect(component.categories).toEqual(mockCategories);

      // Test loading subscription
      loadingSubject.next(true);
      expect(component.loading).toBe(true);

      loadingSubject.next(false);
      expect(component.loading).toBe(false);
    }));
  });

  describe('User Interactions', () => {
    it('should navigate to mentors page with category params when category is clicked', () => {
      const category = mockCategories[0];
      
      component.onCategoryClick(category);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mentors'], {
        queryParams: {
          categoryId: category.id,
          categoryName: category.name
        }
      });
    });

    it('should handle invalid category click gracefully', () => {
      spyOn(console, 'error');
      
      component.onCategoryClick(null as any);
      
      expect(console.error).toHaveBeenCalledWith('Invalid category selected');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle category without ID gracefully', () => {
      spyOn(console, 'error');
      const invalidCategory = { ...mockCategories[0], id: null as any };
      
      component.onCategoryClick(invalidCategory);
      
      expect(console.error).toHaveBeenCalledWith('Invalid category selected');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should refresh categories when refresh is called', () => {
      component.error = 'Previous error';
      
      component.refreshCategories();
      
      expect(component.error).toBeNull();
      expect(mockCategoryService.refreshCategories).toHaveBeenCalled();
    });

    it('should handle error when refreshing categories fails', () => {
      const errorMessage = 'Refresh failed';
      mockCategoryService.refreshCategories.and.returnValue(throwError(() => new Error(errorMessage)));
      spyOn(console, 'error');

      component.refreshCategories();

      expect(component.error).toBe('Failed to refresh categories. Please try again.');
      expect(console.error).toHaveBeenCalledWith('Error refreshing categories:', jasmine.any(Error));
    });
  });

  describe('Helper Methods', () => {
    it('should return category icon when available', () => {
      const category = mockCategories[0];
      expect(component.getCategoryIcon(category)).toBe('💻');
    });

    it('should return default icon when category has no icon', () => {
      const category = mockCategories[2];
      expect(component.getCategoryIcon(category)).toBe('📚');
    });

    it('should format mentor count text correctly for zero mentors', () => {
      const category = mockCategories[2];
      expect(component.getMentorCountText(category)).toBe('No mentors available');
    });

    it('should format mentor count text correctly for one mentor', () => {
      const category = { ...mockCategories[0], mentorCount: 1 };
      expect(component.getMentorCountText(category)).toBe('1 mentor available');
    });

    it('should format mentor count text correctly for multiple mentors', () => {
      const category = mockCategories[0];
      expect(component.getMentorCountText(category)).toBe('42 mentors available');
    });

    it('should handle null mentor count gracefully', () => {
      const category = { ...mockCategories[0], mentorCount: null as any };
      expect(component.getMentorCountText(category)).toBe('No mentors available');
    });

    it('should track categories by ID for ngFor optimization', () => {
      const category = mockCategories[0];
      expect(component.trackByCategoryId(0, category)).toBe(category.id);
    });
  });

  describe('Template Rendering', () => {
    it('should display loading state when loading', () => {
      component.loading = true;
      component.error = null;
      component.categories = [];
      fixture.detectChanges();

      const loadingElement = fixture.nativeElement.querySelector('[data-testid="loading-state"]');
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.textContent).toContain('Loading categories');
    });

    it('should display error state when error exists', () => {
      component.loading = false;
      component.error = 'Test error';
      component.categories = [];
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('[data-testid="error-state"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error');
    });

    it('should display categories grid when data is loaded', () => {
      component.loading = false;
      component.error = null;
      component.categories = mockCategories;
      fixture.detectChanges();

      const categoryCards = fixture.nativeElement.querySelectorAll('[data-testid="category-card"]');
      expect(categoryCards.length).toBe(mockCategories.length);
    });

    it('should display empty state when no categories', () => {
      component.loading = false;
      component.error = null;
      component.categories = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No Categories Available');
    });

    it('should display browse all mentors CTA when categories exist', () => {
      component.loading = false;
      component.error = null;
      component.categories = mockCategories;
      fixture.detectChanges();

      const browseAllButton = fixture.nativeElement.querySelector('[data-testid="browse-all-button"]');
      expect(browseAllButton).toBeTruthy();
      expect(browseAllButton.textContent).toContain('Browse All Mentors');
    });
  });

  describe('Edge Cases', () => {
    it('should handle categories without description', () => {
      const categoryWithoutDescription = { ...mockCategories[2] };
      expect(categoryWithoutDescription.description).toBeNull();
      
      const descriptionText = component.getMentorCountText(categoryWithoutDescription);
      expect(descriptionText).toBe('No mentors available');
    });

    it('should handle very large mentor counts', () => {
      const categoryWithLargeCount = { ...mockCategories[0], mentorCount: 999999 };
      const countText = component.getMentorCountText(categoryWithLargeCount);
      expect(countText).toBe('999999 mentors available');
    });

    it('should handle category with empty string name', () => {
      const categoryWithEmptyName = { ...mockCategories[0], name: '' };
      expect(component.getCategoryIcon(categoryWithEmptyName)).toBe('💻');
    });

    it('should handle concurrent refresh calls', () => {
      mockCategoryService.refreshCategories.and.returnValue(of(mockCategories));
      
      component.refreshCategories();
      component.refreshCategories();
      component.refreshCategories();

      expect(mockCategoryService.refreshCategories).toHaveBeenCalledTimes(3);
      expect(component.error).toBeNull();
    });
  });

  describe('Observable Management', () => {
    it('should unsubscribe from observables on destroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should handle multiple category updates', waitForAsync(() => {
      const categoriesSubject = new Subject<Category[]>();
      Object.defineProperty(mockCategoryService, 'categories$', {
        get: () => categoriesSubject.asObservable()
      });

      (component as any).subscribeToDataStreams();

      // Send multiple updates
      categoriesSubject.next([mockCategories[0]]);
      expect(component.categories.length).toBe(1);

      categoriesSubject.next(mockCategories);
      expect(component.categories.length).toBe(3);

      categoriesSubject.next([]);
      expect(component.categories.length).toBe(0);
    }));
  });

  describe('Integration with Services', () => {
    it('should use CategoryService methods correctly', () => {
      component.loadCategories();
      expect(mockCategoryService.getAllCategories).toHaveBeenCalledWith();

      component.refreshCategories();
      expect(mockCategoryService.refreshCategories).toHaveBeenCalledWith();
    });

    it('should handle service observables correctly', () => {
      expect(component.categories$).toBeDefined();
      expect(component.loading$).toBeDefined();
    });
  });
});
