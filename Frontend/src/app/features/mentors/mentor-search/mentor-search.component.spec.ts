import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { MentorSearchComponent } from './mentor-search.component';
import { MentorSearchStateService } from '../services/mentor-search-state.service';
import { CategoryService } from '../../../core/services/category.service';
import { MentorListComponent } from '../mentor-list/mentor-list.component';
import { FiltersPanelComponent } from '../filters-panel/filters-panel.component';
import {
  MentorListItem,
  MentorSearchParams,
  PaginationMetadata,
  MentorApprovalStatus
} from '../../../shared/models/mentor.model';
import { Category } from '../../../shared/models/category.model';

describe('MentorSearchComponent', () => {
  let component: MentorSearchComponent;
  let fixture: ComponentFixture<MentorSearchComponent>;
  let searchStateService: jasmine.SpyObj<MentorSearchStateService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let router: jasmine.SpyObj<Router>;

  // Mock data
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Web Development',
      description: 'Frontend and backend development',
      iconUrl: null,
      mentorCount: 25,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null
    },
    {
      id: 2,
      name: 'Data Science',
      description: 'Machine learning and analytics',
      iconUrl: null,
      mentorCount: 15,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null
    }
  ];

  const mockMentors: MentorListItem[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john@example.com',
      profilePictureUrl: null,
      bio: 'React expert',
      expertiseTags: [{ id: 1, name: 'React', categoryId: 1, categoryName: 'Web Development', isActive: true }],
      yearsOfExperience: 5,
      certifications: null,
      rate30Min: 50,
      rate60Min: 90,
      averageRating: 4.5,
      totalReviews: 10,
      totalSessionsCompleted: 20,
      isVerified: true,
      approvalStatus: MentorApprovalStatus.Approved,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
      categories: [],
      responseTime: 'within 2 hours',
      completionRate: 95.5,
      isAvailable: true
    }
  ];

  const mockPagination: PaginationMetadata = {
    totalCount: 25,
    currentPage: 1,
    pageSize: 12,
    totalPages: 3,
    hasNextPage: true,
    hasPreviousPage: false
  };

  // Behavior subjects for observables
  let searchResults$: BehaviorSubject<MentorListItem[]>;
  let pagination$: BehaviorSubject<PaginationMetadata | null>;
  let totalCount$: BehaviorSubject<number>;
  let currentPage$: BehaviorSubject<number>;
  let pageSize$: BehaviorSubject<number>;
  let isLoading$: BehaviorSubject<boolean>;
  let error$: BehaviorSubject<string | null>;
  let query$: BehaviorSubject<string>;
  let filters$: BehaviorSubject<MentorSearchParams>;

  beforeEach(async () => {
    // Initialize behavior subjects
    searchResults$ = new BehaviorSubject<MentorListItem[]>(mockMentors);
    pagination$ = new BehaviorSubject<PaginationMetadata | null>(mockPagination);
    totalCount$ = new BehaviorSubject<number>(25);
    currentPage$ = new BehaviorSubject<number>(1);
    pageSize$ = new BehaviorSubject<number>(12);
    isLoading$ = new BehaviorSubject<boolean>(false);
    error$ = new BehaviorSubject<string | null>(null);
    query$ = new BehaviorSubject<string>('');
    filters$ = new BehaviorSubject<MentorSearchParams>({});

    const searchStateSpy = jasmine.createSpyObj('MentorSearchStateService', [
      'initialize',
      'setQuery',
      'setFilters',
      'setPage',
      'setPageSize',
      'reset',
      'refresh',
      'hasActiveFilters',
      'getActiveFilterCount'
    ], {
      searchResults$: searchResults$.asObservable(),
      pagination$: pagination$.asObservable(),
      totalCount$: totalCount$.asObservable(),
      currentPage$: currentPage$.asObservable(),
      pageSize$: pageSize$.asObservable(),
      isLoading$: isLoading$.asObservable(),
      error$: error$.asObservable(),
      query$: query$.asObservable(),
      filters$: filters$.asObservable()
    });

    const categorySpy = jasmine.createSpyObj('CategoryService', ['getAllCategories']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MentorSearchComponent],
      providers: [
        { provide: MentorSearchStateService, useValue: searchStateSpy },
        { provide: CategoryService, useValue: categorySpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    searchStateService = TestBed.inject(MentorSearchStateService) as jasmine.SpyObj<MentorSearchStateService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Default spy returns
    searchStateService.hasActiveFilters.and.returnValue(false);
    searchStateService.getActiveFilterCount.and.returnValue(0);
    categoryService.getAllCategories.and.returnValue(of(mockCategories));

    fixture = TestBed.createComponent(MentorSearchComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize search state with URL sync on init', () => {
      fixture.detectChanges();
      expect(searchStateService.initialize).toHaveBeenCalledWith(true);
    });

    it('should load categories on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(categoryService.getAllCategories).toHaveBeenCalled();
      expect(component.categories).toEqual(mockCategories);
      expect(component.categoriesLoading).toBe(false);
    }));

    it('should subscribe to all search state observables', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.mentors).toEqual(mockMentors);
      expect(component.pagination).toEqual(mockPagination);
      expect(component.totalCount).toBe(25);
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(12);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.searchQuery).toBe('');
    }));
  });

  describe('Search Input', () => {
    it('should update query when search input changes', () => {
      const event = {
        target: { value: 'react' }
      } as any;

      component.onSearchInput(event);

      expect(searchStateService.setQuery).toHaveBeenCalledWith('react');
    });

    it('should clear search query', () => {
      component.clearSearch();

      expect(searchStateService.setQuery).toHaveBeenCalledWith('');
    });
  });

  describe('Filters', () => {
    it('should update filters when filters change', () => {
      const filters: MentorSearchParams = {
        categoryId: 1,
        minPrice: 20,
        maxPrice: 100
      };

      component.onFiltersChange(filters);

      expect(searchStateService.setFilters).toHaveBeenCalledWith(filters);
    });

    it('should close mobile filters after applying filters', () => {
      spyOn(component, 'isMobileView').and.returnValue(true);
      component.filtersOpen = true;

      const filters: MentorSearchParams = { categoryId: 1 };
      component.onFiltersChange(filters);

      expect(component.filtersOpen).toBe(false);
    });

    it('should not close desktop filters after applying filters', () => {
      spyOn(component, 'isMobileView').and.returnValue(false);
      component.filtersOpen = true;

      const filters: MentorSearchParams = { categoryId: 1 };
      component.onFiltersChange(filters);

      expect(component.filtersOpen).toBe(true);
    });

    it('should toggle filters panel', () => {
      component.filtersOpen = false;
      component.toggleFilters();
      expect(component.filtersOpen).toBe(true);

      component.toggleFilters();
      expect(component.filtersOpen).toBe(false);
    });

    it('should close filters panel', () => {
      component.filtersOpen = true;
      component.closeFilters();
      expect(component.filtersOpen).toBe(false);
    });

    it('should reset filters', () => {
      component.resetFilters();
      expect(searchStateService.reset).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should change page when page changes', () => {
      const scrollToSpy = jasmine.createSpy('scrollTo');
      window.scrollTo = scrollToSpy;

      component.onPageChange(2);

      expect(searchStateService.setPage).toHaveBeenCalledWith(2);
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should change page size', () => {
      component.onPageSizeChange(24);

      expect(searchStateService.setPageSize).toHaveBeenCalledWith(24);
    });
  });

  describe('Refresh', () => {
    it('should refresh results', () => {
      component.refreshResults();

      expect(searchStateService.refresh).toHaveBeenCalled();
    });
  });

  describe('UI State', () => {
    it('should check if mobile view', () => {
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(500);
      expect(component.isMobileView()).toBe(true);

      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1024);
      expect(component.isMobileView()).toBe(false);
    });

    it('should get result count text for loading', () => {
      component.loading = true;
      expect(component.getResultCountText()).toBe('Loading...');
    });

    it('should get result count text for no results', () => {
      component.loading = false;
      component.totalCount = 0;
      expect(component.getResultCountText()).toBe('No mentors found');
    });

    it('should get result count text for single result', () => {
      component.loading = false;
      component.totalCount = 1;
      component.currentPage = 1;
      component.pageSize = 12;
      expect(component.getResultCountText()).toBe('1 mentor found');
    });

    it('should get result count text for multiple results on page 1', () => {
      component.loading = false;
      component.totalCount = 25;
      component.currentPage = 1;
      component.pageSize = 12;
      expect(component.getResultCountText()).toBe('Showing 1-12 of 25 mentors');
    });

    it('should get result count text for multiple results on page 2', () => {
      component.loading = false;
      component.totalCount = 25;
      component.currentPage = 2;
      component.pageSize = 12;
      expect(component.getResultCountText()).toBe('Showing 13-24 of 25 mentors');
    });

    it('should get result count text for last page', () => {
      component.loading = false;
      component.totalCount = 25;
      component.currentPage = 3;
      component.pageSize = 12;
      expect(component.getResultCountText()).toBe('Showing 25-25 of 25 mentors');
    });

    it('should check if filters are active', () => {
      searchStateService.hasActiveFilters.and.returnValue(true);
      expect(component.hasActiveFilters()).toBe(true);

      searchStateService.hasActiveFilters.and.returnValue(false);
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should get active filter count', () => {
      searchStateService.getActiveFilterCount.and.returnValue(3);
      expect(component.getActiveFilterCount()).toBe(3);
    });
  });

  describe('Observable Updates', () => {
    it('should update mentors when observable emits', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const newMentors: MentorListItem[] = [...mockMentors, { ...mockMentors[0], id: '2' }];
      searchResults$.next(newMentors);
      tick();

      expect(component.mentors).toEqual(newMentors);
    }));

    it('should update loading state when observable emits', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      isLoading$.next(true);
      tick();

      expect(component.loading).toBe(true);

      isLoading$.next(false);
      tick();

      expect(component.loading).toBe(false);
    }));

    it('should update error when observable emits', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      error$.next('Failed to load mentors');
      tick();

      expect(component.error).toBe('Failed to load mentors');
    }));

    it('should update active filter count when filters change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      searchStateService.getActiveFilterCount.and.returnValue(2);
      filters$.next({ categoryId: 1, minPrice: 20 });
      tick();

      expect(component.activeFilterCount).toBe(2);
    }));
  });

  describe('Error Handling', () => {
    it('should handle category loading error', fakeAsync(() => {
      categoryService.getAllCategories.and.returnValue(
        new (class extends Error {
          constructor() {
            super('Failed to load categories');
          }
        })() as any
      );

      spyOn(console, 'error');
      fixture.detectChanges();
      tick();

      expect(component.categoriesLoading).toBe(false);
    }));
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
