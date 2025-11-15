import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MentorSearchParams } from '../../../shared/models/mentor.model';
import { Category } from '../../../shared/models/category.model';

/**
 * FiltersPanelComponent
 *
 * @description
 * Sidebar/panel component with filters for mentor browsing.
 * Provides comprehensive filtering options with reactive forms and debouncing.
 * Search functionality is handled by the parent MentorSearchComponent.
 *
 * Features:
 * - Price range slider (min/max)
 * - Rating filter dropdown (1-5 stars)
 * - Availability checkbox (only show available mentors)
 * - Verified mentors checkbox
 * - Sort dropdown (rating, price asc/desc, popularity)
 * - Category filter dropdown
 * - Reset button to clear all filters
 * - Mobile: Collapsible panel with toggle button
 * - Reactive forms with automatic debouncing
 * - Emits filter changes to parent component
 *
 * @remarks
 * - Uses Reactive Forms for validation and state management
 * - Debounces filter changes to reduce API calls
 * - Part of US2 - Browse and Search for Mentors
 * - Responsive design with mobile collapse functionality
 * - Does NOT include search input (handled by parent component)
 *
 * @example
 * ```html
 * <app-filters-panel
 *   [categories]="categoryList"
 *   [initialFilters]="currentFilters"
 *   (filtersChange)="onFiltersChange($event)">
 * </app-filters-panel>
 * ```
 */
@Component({
  selector: 'app-filters-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css']
})
export class FiltersPanelComponent implements OnInit, OnDestroy {
  /**
   * List of categories for category filter dropdown
   */
  @Input() categories: Category[] = [];

  /**
   * Initial filter values to populate form
   */
  @Input() initialFilters?: MentorSearchParams;

  /**
   * Whether to show the panel on mobile (controlled by parent)
   */
  @Input() mobileOpen: boolean = false;

  /**
   * Event emitted when filters change (debounced)
   */
  @Output() filtersChange = new EventEmitter<MentorSearchParams>();

  /**
   * Event emitted when mobile panel toggle is clicked
   */
  @Output() mobileToggle = new EventEmitter<void>();

  // Form and state
  filtersForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private filterChangeSubject$ = new Subject<MentorSearchParams>();

  // UI State
  isCollapsed: boolean = false; // For desktop collapse
  showAdvancedFilters: boolean = false;

  // Sort options
  sortOptions = [
    { value: 'rating', label: 'Highest Rating' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'priceAsc', label: 'Price: Low to High' },
    { value: 'priceDesc', label: 'Price: High to Low' }
  ];

  // Rating options
  ratingOptions = [
    { value: null, label: 'Any Rating' },
    { value: 4.5, label: '4.5+ Stars' },
    { value: 4.0, label: '4.0+ Stars' },
    { value: 3.5, label: '3.5+ Stars' },
    { value: 3.0, label: '3.0+ Stars' }
  ];

  // Price range constants
  readonly MIN_PRICE = 20;
  readonly MAX_PRICE = 500;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFilterChangeListener();

