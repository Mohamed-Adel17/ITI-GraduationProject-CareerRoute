import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MentorSearchStateService } from './mentor-search-state.service';
import { MentorService } from '../../../core/services/mentor.service';
import {
  MentorListItem,
  MentorSearchParams,
  MentorSearchResponse,
  PaginationMetadata,
  MentorApprovalStatus
} from '../../../shared/models/mentor.model';

describe('MentorSearchStateService', () => {
  let service: MentorSearchStateService;
  let mentorService: jasmine.SpyObj<MentorService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRoute;

  // Mock data
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
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      profilePictureUrl: null,
      bio: 'Angular specialist',
      expertiseTags: [{ id: 2, name: 'Angular', categoryId: 1, categoryName: 'Web Development', isActive: true }],
      yearsOfExperience: 7,
      certifications: null,
      rate30Min: 60,
      rate60Min: 100,
      averageRating: 4.8,
      totalReviews: 15,
      totalSessionsCompleted: 30,
      isVerified: true,
      approvalStatus: MentorApprovalStatus.Approved,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
      categories: [],
      responseTime: 'within 1 hour',
      completionRate: 98.0,
      isAvailable: true
    }
  ];

  const mockPagination: PaginationMetadata = {
    totalCount: 2,
    currentPage: 1,
    pageSize: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  };

  const mockAppliedFilters = {
    keywords: null,
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    minRating: null,
    sortBy: 'popularity'
  };

  const mockSearchResponse: MentorSearchResponse = {
    mentors: mockMentors,
    pagination: mockPagination,
    appliedFilters: mockAppliedFilters
  };

  beforeEach(() => {
    const mentorServiceSpy = jasmine.createSpyObj('MentorService', ['getAllMentors']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        MentorSearchStateService,
        { provide: MentorService, useValue: mentorServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    });

    service = TestBed.inject(MentorSearchStateService);
    mentorService = TestBed.inject(MentorService) as jasmine.SpyObj<MentorService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    route = TestBed.inject(ActivatedRoute);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have default state values', (done) => {
      service.query$.subscribe((query) => {
        expect(query).toBe('');
      });

      service.currentPage$.subscribe((page) => {
        expect(page).toBe(1);
      });

      service.pageSize$.subscribe((pageSize) => {
        expect(pageSize).toBe(12);
        done();
      });
    });

    it('should initialize and load mentors', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      let results: MentorListItem[] = [];
      service.searchResults$.subscribe((mentors) => {
        results = mentors;
      });

      service.initialize();
      tick(500); // Wait for debounce

      expect(mentorService.getAllMentors).toHaveBeenCalled();
      expect(results.length).toBe(2);
    }));
  });

  describe('Query Management', () => {
    it('should update query and reset to page 1', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.setPage(3);
      tick(500);

      let currentPage = 0;
      service.currentPage$.subscribe((page) => {
        currentPage = page;
      });

      service.setQuery('react');
      tick(500);

      expect(currentPage).toBe(1);
    }));

    it('should debounce query input', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      const initialCallCount = mentorService.getAllMentors.calls.count();

      service.setQuery('r');
      tick(100);
      service.setQuery('re');
      tick(100);
      service.setQuery('rea');
      tick(100);
      service.setQuery('reac');
      tick(100);
      service.setQuery('react');
      tick(500); // Complete debounce

      // Should only make one additional call after debounce completes
      expect(mentorService.getAllMentors.calls.count()).toBe(initialCallCount + 1);
    }));

    it('should not update if query is the same', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      const initialCallCount = mentorService.getAllMentors.calls.count();

      service.setQuery('react');
      tick(500);

      const afterFirstUpdate = mentorService.getAllMentors.calls.count();

      service.setQuery('react'); // Same query
      tick(500);

      // Should not make additional call for same query
      expect(mentorService.getAllMentors.calls.count()).toBe(afterFirstUpdate);
    }));
  });

  describe('Filters Management', () => {
    it('should update filters and reset to page 1', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.setPage(2);
      tick(500);

      let currentPage = 0;
      service.currentPage$.subscribe((page) => {
        currentPage = page;
      });

      const filters: MentorSearchParams = {
        categoryId: 1,
        minPrice: 20,
        maxPrice: 100
      };

      service.setFilters(filters);
      tick(500);

      expect(currentPage).toBe(1);
    }));

    it('should not update if filters are the same', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      const filters: MentorSearchParams = {
        categoryId: 1,
        minPrice: 20
      };

      service.setFilters(filters);
      tick(500);

      const callCount = mentorService.getAllMentors.calls.count();

      service.setFilters(filters); // Same filters
      tick(500);

      expect(mentorService.getAllMentors.calls.count()).toBe(callCount);
    }));
  });

  describe('Pagination Management', () => {
    it('should update page number', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      let currentPage = 0;
      service.currentPage$.subscribe((page) => {
        currentPage = page;
      });

      service.setPage(3);
      tick(500);

      expect(currentPage).toBe(3);
    }));

    it('should not allow page less than 1', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      let currentPage = 0;
      service.currentPage$.subscribe((page) => {
        currentPage = page;
      });

      service.setPage(0);
      tick(500);

      expect(currentPage).toBe(1); // Should remain 1
    }));

    it('should update page size and reset to page 1', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.setPage(2);
      tick(500);

      let currentPage = 0;
      let pageSize = 0;

      service.currentPage$.subscribe((page) => {
        currentPage = page;
      });

      service.pageSize$.subscribe((size) => {
        pageSize = size;
      });

      service.setPageSize(24);
      tick(500);

      expect(pageSize).toBe(24);
      expect(currentPage).toBe(1);
    }));
  });

  describe('Caching', () => {
    it('should cache search results', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      expect(mentorService.getAllMentors).toHaveBeenCalledTimes(1);

      // Reset and initialize again with same params
      service.ngOnDestroy();
      service = TestBed.inject(MentorSearchStateService);
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      // Should make a new call because service was recreated
      expect(mentorService.getAllMentors).toHaveBeenCalledTimes(2);
    }));

    it('should clear cache on refresh', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      const initialCallCount = mentorService.getAllMentors.calls.count();

      service.refresh(); // Clear cache and refresh
      tick(500);

      expect(mentorService.getAllMentors.calls.count()).toBeGreaterThan(initialCallCount);
    }));

    it('should clear cache manually', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.initialize();
      tick(500);

      service.clearCache();

      // Next search should hit API
      service.setQuery('test');
      tick(500);

      expect(mentorService.getAllMentors.calls.count()).toBeGreaterThan(1);
    }));
  });

  describe('Loading State', () => {
    it('should set loading state during API call', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      const loadingStates: boolean[] = [];
      service.isLoading$.subscribe((loading) => {
        loadingStates.push(loading);
      });

      service.initialize();
      tick(500);

      // Should have been true during loading
      expect(loadingStates).toContain(true);
      expect(loadingStates[loadingStates.length - 1]).toBe(false);
    }));
  });

  describe('Error Handling', () => {
    it('should handle API errors', fakeAsync(() => {
      const error = new Error('API Error');
      mentorService.getAllMentors.and.returnValue(throwError(() => error));

      let errorMessage: string | null = null;
      service.error$.subscribe((err) => {
        errorMessage = err;
      });

      service.initialize();
      tick(500);

      expect(errorMessage).toBeTruthy();
      expect(errorMessage!).toContain('API Error');
    }));

    it('should return empty results on error', fakeAsync(() => {
      const error = new Error('API Error');
      mentorService.getAllMentors.and.returnValue(throwError(() => error));

      let results: MentorListItem[] = [];
      service.searchResults$.subscribe((mentors) => {
        results = mentors;
      });

      service.initialize();
      tick(500);

      expect(results).toEqual([]);
    }));
  });

  describe('State Management', () => {
    it('should get state snapshot', fakeAsync(() => {
      service.setQuery('react');
      service.setFilters({ categoryId: 1 });
      service.setPage(2);
      service.setPageSize(24);
      tick(500);

      const snapshot = service.getStateSnapshot();

      expect(snapshot.query).toBe('react');
      expect(snapshot.filters.categoryId).toBe(1);
      expect(snapshot.page).toBe(1); // Should be reset to 1
      expect(snapshot.pageSize).toBe(24);
    }));

    it('should reset all state', fakeAsync(() => {
      service.setQuery('test');
      service.setFilters({ categoryId: 1 });
      service.setPage(2);
      service.setPageSize(24);
      tick(500);

      service.reset();
      tick(500);

      const snapshot = service.getStateSnapshot();

      expect(snapshot.query).toBe('');
      expect(snapshot.filters).toEqual({});
      expect(snapshot.page).toBe(1);
      expect(snapshot.pageSize).toBe(12);
    }));
  });

  describe('Utility Methods', () => {
    it('should detect active filters', fakeAsync(() => {
      service.setQuery('react');
      tick(500);

      expect(service.hasActiveFilters()).toBe(true);

      service.reset();
      tick(500);

      expect(service.hasActiveFilters()).toBe(false);
    }));

    it('should count active filters', fakeAsync(() => {
      service.setQuery('react');
      service.setFilters({ categoryId: 1, minPrice: 20, minRating: 4 });
      tick(500);

      // query + categoryId + minPrice + minRating = 4
      expect(service.getActiveFilterCount()).toBe(4);
    }));
  });

  describe('Combined State Updates', () => {
    it('should update query and filters together', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      service.setQueryAndFilters('react', { categoryId: 1, minRating: 4 });
      tick(500);

      const snapshot = service.getStateSnapshot();

      expect(snapshot.query).toBe('react');
      expect(snapshot.filters.categoryId).toBe(1);
      expect(snapshot.filters.minRating).toBe(4);
      expect(snapshot.page).toBe(1); // Should reset to page 1
    }));
  });

  describe('Observables', () => {
    it('should expose all required observables', (done) => {
      expect(service.query$).toBeDefined();
      expect(service.filters$).toBeDefined();
      expect(service.currentPage$).toBeDefined();
      expect(service.pageSize$).toBeDefined();
      expect(service.isLoading$).toBeDefined();
      expect(service.error$).toBeDefined();
      expect(service.searchResults$).toBeDefined();
      expect(service.pagination$).toBeDefined();
      expect(service.totalCount$).toBeDefined();

      done();
    });

    it('should emit pagination metadata', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      let pagination: PaginationMetadata | null = null;
      service.pagination$.subscribe((p) => {
        pagination = p;
      });

      service.initialize();
      tick(500);

      expect(pagination).toBeTruthy();
      expect(pagination?.totalCount).toBe(2);
      expect(pagination?.currentPage).toBe(1);
    }));

    it('should emit total count', fakeAsync(() => {
      mentorService.getAllMentors.and.returnValue(of(mockSearchResponse));

      let totalCount = 0;
      service.totalCount$.subscribe((count) => {
        totalCount = count;
      });

      service.initialize();
      tick(500);

      expect(totalCount).toBe(2);
    }));
  });
});
