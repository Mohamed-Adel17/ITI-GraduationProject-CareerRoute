# Mentor Profile Form Component

## Overview

The `MentorProfileFormComponent` is a comprehensive form component for creating and editing mentor profiles in the CareerRoute application. It handles mentor-specific fields including bio, expertise tags, years of experience, certifications, session rates, and category selections.

## Location

```
Frontend/src/app/features/mentors/mentor-profile/
├── mentor-profile-form.component.ts       # Component logic
├── mentor-profile-form.component.html     # Template
├── mentor-profile-form.component.css      # Styles
├── mentor-profile-form.component.spec.ts  # Unit tests
└── README.md                              # This file
```

## Features

### Core Functionality
- ✅ **Dual Mode Operation** - Create new mentor profile or edit existing profile
- ✅ **Comprehensive Validation** - Real-time form validation with detailed error messages
- ✅ **Pricing Validation** - Business rule enforcement for session rates ($20-$500)
- ✅ **Expertise Tags Management** - Comma-separated tags with preview
- ✅ **Category Selection** - Multi-select categories with visual feedback
- ✅ **Character Counting** - Real-time bio character count with warnings
- ✅ **Rate Calculator** - Suggested 60-min rate based on 30-min rate
- ✅ **Responsive Design** - Mobile-first design with desktop optimization
- ✅ **Accessibility** - ARIA attributes, keyboard navigation, screen reader support

### Validation Rules

#### Bio
- **Required**: Yes
- **Min Length**: 100 characters
- **Max Length**: 2000 characters
- **Purpose**: Professional introduction and background

#### Expertise Tags
- **Required**: Yes
- **Min Tags**: 2
- **Max Tags**: 20
- **Max Tag Length**: 50 characters per tag
- **Format**: Comma-separated (e.g., "React, Node.js, AWS")

#### Years of Experience
- **Required**: Yes
- **Min**: 0 years
- **Max**: 50 years
- **Type**: Integer

#### Certifications
- **Required**: No
- **Format**: Comma-separated string

#### Session Rates
- **30-Min Rate**:
  - Required: Yes
  - Min: $20
  - Max**: $500
  
- **60-Min Rate**:
  - Required: Yes
  - Min: $20
  - Max: $500
  - Must be higher than 30-min rate
  - Suggested: 1.8x the 30-min rate

#### Categories
- **Required**: Yes
- **Min Selection**: 1 category
- **Type**: Multi-select

## Usage

### Basic Integration

```typescript
import { MentorProfileFormComponent } from '@app/features/mentors/mentor-profile/mentor-profile-form.component';
import { MentorCategory } from '@app/shared/models/mentor.model';

@Component({
  imports: [MentorProfileFormComponent],
  template: `
    <app-mentor-profile-form
      [mode]="'create'"
      [categories]="categories"
      (formSubmit)="onSubmit($event)"
      (formCancel)="onCancel()">
    </app-mentor-profile-form>
  `
})
export class ApplyMentorComponent {
  categories: MentorCategory[] = [
    { id: 1, name: 'Software Development' },
    { id: 2, name: 'Data Science' }
  ];

  onSubmit(data: MentorApplication) {
    this.mentorService.applyToBecomeMentor(data).subscribe(
      (mentor) => console.log('Application submitted:', mentor),
      (error) => console.error('Error:', error)
    );
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}
```

### Edit Mode

```typescript
@Component({
  imports: [MentorProfileFormComponent],
  template: `
    <app-mentor-profile-form
      [mode]="'edit'"
      [mentor]="currentMentor"
      [categories]="categories"
      (formSubmit)="onUpdate($event)"
      (formCancel)="onCancel()">
    </app-mentor-profile-form>
  `
})
export class EditMentorProfileComponent {
  currentMentor: Mentor;
  categories: MentorCategory[];

  onUpdate(data: MentorProfileUpdate) {
    this.mentorService.updateMentorProfile(this.currentMentor.id, data).subscribe(
      (mentor) => {
        this.notificationService.success('Profile updated successfully');
        this.router.navigate(['/mentor/profile']);
      }
    );
  }
}
```

## Component API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `mentor` | `Mentor \| null` | `null` | Existing mentor profile for edit mode |
| `categories` | `MentorCategory[]` | `[]` | Available categories for selection |
| `mode` | `'create' \| 'edit'` | `'create'` | Form operation mode |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `formSubmit` | `EventEmitter<MentorProfileUpdate \| MentorApplication>` | Emitted when form is submitted with valid data |
| `formCancel` | `EventEmitter<void>` | Emitted when user cancels the form |

### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `resetForm()` | - | `void` | Reset form to initial state |
| `setSubmitting(submitting)` | `submitting: boolean` | `void` | Set submitting state externally |
| `getExpertiseTags()` | - | `string[]` | Get parsed expertise tags as array |
| `getSuggestedRate60Min()` | - | `number` | Calculate suggested 60-min rate |
| `applySuggestedRate()` | - | `void` | Apply suggested 60-min rate to form |
| `getBioCharCount()` | - | `number` | Get current bio character count |
| `isBioNearLimit()` | - | `boolean` | Check if bio is approaching character limit |
| `toggleCategory(categoryId)` | `categoryId: number` | `void` | Toggle category selection |
| `isCategorySelected(categoryId)` | `categoryId: number` | `boolean` | Check if category is selected |

## Form Structure

### Professional Bio Section
- Large textarea for professional introduction
- Character counter with warning at 100 chars remaining
- Real-time validation feedback

### Expertise & Experience Section
- Expertise tags input with comma-separated format
- Tag preview with styled badges
- Years of experience number input
- Optional certifications field

### Pricing Section
- Collapsible pricing guidelines
- 30-minute session rate input
- 60-minute session rate input
- Suggested rate calculator
- Pricing validation with detailed error messages

### Categories Section
- Grid of selectable category cards
- Visual checkbox indicators
- Multi-select support
- Category descriptions

### Availability Section (Edit Mode Only)
- Checkbox to toggle availability for new bookings
- Only shown in edit mode

## Validation

### Real-Time Validation
- All fields validate on blur and on change
- Error messages appear below invalid fields
- Form-level validation for pricing logic
- Visual indicators (red borders) for invalid fields

### Pricing Business Rules
1. Both rates must be between $20 and $500
2. 60-minute rate must be higher than 30-minute rate
3. Recommended 60-min rate is 1.8x the 30-min rate
4. Warning shown if 60-min rate exceeds 2x the 30-min rate

### Error Messages
- **Bio**: "Bio must be at least 100 characters (currently X)"
- **Tags**: "Please enter at least 2 expertise tags"
- **Experience**: "Minimum 0 years"
- **Rates**: "Minimum rate is $20"
- **Categories**: "Please select at least one category"
- **Pricing**: "60-minute rate must be higher than 30-minute rate"

## Styling

### Design System
The component uses CareerRoute design tokens:
- **Primary Color**: `#1193d4`
- **Font Family**: Manrope
- **Border Radius**: 0.5rem (lg)
- **Spacing**: Tailwind spacing scale

### Animations
- **Form Fade In**: 0.3s ease-in
- **Section Slide In**: 0.4s ease-out
- **Category Pulse**: 0.3s on selection
- **Tag Fade In**: 0.2s on add
- **Error Shake**: 0.3s on validation error

### Responsive Breakpoints
- **Mobile**: < 640px (single column, full width buttons)
- **Tablet**: 640px - 1024px (adjusted grid)
- **Desktop**: ≥ 1024px (two-column rate inputs, three-column categories)

## Testing

### Run Unit Tests

```bash
ng test --include='**/mentor-profile-form.component.spec.ts'
```

### Test Coverage

The component has **50+ unit tests** covering:

- ✅ Form initialization (create and edit modes)
- ✅ Bio validation (required, min/max length)
- ✅ Expertise tags validation (min/max tags, format)
- ✅ Experience validation (min/max values)
- ✅ Pricing validation (business rules)
- ✅ Category selection (toggle, multi-select)
- ✅ Form submission (valid/invalid states)
- ✅ Form cancellation
- ✅ Form reset
- ✅ Error messages
- ✅ Helper methods
- ✅ Rendering (create/edit modes)

### Manual Testing Checklist

- [ ] Form loads with correct mode (create/edit)
- [ ] All fields render correctly
- [ ] Bio character counter updates in real-time
- [ ] Expertise tags parse and display correctly
- [ ] Pricing validation enforces business rules
- [ ] Suggested rate calculator works
- [ ] Categories can be selected/deselected
- [ ] Form validates on submit
- [ ] Error messages display correctly
- [ ] Cancel button works
- [ ] Form resets properly
- [ ] Responsive design works on mobile
- [ ] Dark mode styling applies correctly
- [ ] Accessibility features work (keyboard nav, screen reader)

## Integration Example

### Complete Parent Component

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MentorProfileFormComponent } from './mentor-profile-form.component';
import { MentorService } from '@app/core/services/mentor.service';
import { NotificationService } from '@app/core/services/notification.service';
import { 
  MentorApplication, 
  MentorProfileUpdate,
  MentorCategory 
} from '@app/shared/models/mentor.model';

@Component({
  selector: 'app-mentor-application-page',
  imports: [MentorProfileFormComponent],
  template: `
    <div class="container mx-auto py-8">
      <app-mentor-profile-form
        #mentorForm
        [mode]="'create'"
        [categories]="categories"
        (formSubmit)="onSubmit($event)"
        (formCancel)="onCancel()">
      </app-mentor-profile-form>
    </div>
  `
})
export class MentorApplicationPageComponent implements OnInit {
  @ViewChild('mentorForm') mentorForm!: MentorProfileFormComponent;
  
  categories: MentorCategory[] = [];

