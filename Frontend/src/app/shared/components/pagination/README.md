# Pagination Component

## Overview

The `PaginationComponent` is a reusable pagination control for displaying paged data in the CareerRoute application. It provides intuitive navigation through large datasets with page numbers, prev/next buttons, and an optional page size selector.

## Location

```
Frontend/src/app/shared/components/pagination/
├── pagination.component.ts       # Component logic
├── pagination.component.html     # Template
├── pagination.component.css      # Styles
├── pagination.component.spec.ts  # Unit tests
└── README.md                     # This file
```

## Features

### Core Functionality
- ✅ **Smart Page Display** - Shows relevant page numbers with ellipsis for large page counts
- ✅ **Boundary Controls** - Previous/Next buttons with automatic disable at boundaries
- ✅ **Current Page Highlight** - Visual indicator for active page
- ✅ **Page Size Selector** - Optional dropdown to change items per page
- ✅ **Item Range Display** - Shows "Showing X to Y of Z results"
- ✅ **Responsive Design** - Adapts layout for mobile, tablet, and desktop
- ✅ **Accessibility** - ARIA attributes, keyboard navigation, screen reader support
- ✅ **Dark Mode Support** - Automatic theme switching
- ✅ **Zero State Handling** - Graceful display when no results

### Pagination Logic
- Calculates total pages automatically
- Maintains current page within valid range
- Adjusts current page when page size changes
- Prevents navigation beyond boundaries
- Optimizes visible page numbers for readability

## Usage

### Basic Integration

Import and use in your component:

```typescript
import { PaginationComponent } from '@app/shared/components/pagination/pagination.component';

@Component({
  selector: 'app-mentor-list',
  imports: [PaginationComponent],
  template: `
    <div class="mentor-grid">
      <!-- Your content here -->
    </div>
    
    <app-pagination
      [totalItems]="totalMentors"
      [currentPage]="currentPage"
      [pageSize]="pageSize"
      (pageChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)">
    </app-pagination>
  `
})
export class MentorListComponent {
  totalMentors = 156;
  currentPage = 1;
  pageSize = 10;

  onPageChange(page: number): void {
    this.currentPage = page;
    // Fetch new data for this page
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    // Fetch new data with new page size
  }
}
```

### Advanced Configuration

```typescript
<app-pagination
  [totalItems]="200"
  [currentPage]="5"
  [pageSize]="20"
  [showPageSizeSelector]="true"
  [pageSizeOptions]="[10, 20, 50, 100]"
  [maxVisiblePages]="7"
  (pageChange)="handlePageChange($event)"
  (pageSizeChange)="handlePageSizeChange($event)">
</app-pagination>
```

### With Search/Filter State

```typescript
@Component({
  template: `
    <app-pagination
      [totalItems]="searchResults.totalCount"
      [currentPage]="searchState.page"
      [pageSize]="searchState.pageSize"
      (pageChange)="updateSearchPage($event)"
      (pageSizeChange)="updateSearchPageSize($event)">
    </app-pagination>
  `
})
export class SearchComponent {
  searchResults = { totalCount: 0, items: [] };
  searchState = { page: 1, pageSize: 10 };

  updateSearchPage(page: number): void {
    this.searchState.page = page;
    this.performSearch();
  }

  updateSearchPageSize(size: number): void {
    this.searchState.pageSize = size;
    this.searchState.page = 1; // Reset to first page
    this.performSearch();
  }
}
```

## Component API

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `totalItems` | `number` | `0` | Total number of items in the dataset |
| `currentPage` | `number` | `1` | Current active page (1-indexed) |
| `pageSize` | `number` | `10` | Number of items per page |
| `showPageSizeSelector` | `boolean` | `true` | Whether to show page size dropdown |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | Available page size options |
| `maxVisiblePages` | `number` | `5` | Maximum page buttons to display |

### Outputs

| Event | Payload | Description |
|-------|---------|-------------|
| `pageChange` | `number` | Emitted when user navigates to a different page |
| `pageSizeChange` | `number` | Emitted when user changes page size |

### Public Properties (Computed)

| Property | Type | Description |
|----------|------|-------------|
| `totalPages` | `number` | Total number of pages (calculated) |
| `visiblePages` | `(number \| string)[]` | Array of page numbers and ellipsis to display |
| `startItem` | `number` | Index of first item on current page |
| `endItem` | `number` | Index of last item on current page |

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `goToPage(page)` | `page: number` | `void` | Navigate to specific page |
| `previousPage()` | - | `void` | Navigate to previous page |
| `nextPage()` | - | `void` | Navigate to next page |
| `hasPreviousPage()` | - | `boolean` | Check if previous page exists |
| `hasNextPage()` | - | `boolean` | Check if next page exists |
| `isCurrentPage(page)` | `page: number \| string` | `boolean` | Check if page is current |
| `isEllipsis(page)` | `page: number \| string` | `boolean` | Check if page item is ellipsis |

