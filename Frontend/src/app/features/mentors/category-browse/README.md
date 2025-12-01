# CategoryBrowseComponent

**Component**: `app-category-browse`  
**Location**: `Frontend/src/app/features/mentors/category-browse/`  
**User Story**: US2 - Browse and Search for Mentors (Task T095)

## Overview

The CategoryBrowseComponent displays mentorship categories in a responsive grid layout, allowing users to browse mentors by specialization areas. This component is part of the mentor discovery system and integrates with the existing CategoryService for data management.

## Features

- **Responsive Grid Layout**: Adapts from 1 to 4 columns based on screen size
- **Category Cards**: Display icon, name, description, and mentor count
- **Interactive Navigation**: Click categories to view filtered mentor lists
- **Loading States**: Smooth loading indicators during data fetch
- **Error Handling**: User-friendly error messages with retry functionality
- **Empty States**: Helpful messaging when no categories are available
- **Dark Mode Support**: Full compatibility with light/dark themes
- **Accessibility**: ARIA attributes and keyboard navigation support
- **Performance**: Utilizes cached categories from CategoryService

## Styling

- **Design System**: Follows CareerRoute-MVP-Design specifications
- **Primary Color**: #1193d4 (CareerRoute blue)
- **Typography**: Manrope font family
- **Framework**: Tailwind CSS with custom utility classes
- **Responsive**: Mobile-first approach with breakpoints:
  - Mobile: 1 column
  - Tablet: 2 columns  
  - Desktop: 3 columns
  - Large Desktop: 4 columns

## Component API

### Inputs

No required inputs. Component is self-contained and fetches data automatically.

### Outputs

No outputs. Navigation is handled internally through Angular Router.

### Dependencies

- `CategoryService`: For fetching and managing category data
- `Router`: For navigation to mentor lists
- `CommonModule`: Angular common directives

## Usage Examples

### Basic Usage

```html
<!-- In a component template or route -->
<app-category-browse></app-category-browse>
```

### In a Route Configuration

```typescript
// In app.routes.ts
{
  path: 'browse-categories',
  component: CategoryBrowseComponent,
  title: 'Browse Categories - CareerRoute'
}
```

### With Navigation

```html
<!-- Navigation menu item -->
<a routerLink="/browse-categories" class="nav-link">
  Browse Categories
</a>
```

## Data Flow

1. **Component Initialization**: `ngOnInit()` triggers data loading
2. **Service Integration**: Uses `CategoryService.getAllCategories()` 
3. **Caching**: Leverages service-level caching for performance
4. **State Management**: Tracks loading, error, and data states
5. **User Interaction**: Category clicks navigate to `/mentors` with query params

## Navigation Behavior

When a user clicks on a category:

```typescript
// Navigation parameters
{
  queryParams: {
    categoryId: category.id,
    categoryName: category.name
  }
}
```

This allows the MentorListComponent to filter mentors by the selected category.

## Error Handling

- **Network Errors**: Displays error message with retry button
- **Empty Data**: Shows helpful empty state illustration
- **Invalid Categories**: Graceful handling of malformed data
- **Service Failures**: Fallback to cached data when available

## Performance Considerations

- **Observable Management**: Proper subscription cleanup in `ngOnDestroy`
- **TrackBy Functions**: Optimized ngFor with `trackByCategoryId`
- **Service Caching**: Leverages CategoryService built-in caching
- **Lazy Loading**: Component loads data only when initialized

## Testing

Comprehensive unit tests included in `category-browse.component.spec.ts`:

- Component initialization and lifecycle
- Data loading and error scenarios
- User interactions and navigation
- Helper method functionality
- Template rendering and state changes
- Edge cases and error conditions
- Observable subscription management

### Test Coverage Areas

- ✅ Component creation and initialization
- ✅ Data loading from CategoryService
- ✅ Error handling and display
- ✅ Loading state management
- ✅ Category click navigation
- ✅ Helper method functionality
- ✅ Template rendering for all states
- ✅ Observable cleanup
- ✅ Edge cases and invalid inputs

## Integration Points

### With CategoryService

```typescript
// Service methods used
categoryService.getAllCategories()
categoryService.refreshCategories()
categoryService.categories$ (observable)
categoryService.loading$ (observable)
```

### With Router

```typescript
// Navigation calls
router.navigate(['/mentors'], { queryParams: {...} })
```

### With MentorListComponent

The component passes category information to the mentor list via query parameters:
- `categoryId`: Numeric ID for filtering
- `categoryName`: Display name for UI context

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and section structure
- **ARIA Labels**: Screen reader friendly content descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: WCAG compliant color combinations
- **Test IDs**: Added for automated testing accessibility

## Browser Compatibility

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design works on all mobile devices
- **Dark Mode**: Automatic system preference detection
- **Touch Interactions**: Optimized for touch screen navigation

## Future Enhancements

Potential improvements for future iterations:

- **Search Integration**: Add category search functionality
- **Filter Options**: Allow filtering by mentor count or availability
- **Category Management**: Admin interface for category CRUD operations
- **Analytics Integration**: Track category browsing behavior
- **Personalization**: Recommended categories based on user profile

## Troubleshooting

### Common Issues

1. **Categories Not Loading**
   - Check CategoryService connectivity
   - Verify API endpoint accessibility
   - Check network connection

2. **Navigation Not Working**
   - Ensure Router module is imported
   - Check route configuration
   - Verify query parameter handling

3. **Styling Issues**
   - Confirm Tailwind CSS is properly configured
   - Check Material Symbols font loading
   - Verify CSS custom properties

### Debug Mode

Enable debug logging by checking browser console for:
- Category loading errors
- Navigation failures
- Service integration issues

## Files Structure

```
category-browse/
├── category-browse.component.ts      # Component logic
├── category-browse.component.html    # Template
├── category-browse.component.css     # Styles
├── category-browse.component.spec.ts # Unit tests
└── README.md                         # This documentation
```

## Dependencies

```json
{
  "@angular/core": "^20.3.0",
  "@angular/common": "^20.3.0", 
  "@angular/router": "^20.3.0",
  "rxjs": "^7.8.0",
  "tailwindcss": "^3.4.0"
}
```

## Related Components

- **MentorListComponent**: Displays filtered mentor results
- **CategoryService**: Provides category data management
- **PaginationComponent**: Handles paginated mentor lists
- **SearchComponent**: Global mentor search functionality