  constructor(
    private mentorService: MentorService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    // Load categories from API or service
    this.categories = [
      { id: 1, name: 'Software Development', description: 'Web and mobile development' },
      { id: 2, name: 'Data Science', description: 'ML, AI, and analytics' },
      { id: 3, name: 'DevOps', description: 'CI/CD and cloud infrastructure' }
    ];
  }

  onSubmit(data: MentorApplication): void {
    this.mentorForm.setSubmitting(true);

    this.mentorService.applyToBecomeMentor(data).subscribe({
      next: (mentor) => {
        this.notificationService.success(
          'Your mentor application has been submitted successfully! We will review it and get back to you soon.',
          'Application Submitted'
        );
        this.router.navigate(['/mentor/application-pending']);
      },
      error: (error) => {
        this.mentorForm.setSubmitting(false);
        this.notificationService.error(
          error.message || 'Failed to submit application. Please try again.',
          'Submission Failed'
        );
      }
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/']);
    }
  }
}
```

## Accessibility

### ARIA Attributes
- Form fields have proper labels with `for` attributes
- Required fields marked with `aria-required="true"`
- Error messages linked with `aria-describedby`
- Category buttons have `role="checkbox"` and `aria-checked`

### Keyboard Navigation
- **Tab**: Navigate between form fields
- **Enter/Space**: Toggle category selection
- **Shift+Tab**: Navigate backwards
- All interactive elements are keyboard accessible

### Screen Reader Support
- Descriptive labels for all inputs
- Error messages announced on validation
- Character count updates announced
- Form submission status announced

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

### Optimizations
- Reactive forms for efficient change detection
- Debounced validation for text inputs
- Lazy validation (on blur/touch)
- Minimal re-renders with OnPush strategy (can be enabled)

### Bundle Size
- Component: ~8KB (minified)
- Template: ~12KB (minified)
- Styles: ~3KB (minified)
- **Total**: ~23KB

## Troubleshooting

### Common Issues

#### Form not submitting
**Solution**: Check browser console for validation errors. Ensure all required fields are filled.

#### Pricing validation failing
**Solution**: Verify 60-min rate is higher than 30-min rate and both are within $20-$500 range.

#### Categories not loading
**Solution**: Ensure `categories` input is provided and is a valid array.

#### Expertise tags not parsing
**Solution**: Use comma-separated format. Spaces around commas are automatically trimmed.

#### Form not resetting
**Solution**: Call `resetForm()` method or use ViewChild to access component instance.

## Future Enhancements

### Planned Features
- [ ] Rich text editor for bio
- [ ] Drag-and-drop tag management
- [ ] Rate comparison with similar mentors
- [ ] Auto-save draft functionality
- [ ] Image upload for certifications
- [ ] Video introduction upload
- [ ] Availability calendar integration
- [ ] Multi-language support

### Performance Improvements
- [ ] OnPush change detection strategy
- [ ] Virtual scrolling for large category lists
- [ ] Form state persistence in localStorage
- [ ] Optimistic UI updates

## Contributing

When modifying this component:

1. **Update tests** - Maintain test coverage above 90%
2. **Follow validation rules** - Don't bypass business logic
3. **Test accessibility** - Verify keyboard nav and screen readers
4. **Test responsive** - Check mobile, tablet, desktop
5. **Update documentation** - Keep this README current

## Related Components

- **MentorProfileComponent** - Display mentor profile (to be created)
- **MentorApplicationStatusComponent** - Show application status (to be created)
- **MentorDashboardComponent** - Mentor dashboard (to be created)

## API Integration

### Create Mode (Apply to Become Mentor)

```typescript
POST /api/mentors
Content-Type: application/json

{
  "bio": "string (100-2000 chars)",
  "expertiseTags": ["string", "string"],
  "yearsOfExperience": number (0-50),
  "certifications": "string (optional)",
  "rate30Min": number (20-500),
  "rate60Min": number (20-500),
  "categoryIds": [number, number]
}
```

### Edit Mode (Update Mentor Profile)

```typescript
PUT /api/mentors/{id}
Content-Type: application/json

{
  "bio": "string",
  "expertiseTags": ["string"],
  "yearsOfExperience": number,
  "certifications": "string",
  "rate30Min": number,
  "rate60Min": number,
  "categoryIds": [number],
  "isAvailable": boolean
}
```

## License

Part of the CareerRoute application.

---

## Quick Reference

### Import
```typescript
import { MentorProfileFormComponent } from '@app/features/mentors/mentor-profile/mentor-profile-form.component';
```

### Template
```html
<app-mentor-profile-form
  [mode]="'create'"
  [mentor]="mentor"
  [categories]="categories"
  (formSubmit)="onSubmit($event)"
  (formCancel)="onCancel()">
</app-mentor-profile-form>
```

### Selector
```
app-mentor-profile-form
```

### Type
Standalone Component

### Change Detection
Default (can be optimized to OnPush)

---

**Last Updated**: November 3, 2025  
**Version**: 1.0.0  
**Author**: CareerRoute Development Team