## Pagination Algorithm

### Visible Pages Calculation

The component uses a smart algorithm to display page numbers:

**For small page counts (≤ 7 pages):**
```
[1] [2] [3] [4] [5] [6] [7]
```

**For large page counts at start:**
```
[1] [2] [3] ... [20]
```

**For large page counts in middle:**
```
[1] ... [8] [9] [10] ... [20]
```

**For large page counts at end:**
```
[1] ... [18] [19] [20]
```

### Page Size Change Behavior

When page size changes, the component intelligently adjusts the current page to keep the first item of the current page visible:

**Example:**
- Currently on page 3 (items 21-30) with pageSize=10
- Change to pageSize=20
- New page becomes 2 (items 21-40)

This prevents jarring jumps in content position.

## Styling

### Design Tokens

The component uses CareerRoute design system tokens:

```css
/* Primary Color */
--primary: #1193d4

/* Background Colors */
--background-light: #f6f7f8
--background-dark: #101c22

/* Font Family */
font-family: 'Manrope', sans-serif
```

### Customization

Override styles in your component or global stylesheet:

```css
/* Custom button size */
app-pagination button {
  height: 2.5rem;
  width: 2.5rem;
}

/* Custom active page color */
app-pagination .bg-primary {
  background-color: #your-color;
}

/* Custom spacing */
app-pagination nav {
  gap: 0.5rem;
}
```

### Responsive Breakpoints

- **Mobile**: < 640px (stacked layout)
- **Tablet**: 640px - 1024px (adjusted spacing)
- **Desktop**: ≥ 1024px (horizontal layout)

## Testing

### Run Unit Tests

```bash
ng test --include='**/pagination.component.spec.ts'
```

### Test Coverage

The component has **50+ unit tests** covering:

- ✅ Pagination calculation (total pages, item ranges)
- ✅ Visible pages algorithm (ellipsis logic)
- ✅ Navigation (next, previous, specific page)
- ✅ Page size changes
- ✅ Boundary conditions (first/last page)
- ✅ Edge cases (zero items, single page, invalid inputs)
- ✅ Event emissions
- ✅ Template rendering
- ✅ Button states (enabled/disabled)
- ✅ Helper methods
- ✅ Input validation

### Manual Testing Checklist

- [ ] Pagination displays correctly with data
- [ ] Page numbers are clickable and work
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] Current page is highlighted
- [ ] Ellipsis appears for large page counts
- [ ] Page size selector changes items per page
- [ ] Item range displays correctly (e.g., "Showing 11-20 of 156")
- [ ] Zero state shows "No results found"
- [ ] Responsive layout works on mobile
- [ ] Dark mode theme applies correctly
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces page changes

## Accessibility

### ARIA Attributes

- `aria-label="Pagination"` - Navigation container
- `aria-label="Go to page X"` - Page buttons
- `aria-label="Go to previous page"` - Previous button
- `aria-label="Go to next page"` - Next button
- `aria-current="page"` - Current page indicator
- `aria-hidden="true"` - Ellipsis (not interactive)

### Keyboard Support

- **Tab** - Navigate between page buttons
- **Enter/Space** - Activate page button
- **Tab** - Navigate to page size selector
- **Arrow Keys** - Navigate dropdown options

### Screen Reader Support

- Descriptive labels on all buttons
- Current page announced with `aria-current`
- Page size changes announced
- Disabled buttons indicated

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

### Optimizations

- **OnChanges Lifecycle** - Recalculates only when inputs change
- **TrackBy Function** - Optimizes ngFor rendering
- **Pure Calculations** - No side effects in methods
- **CSS Transforms** - Hardware-accelerated animations
- **Minimal Re-renders** - Smart change detection

### Bundle Size

- Component: ~4KB (minified)
- Template: ~3KB (minified)
- Styles: ~2KB (minified)
- **Total**: ~9KB

## Examples

### Example 1: Mentor Search Results

```typescript
<app-pagination
  [totalItems]="mentorSearchResults.totalCount"
  [currentPage]="currentPage"
  [pageSize]="10"
  (pageChange)="loadMentors($event)">
</app-pagination>
```

### Example 2: Job Listings

```typescript
<app-pagination
  [totalItems]="jobs.length"
  [currentPage]="page"
  [pageSize]="20"
  [pageSizeOptions]="[20, 50, 100]"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-pagination>
```

### Example 3: Admin User Management

```typescript
<app-pagination
  [totalItems]="users.totalCount"
  [currentPage]="filters.page"
  [pageSize]="filters.pageSize"
  [showPageSizeSelector]="true"
  [maxVisiblePages]="7"
  (pageChange)="updateFilters({ page: $event })"
  (pageSizeChange)="updateFilters({ pageSize: $event, page: 1 })">
</app-pagination>
```