    // Apply initial filters if provided
    if (this.initialFilters) {
      this.applyInitialFilters(this.initialFilters);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive form with all filter controls
   * Note: Search keywords are handled by the parent MentorSearchComponent
   */
  private initializeForm(): void {
    this.filtersForm = this.fb.group({
      categoryId: [null],
      minPrice: [this.MIN_PRICE],
      maxPrice: [this.MAX_PRICE],
      minRating: [null],
      availableOnly: [false],
      verifiedOnly: [false],
      sortBy: ['rating']
    });
  }

  /**
   * Set up listener for form changes with debouncing
   */
  private setupFilterChangeListener(): void {
    // Listen to form value changes
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe((formValue) => {
        const filters = this.buildFilterParams(formValue);
        this.filtersChange.emit(filters);
      });
  }

  /**
   * Build MentorSearchParams from form values
   * Note: Keywords/search query is handled by parent component
   * @param formValue Current form values
   */
  private buildFilterParams(formValue: any): MentorSearchParams {
    const params: MentorSearchParams = {};

    // Add category if selected
    if (formValue.categoryId) {
      params.categoryId = formValue.categoryId;
    }

    // Add price range if different from defaults
    if (formValue.minPrice > this.MIN_PRICE) {
      params.minPrice = formValue.minPrice;
    }
    if (formValue.maxPrice < this.MAX_PRICE) {
      params.maxPrice = formValue.maxPrice;
    }

    // Add rating filter
    if (formValue.minRating) {
      params.minRating = formValue.minRating;
    }

    // Add availability filter
    if (formValue.availableOnly) {
      params.availableOnly = true;
    }

    // Add verified filter
    if (formValue.verifiedOnly) {
      params.verifiedOnly = true;
    }

    // Add sort option (always include)
    if (formValue.sortBy) {
      params.sortBy = formValue.sortBy;
    }

    return params;
  }

  /**
   * Apply initial filter values to form
   * Note: Keywords are not included (handled by parent)
   * @param filters Initial filter parameters
   */
  private applyInitialFilters(filters: MentorSearchParams): void {
    this.filtersForm.patchValue({
      categoryId: filters.categoryId || null,
      minPrice: filters.minPrice || this.MIN_PRICE,
      maxPrice: filters.maxPrice || this.MAX_PRICE,
      minRating: filters.minRating || null,
      availableOnly: filters.availableOnly || false,
      verifiedOnly: filters.verifiedOnly || false,
      sortBy: filters.sortBy || 'rating'
    }, { emitEvent: false }); // Don't emit on initialization
  }

  /**
   * Reset all filters to default values
   * Note: Does not reset search keywords (handled by parent)
   */
  onResetFilters(): void {
    this.filtersForm.reset({
      categoryId: null,
      minPrice: this.MIN_PRICE,
      maxPrice: this.MAX_PRICE,
      minRating: null,
      availableOnly: false,
      verifiedOnly: false,
      sortBy: 'rating'
    });

    // Emit empty filters
    this.filtersChange.emit({});
  }

  /**
   * Toggle panel collapse state (desktop)
   */
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  /**
   * Toggle mobile panel (emits to parent)
   */
  onMobileToggle(): void {
    this.mobileToggle.emit();
  }

  /**
   * Toggle advanced filters section
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Get active filter count for badge display
   * Note: Does not count search keywords (handled by parent)
   */
  get activeFilterCount(): number {
    const formValue = this.filtersForm.value;
    let count = 0;

    if (formValue.categoryId) count++;
    if (formValue.minPrice > this.MIN_PRICE) count++;
    if (formValue.maxPrice < this.MAX_PRICE) count++;
    if (formValue.minRating) count++;
    if (formValue.availableOnly) count++;
    if (formValue.verifiedOnly) count++;

    return count;
  }

  /**
   * Check if any filters are active (for reset button state)
   */
  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  /**
   * Get min price display value
   */
  get minPriceDisplay(): number {
    return this.filtersForm.get('minPrice')?.value || this.MIN_PRICE;
  }

  /**
   * Get max price display value
   */
  get maxPriceDisplay(): number {
    return this.filtersForm.get('maxPrice')?.value || this.MAX_PRICE;
  }

  /**
   * Handle min price input change
   * Ensures min price doesn't exceed max price
   */
  onMinPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const minPrice = parseInt(input.value, 10);
    const maxPrice = this.filtersForm.get('maxPrice')?.value;

    if (minPrice > maxPrice) {
      this.filtersForm.patchValue({ minPrice: maxPrice }, { emitEvent: true });
    }
  }

  /**
   * Handle max price input change
   * Ensures max price doesn't go below min price
   */
  onMaxPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const maxPrice = parseInt(input.value, 10);
    const minPrice = this.filtersForm.get('minPrice')?.value;

    if (maxPrice < minPrice) {
      this.filtersForm.patchValue({ maxPrice: minPrice }, { emitEvent: true });
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return `$${price}`;
  }

  /**
   * Get sorted and active categories
   */
  get activeCategories(): Category[] {
    return this.categories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get form control for template access
   */
  get f() {
    return this.filtersForm.controls;
  }
}