## Troubleshooting

### Common Issues

#### Pagination not appearing
**Solution**: Ensure `totalItems` is greater than `pageSize`
```typescript
// Component will only render if totalPages > 1
totalItems = 100;
pageSize = 10; // Results in 10 pages, pagination shows
```

#### Page numbers not updating
**Solution**: Ensure you're updating the `currentPage` input after page change
```typescript
onPageChange(page: number): void {
  this.currentPage = page; // Update the input
  this.loadData(page);
}
```

#### Styles not applying
**Solution**: Check Tailwind configuration includes component path
```javascript
content: ["./src/**/*.{html,ts}"]
```

#### Events not firing
**Solution**: Verify event handlers are bound correctly
```html
<!-- Correct -->
(pageChange)="onPageChange($event)"

<!-- Incorrect -->
(pageChange)="onPageChange()"
```

#### Page size change causes errors
**Solution**: Handle both events and reset page to 1
```typescript
onPageSizeChange(size: number): void {
  this.pageSize = size;
  this.currentPage = 1; // Reset to first page
  this.loadData();
}
```

## Integration with Backend APIs

### Typical API Response Structure

```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### Example Service Integration

```typescript
@Injectable()
export class MentorService {
  searchMentors(query: string, page: number, pageSize: number): Observable<PaginatedResponse<Mentor>> {
    return this.http.get<PaginatedResponse<Mentor>>('/api/mentors', {
      params: { query, page: page.toString(), pageSize: pageSize.toString() }
    });
  }
}

// Component usage
loadMentors(page: number): void {
  this.mentorService.searchMentors(this.query, page, this.pageSize)
    .subscribe(response => {
      this.mentors = response.items;
      this.totalItems = response.totalCount;
      this.currentPage = response.page;
    });
}
```

## Best Practices

### 1. Always Update Current Page
```typescript
// ✅ Good
onPageChange(page: number): void {
  this.currentPage = page;
  this.fetchData();
}

// ❌ Bad
onPageChange(page: number): void {
  this.fetchData(); // currentPage not updated
}
```

### 2. Reset Page on Filter Changes
```typescript
// ✅ Good
onFilterChange(): void {
  this.currentPage = 1; // Reset to first page
  this.fetchData();
}
```

### 3. Handle Loading States
```typescript
// ✅ Good
loadData(page: number): void {
  this.loading = true;
  this.service.getData(page).subscribe(data => {
    this.items = data.items;
    this.totalItems = data.totalCount;
    this.loading = false;
  });
}
```

### 4. Preserve Scroll Position
```typescript
// ✅ Good
onPageChange(page: number): void {
  this.currentPage = page;
  this.fetchData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

## Related Components

- **MentorListComponent** - Uses pagination for mentor results (T091)
- **MentorCardComponent** - Displays individual mentor items (T092)
- **FiltersPanelComponent** - Works with pagination for filtered results (T098)

## US2 Integration

This component is part of **User Story 2 - Browse and Search for Mentors**:

- **Task ID**: T096
- **Dependencies**: None (standalone component)
- **Used By**: T091 (MentorListComponent)
- **Priority**: P1 (can run in parallel)

## Future Enhancements

### Planned Features
- [ ] Jump to page input field
- [ ] Infinite scroll mode
- [ ] Server-side pagination metadata
- [ ] URL query param sync
- [ ] Pagination presets (compact, full)
- [ ] Custom templates for buttons
- [ ] Animation transitions

### Performance Improvements
- [ ] Virtual scrolling integration
- [ ] OnPush change detection strategy
- [ ] Lazy loading for large datasets
- [ ] Debounced page size changes

## Contributing

When modifying this component:

1. **Update tests** - Maintain 100% test coverage
2. **Follow style guide** - Use existing patterns
3. **Test accessibility** - Verify ARIA and keyboard navigation
4. **Test responsive** - Check mobile, tablet, desktop
5. **Update documentation** - Keep this README current
6. **Test edge cases** - Zero items, single page, large numbers

## License

Part of the CareerRoute application.

---

## Quick Reference

### Import
```typescript
import { PaginationComponent } from '@app/shared/components/pagination/pagination.component';
```

### Template
```html
<app-pagination
  [totalItems]="total"
  [currentPage]="page"
  [pageSize]="size"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-pagination>
```

### Selector
```
app-pagination
```

### Type
Standalone Component

### Change Detection
Default (OnChanges lifecycle)

---

**Last Updated**: November 9, 2025  
**Version**: 1.0.0  
**Task**: T096 - PaginationComponent  
**User Story**: US2 - Browse and Search for Mentors  
**Author**: CareerRoute Development Team
